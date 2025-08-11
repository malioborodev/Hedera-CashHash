// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CashHashInvoice.sol";
import "./CashHashBondEscrow.sol";

contract CashHashPayout is ReentrancyGuard, Ownable {
    CashHashInvoice public immutable invoiceContract;
    CashHashBondEscrow public immutable bondEscrow;
    
    enum PaymentStatus {
        PENDING,
        PARTIAL,
        PAID,
        DEFAULTED
    }
    
    struct Payment {
        uint256 totalAmountUSD;
        uint256 paidAmountUSD;
        PaymentStatus status;
        uint256 recordedAt;
        string paymentReference;
        bool isSettled;
    }
    
    struct InvestorShare {
        address investor;
        uint256 investedAmount;
        uint256 sharePercentage; // in basis points (10000 = 100%)
        bool hasClaimed;
        uint256 claimableAmount;
    }
    
    mapping(uint256 => Payment) public payments;
    mapping(uint256 => InvestorShare[]) public investorShares;
    mapping(uint256 => mapping(address => uint256)) public investorIndex;
    mapping(uint256 => uint256) public totalInvested;
    mapping(uint256 => bool) public isDefaulted;
    
    uint256 public constant GRACE_PERIOD = 10 days;
    uint256 public constant PLATFORM_FEE_BPS = 75; // 0.75%
    
    event PaymentRecorded(
        uint256 indexed invoiceId,
        uint256 paidAmount,
        uint256 totalAmount,
        string paymentReference,
        uint256 timestamp
    );
    
    event InvestmentRecorded(
        uint256 indexed invoiceId,
        address indexed investor,
        uint256 amount,
        uint256 sharePercentage
    );
    
    event PayoutSettled(
        uint256 indexed invoiceId,
        uint256 totalPayout,
        uint256 platformFee,
        uint256 investorCount,
        uint256 timestamp
    );
    
    event InvestorClaimed(
        uint256 indexed invoiceId,
        address indexed investor,
        uint256 amount,
        uint256 timestamp
    );
    
    event InvoiceDefaulted(
        uint256 indexed invoiceId,
        uint256 timestamp,
        uint256 gracePeriodEnd
    );
    
    constructor(address _invoiceContract, address _bondEscrow) {
        invoiceContract = CashHashInvoice(_invoiceContract);
        bondEscrow = CashHashBondEscrow(_bondEscrow);
    }
    
    function recordInvestment(
        uint256 invoiceId,
        address investor,
        uint256 amount
    ) external onlyOwner {
        require(!isDefaulted[invoiceId], "Invoice is defaulted");
        
        // Update total invested
        totalInvested[invoiceId] += amount;
        
        // Check if investor already exists
        uint256 index = investorIndex[invoiceId][investor];
        if (index == 0 && (investorShares[invoiceId].length == 0 || investorShares[invoiceId][0].investor != investor)) {
            // New investor
            investorShares[invoiceId].push(InvestorShare({
                investor: investor,
                investedAmount: amount,
                sharePercentage: 0, // Will be calculated during settlement
                hasClaimed: false,
                claimableAmount: 0
            }));
            investorIndex[invoiceId][investor] = investorShares[invoiceId].length;
        } else {
            // Existing investor - update amount
            uint256 actualIndex = index > 0 ? index - 1 : 0;
            investorShares[invoiceId][actualIndex].investedAmount += amount;
        }
        
        emit InvestmentRecorded(invoiceId, investor, amount, 0);
    }
    
    function recordBuyerPayment(
        uint256 invoiceId,
        uint256 paidAmountUSD,
        string memory paymentReference
    ) external onlyOwner {
        require(!isDefaulted[invoiceId], "Invoice is defaulted");
        
        CashHashInvoice.InvoiceTerms memory terms = invoiceContract.getInvoiceTerms(invoiceId);
        
        Payment storage payment = payments[invoiceId];
        payment.totalAmountUSD = terms.amountUSD;
        payment.paidAmountUSD += paidAmountUSD;
        payment.recordedAt = block.timestamp;
        payment.paymentReference = paymentReference;
        
        if (payment.paidAmountUSD >= payment.totalAmountUSD) {
            payment.status = PaymentStatus.PAID;
        } else if (payment.paidAmountUSD > 0) {
            payment.status = PaymentStatus.PARTIAL;
        }
        
        emit PaymentRecorded(
            invoiceId,
            paidAmountUSD,
            payment.totalAmountUSD,
            paymentReference,
            block.timestamp
        );
    }
    
    function settle(uint256 invoiceId) external payable nonReentrant onlyOwner {
        require(payments[invoiceId].status == PaymentStatus.PAID, "Payment not complete");
        require(!payments[invoiceId].isSettled, "Already settled");
        require(!isDefaulted[invoiceId], "Invoice is defaulted");
        
        Payment storage payment = payments[invoiceId];
        payment.isSettled = true;
        
        CashHashInvoice.InvoiceTerms memory terms = invoiceContract.getInvoiceTerms(invoiceId);
        
        // Calculate total payout including yield
        uint256 totalPayout = totalInvested[invoiceId] + 
            (totalInvested[invoiceId] * terms.yieldBps * terms.tenorDays) / (10000 * 365);
        
        // Calculate platform fee
        uint256 platformFee = (totalPayout * PLATFORM_FEE_BPS) / 10000;
        uint256 netPayout = totalPayout - platformFee;
        
        require(msg.value >= totalPayout, "Insufficient payout amount");
        
        // Calculate pro-rata shares
        InvestorShare[] storage shares = investorShares[invoiceId];
        for (uint256 i = 0; i < shares.length; i++) {
            shares[i].sharePercentage = (shares[i].investedAmount * 10000) / totalInvested[invoiceId];
            shares[i].claimableAmount = (netPayout * shares[i].sharePercentage) / 10000;
        }
        
        // Refund bond
        bondEscrow.refundBond(invoiceId);
        
        emit PayoutSettled(
            invoiceId,
            totalPayout,
            platformFee,
            shares.length,
            block.timestamp
        );
    }
    
    function claimPayout(uint256 invoiceId) external nonReentrant {
        require(payments[invoiceId].isSettled, "Not settled yet");
        require(!isDefaulted[invoiceId], "Invoice is defaulted");
        
        uint256 index = investorIndex[invoiceId][msg.sender];
        require(index > 0 || (investorShares[invoiceId].length > 0 && investorShares[invoiceId][0].investor == msg.sender), "Not an investor");
        
        uint256 actualIndex = index > 0 ? index - 1 : 0;
        InvestorShare storage share = investorShares[invoiceId][actualIndex];
        
        require(!share.hasClaimed, "Already claimed");
        require(share.claimableAmount > 0, "No claimable amount");
        
        uint256 claimAmount = share.claimableAmount;
        share.hasClaimed = true;
        share.claimableAmount = 0;
        
        payable(msg.sender).transfer(claimAmount);
        
        emit InvestorClaimed(invoiceId, msg.sender, claimAmount, block.timestamp);
    }
    
    function markDefault(uint256 invoiceId) external onlyOwner {
        CashHashInvoice.InvoiceTerms memory terms = invoiceContract.getInvoiceTerms(invoiceId);
        require(block.timestamp > terms.maturityDate + GRACE_PERIOD, "Grace period not expired");
        require(payments[invoiceId].status != PaymentStatus.PAID, "Invoice already paid");
        
        isDefaulted[invoiceId] = true;
        payments[invoiceId].status = PaymentStatus.DEFAULTED;
        
        // Slash bond
        bondEscrow.slashBond(invoiceId);
        
        emit InvoiceDefaulted(
            invoiceId,
            block.timestamp,
            terms.maturityDate + GRACE_PERIOD
        );
    }
    
    function getPayment(uint256 invoiceId) external view returns (Payment memory) {
        return payments[invoiceId];
    }
    
    function getInvestorShares(uint256 invoiceId) external view returns (InvestorShare[] memory) {
        return investorShares[invoiceId];
    }
    
    function getInvestorShare(uint256 invoiceId, address investor) external view returns (InvestorShare memory) {
        uint256 index = investorIndex[invoiceId][investor];
        if (index == 0 && investorShares[invoiceId].length > 0 && investorShares[invoiceId][0].investor == investor) {
            return investorShares[invoiceId][0];
        }
        require(index > 0, "Investor not found");
        return investorShares[invoiceId][index - 1];
    }
    
    function getTotalInvested(uint256 invoiceId) external view returns (uint256) {
        return totalInvested[invoiceId];
    }
    
    function isInvoiceDefaulted(uint256 invoiceId) external view returns (bool) {
        return isDefaulted[invoiceId];
    }
    
    function canMarkDefault(uint256 invoiceId) external view returns (bool) {
        CashHashInvoice.InvoiceTerms memory terms = invoiceContract.getInvoiceTerms(invoiceId);
        return block.timestamp > terms.maturityDate + GRACE_PERIOD && 
               payments[invoiceId].status != PaymentStatus.PAID;
    }
    
    // Emergency withdrawal for platform fees
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
}
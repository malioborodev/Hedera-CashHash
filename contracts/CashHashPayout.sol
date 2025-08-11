// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CashHashPayout is ReentrancyGuard, Ownable {
    struct Payout {
        uint256 invoiceId;
        uint256 amount;
        address exporter;
        address investor;
        uint256 createdAt;
        uint256 dueDate;
        bool isPaid;
        bool isDefaulted;
        uint256 platformFee;
    }

    struct YieldDistribution {
        uint256 payoutId;
        address investor;
        uint256 principal;
        uint256 yield;
        uint256 platformFee;
        uint256 totalAmount;
    }

    mapping(uint256 => Payout) public payouts;
    mapping(uint256 => YieldDistribution) public distributions;
    mapping(uint256 => uint256) public invoiceToPayout;
    mapping(address => uint256[]) public userPayouts;
    
    uint256 public nextPayoutId = 1;
    uint256 public platformFeeBPS = 75;
    address public platformWallet;
    address public invoiceToken;

    event PayoutCreated(
        uint256 indexed payoutId,
        uint256 indexed invoiceId,
        address indexed exporter,
        address investor,
        uint256 amount,
        uint256 dueDate
    );
    
    event PayoutDistributed(
        uint256 indexed payoutId,
        address indexed investor,
        uint256 principal,
        uint256 yield,
        uint256 platformFee
    );
    
    event PayoutDefaulted(
        uint256 indexed payoutId,
        address indexed investor,
        uint256 amount
    );

    constructor(address _invoiceToken, address _platformWallet) {
        invoiceToken = _invoiceToken;
        platformWallet = _platformWallet;
    }

    function createPayout(
        uint256 invoiceId,
        address exporter,
        address investor,
        uint256 amount,
        uint256 dueDate,
        uint256 yieldBPS
    ) external returns (uint256) {
        require(amount > 0, "Amount must be positive");
        require(dueDate > block.timestamp, "Due date must be in future");
        require(exporter != investor, "Exporter and investor cannot be same");
        require(invoiceToPayout[invoiceId] == 0, "Payout already exists for invoice");

        uint256 payoutId = nextPayoutId++;
        uint256 fee = (amount * platformFeeBPS) / 10000;

        payouts[payoutId] = Payout({
            invoiceId: invoiceId,
            amount: amount,
            exporter: exporter,
            investor: investor,
            createdAt: block.timestamp,
            dueDate: dueDate,
            isPaid: false,
            isDefaulted: false,
            platformFee: fee
        });

        uint256 yieldAmount = (amount * yieldBPS) / 10000;
        uint256 principal = amount - yieldAmount;
        uint256 totalAmount = principal + yieldAmount;

        distributions[payoutId] = YieldDistribution({
            payoutId: payoutId,
            investor: investor,
            principal: principal,
            yield: yieldAmount,
            platformFee: fee,
            totalAmount: totalAmount
        });

        userPayouts[exporter].push(payoutId);
        userPayouts[investor].push(payoutId);
        invoiceToPayout[invoiceId] = payoutId;

        emit PayoutCreated(payoutId, invoiceId, exporter, investor, amount, dueDate);
        return payoutId;
    }

    function distributePayout(uint256 payoutId) external nonReentrant {
        Payout storage payout = payouts[payoutId];
        require(payout.amount > 0, "Payout does not exist");
        require(!payout.isPaid, "Payout already paid");
        require(!payout.isDefaulted, "Payout defaulted");
        require(block.timestamp >= payout.dueDate, "Due date not reached");

        payout.isPaid = true;

        YieldDistribution memory dist = distributions[payoutId];
        uint256 platformAmount = payout.platformFee;
        uint256 investorAmount = dist.totalAmount - platformAmount;

        IERC20(invoiceToken).transferFrom(
            payout.exporter,
            payout.investor,
            investorAmount
        );

        IERC20(invoiceToken).transferFrom(
            payout.exporter,
            platformWallet,
            platformAmount
        );

        emit PayoutDistributed(
            payoutId,
            payout.investor,
            dist.principal,
            dist.yield,
            platformAmount
        );
    }

    function markDefaulted(uint256 payoutId) external {
        Payout storage payout = payouts[payoutId];
        require(payout.amount > 0, "Payout does not exist");
        require(!payout.isPaid, "Payout already paid");
        require(!payout.isDefaulted, "Payout already defaulted");
        require(block.timestamp > payout.dueDate, "Due date not reached");

        payout.isDefaulted = true;

        emit PayoutDefaulted(payoutId, payout.investor, payout.amount);
    }

    function getPayout(uint256 payoutId) external view returns (Payout memory) {
        return payouts[payoutId];
    }

    function getDistribution(uint256 payoutId) external view returns (YieldDistribution memory) {
        return distributions[payoutId];
    }

    function getUserPayouts(address user) external view returns (uint256[] memory) {
        return userPayouts[user];
    }

    function getInvoicePayout(uint256 invoiceId) external view returns (uint256) {
        return invoiceToPayout[invoiceId];
    }

    function updatePlatformFee(uint256 newFeeBPS) external onlyOwner {
        require(newFeeBPS <= 1000, "Fee too high");
        platformFeeBPS = newFeeBPS;
    }

    function updatePlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid address");
        platformWallet = newWallet;
    }

    function calculateYield(
        uint256 principal,
        uint256 yieldBPS,
        uint256 daysToMaturity
    ) external pure returns (uint256) {
        uint256 annualYield = (principal * yieldBPS) / 10000;
        return (annualYield * daysToMaturity) / 365;
    }

    function getExpectedReturns(
        uint256 payoutId
    ) external view returns (
        uint256 expectedPrincipal,
        uint256 expectedYield,
        uint256 expectedFee
    ) {
        YieldDistribution memory dist = distributions[payoutId];
        return (dist.principal, dist.yield, dist.platformFee);
    }
}
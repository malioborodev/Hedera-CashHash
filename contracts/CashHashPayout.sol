// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IHederaTokenService {
    struct HederaToken {
        string name;
        string symbol;
        address treasury;
        string memo;
        bool tokenSupplyType;
        int64 maxSupply;
        bool freezeDefault;
        TokenKey[] tokenKeys;
        Expiry expiry;
    }

    struct TokenKey {
        uint keyType;
        KeyValue key;
    }

    struct KeyValue {
        bool inheritAccountKey;
        address contractId;
        bytes ed25519;
        bytes ECDSA_secp256k1;
        address delegatableContractId;
    }

    struct Expiry {
        int64 second;
        address autoRenewAccount;
        int64 autoRenewPeriod;
    }

    function transferTokens(address token, address sender, address receiver, int64 amount) external returns (int responseCode);
    function associateTokens(address account, address[] memory tokens) external returns (int responseCode);
    function dissociateTokens(address account, address[] memory tokens) external returns (int responseCode);
    function getTokenInfo(address token) external returns (int responseCode, HederaToken memory tokenInfo);
}

contract CashHashPayout is ReentrancyGuard, Ownable {
    IHederaTokenService constant HTS = IHederaTokenService(0x0000000000000000000000000000000000000167);
    struct Payout {
        uint256 payoutId;
        uint256 invoiceId;
        address tokenId; // HTS token address
        uint256 amount;
        address seller;
        address investor;
        uint256 createdAt;
        uint256 maturityDate;
        uint256 yieldBps;
        bool isPaid;
        bool isDefaulted;
        bool isActive;
        string country;
        uint256 platformFee;
    }

    struct YieldDistribution {
        uint256 payoutId;
        address investor;
        address seller;
        address tokenId;
        uint256 principal;
        uint256 yieldAmount;
        uint256 platformFee;
        uint256 totalPayout;
        uint256 distributedAt;
        bool isDistributed;
    }

    mapping(uint256 => Payout) public payouts;
    mapping(uint256 => YieldDistribution) public distributions;
    mapping(uint256 => uint256) public invoiceToPayout;
    mapping(address => uint256[]) public investorPayouts;
    mapping(address => uint256[]) public sellerPayouts;
    mapping(address => bool) public authorizedTokens;
    
    uint256 public nextPayoutId = 1;
    uint256 public platformFeeBPS = 75;
    address public platformWallet;
    address public escrowContract;

    event PayoutCreated(
        uint256 indexed payoutId,
        uint256 indexed invoiceId,
        address indexed seller,
        address investor,
        address tokenId,
        uint256 amount,
        uint256 maturityDate,
        uint256 yieldBps,
        string country
    );
    
    event PayoutDistributed(
        uint256 indexed payoutId,
        address indexed investor,
        address indexed seller,
        address tokenId,
        uint256 principal,
        uint256 yieldAmount,
        uint256 platformFee
    );
    
    event PayoutDefaulted(
        uint256 indexed payoutId,
        address indexed investor,
        address tokenId,
        uint256 amount
    );
    
    event TokenAuthorized(
        address indexed tokenId,
        bool authorized
    );

    constructor(address _escrowContract, address _platformWallet) {
        escrowContract = _escrowContract;
        platformWallet = _platformWallet;
    }

    function createPayout(
        uint256 invoiceId,
        address seller,
        address investor,
        address tokenId,
        uint256 amount,
        uint256 maturityDate,
        uint256 yieldBps,
        string memory country
    ) external returns (uint256) {
        require(amount > 0, "Amount must be positive");
        require(maturityDate > block.timestamp, "Maturity date must be in future");
        require(seller != investor, "Seller and investor cannot be same");
        require(invoiceToPayout[invoiceId] == 0, "Payout already exists for invoice");
        require(authorizedTokens[tokenId], "Token not authorized");
        require(yieldBps >= 100 && yieldBps <= 5000, "Invalid yield range");

        uint256 payoutId = nextPayoutId++;
        
        payouts[payoutId] = Payout({
            payoutId: payoutId,
            invoiceId: invoiceId,
            tokenId: tokenId,
            amount: amount,
            seller: seller,
            investor: investor,
            createdAt: block.timestamp,
            maturityDate: maturityDate,
            yieldBps: yieldBps,
            isPaid: false,
            isDefaulted: false,
            isActive: true,
            country: country,
            platformFee: 0 // Will be calculated during distribution
        });

        uint256 yieldAmount = (amount * yieldBps) / 10000;
        uint256 totalPayout = amount + yieldAmount;
        uint256 platformFee = (totalPayout * platformFeeBPS) / 10000;

        distributions[payoutId] = YieldDistribution({
            payoutId: payoutId,
            investor: investor,
            seller: seller,
            tokenId: tokenId,
            principal: amount,
            yieldAmount: yieldAmount,
            platformFee: platformFee,
            totalPayout: totalPayout,
            distributedAt: 0,
            isDistributed: false
        });

        sellerPayouts[seller].push(payoutId);
        investorPayouts[investor].push(payoutId);
        invoiceToPayout[invoiceId] = payoutId;

        emit PayoutCreated(payoutId, invoiceId, seller, investor, tokenId, amount, maturityDate, yieldBps, country);
        return payoutId;
    }

    function distributePayout(uint256 payoutId) external nonReentrant {
        Payout storage payout = payouts[payoutId];
        YieldDistribution storage dist = distributions[payoutId];
        
        require(payout.payoutId != 0, "Payout does not exist");
        require(!payout.isPaid, "Payout already paid");
        require(!payout.isDefaulted, "Payout defaulted");
        require(payout.isActive, "Payout not active");
        require(block.timestamp >= payout.maturityDate, "Maturity date not reached");
        require(!dist.isDistributed, "Already distributed");

        payout.isPaid = true;
        payout.isActive = false;
        dist.isDistributed = true;
        dist.distributedAt = block.timestamp;

        uint256 investorAmount = dist.totalPayout - dist.platformFee;

        // Transfer principal + yield to investor using HTS
        int responseCode1 = HTS.transferTokens(
            payout.tokenId,
            payout.seller,
            payout.investor,
            int64(int256(investorAmount))
        );
        require(responseCode1 == 22, "Transfer to investor failed");

        // Transfer platform fee using HTS
        int responseCode2 = HTS.transferTokens(
            payout.tokenId,
            payout.seller,
            platformWallet,
            int64(int256(dist.platformFee))
        );
        require(responseCode2 == 22, "Transfer to platform failed");

        emit PayoutDistributed(
            payoutId,
            payout.investor,
            payout.seller,
            payout.tokenId,
            dist.principal,
            dist.yieldAmount,
            dist.platformFee
        );
    }

    function markDefaulted(uint256 payoutId) external {
        Payout storage payout = payouts[payoutId];
        YieldDistribution storage dist = distributions[payoutId];
        
        require(payout.payoutId != 0, "Payout does not exist");
        require(!payout.isPaid, "Payout already paid");
        require(!payout.isDefaulted, "Already defaulted");
        require(payout.isActive, "Payout not active");
        require(block.timestamp > payout.maturityDate + 30 days, "Grace period not over");

        payout.isDefaulted = true;
        payout.isActive = false;
        dist.isDistributed = true;
        dist.distributedAt = block.timestamp;

        // Return principal to investor using HTS (no yield on default)
        int responseCode = HTS.transferTokens(
            payout.tokenId,
            address(this), // Assuming escrow holds the tokens
            payout.investor,
            int64(int256(payout.amount))
        );
        require(responseCode == 22, "Transfer to investor failed");

        emit PayoutDefaulted(
            payoutId,
            payout.seller,
            payout.investor,
            payout.tokenId,
            payout.amount,
            payout.country
        );
    }

    // Token authorization
    function authorizeToken(address tokenId) external onlyOwner {
        authorizedTokens[tokenId] = true;
        emit TokenAuthorized(tokenId, true);
    }

    function revokeToken(address tokenId) external onlyOwner {
        authorizedTokens[tokenId] = false;
        emit TokenAuthorized(tokenId, false);
    }

    // View functions
    function getPayout(uint256 payoutId) external view returns (Payout memory) {
        return payouts[payoutId];
    }

    function getDistribution(uint256 payoutId) external view returns (YieldDistribution memory) {
        return distributions[payoutId];
    }

    function getSellerPayouts(address seller) external view returns (uint256[] memory) {
        return sellerPayouts[seller];
    }

    function getInvestorPayouts(address investor) external view returns (uint256[] memory) {
        return investorPayouts[investor];
    }

    function getInvoicePayout(uint256 invoiceId) external view returns (uint256) {
        return invoiceToPayout[invoiceId];
    }

    function isTokenAuthorized(address tokenId) external view returns (bool) {
        return authorizedTokens[tokenId];
    }

    function calculateYield(uint256 principal, uint256 yieldBps) external pure returns (uint256) {
        return (principal * yieldBps) / 10000;
    }

    // Platform management
    function setPlatformFee(uint256 newFeeBPS) external onlyOwner {
        require(newFeeBPS <= 1000, "Fee too high");
        platformFeeBPS = newFeeBPS;
    }

    function setPlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet");
        platformWallet = newWallet;
    }

    function setEscrowContract(address _escrowContract) external onlyOwner {
        require(_escrowContract != address(0), "Invalid contract address");
        escrowContract = _escrowContract;
    }

    function getExpectedReturns(
        uint256 payoutId
    ) external view returns (
        uint256 principal,
        uint256 yield,
        uint256 platformFee
    ) {
        YieldDistribution memory dist = distributions[payoutId];
        return (dist.principal, dist.yieldAmount, dist.platformFee);
    }

    // Emergency functions
    function emergencyWithdraw(address tokenId, uint256 amount) external onlyOwner {
        int responseCode = HTS.transferTokens(
            tokenId,
            address(this),
            platformWallet,
            int64(int256(amount))
        );
        require(responseCode == 22, "Emergency withdrawal failed");
    }
}
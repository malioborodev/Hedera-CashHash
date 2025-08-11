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

contract CashHashBondEscrow is ReentrancyGuard, Ownable {
    IHederaTokenService constant HTS = IHederaTokenService(0x0000000000000000000000000000000000000167);
    struct Escrow {
        uint256 escrowId;
        uint256 invoiceId;
        address investor;
        address seller;
        address tokenId; // HTS token address
        uint256 amount;
        uint256 createdAt;
        uint256 maturityDate;
        uint256 yieldBps;
        bool isReleased;
        bool isDefaulted;
        bool isActive;
        string country;
        uint256 platformFee;
    }

    struct RiskProfile {
        uint256 creditScore;
        uint256 defaultRate;
        uint256 collateralRatio;
        uint256 maxInvestment;
        bool isVerified;
        bool isActive;
        uint256 lastUpdated;
    }

    mapping(uint256 => Escrow) public escrows;
    mapping(address => RiskProfile) public riskProfiles;
    mapping(address => uint256[]) public investorEscrows;
    mapping(address => uint256[]) public sellerEscrows;
    mapping(uint256 => uint256) public invoiceToEscrow;
    mapping(address => bool) public authorizedTokens;
    
    uint256 public nextEscrowId = 1;
    uint256 public platformFeeBPS = 75;
    address public platformWallet;
    address public invoiceContract;

    event EscrowCreated(
        uint256 indexed escrowId,
        uint256 indexed invoiceId,
        address indexed investor,
        address seller,
        address tokenId,
        uint256 amount,
        uint256 maturityDate,
        uint256 yieldBps,
        string country
    );
    
    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed seller,
        address tokenId,
        uint256 amount,
        uint256 yield
    );
    
    event EscrowDefaulted(
        uint256 indexed escrowId,
        address indexed investor,
        address tokenId,
        uint256 amount
    );
    
    event RiskProfileUpdated(
        address indexed seller,
        uint256 creditScore,
        uint256 defaultRate,
        uint256 collateralRatio,
        uint256 maxInvestment
    );
    
    event TokenAuthorized(
        address indexed tokenId,
        bool authorized
    );

    constructor(address _invoiceContract, address _platformWallet) {
        invoiceContract = _invoiceContract;
        platformWallet = _platformWallet;
    }

    function createEscrow(
        uint256 invoiceId,
        address investor,
        address seller,
        address tokenId,
        uint256 amount,
        uint256 maturityDate,
        uint256 yieldBps,
        string memory country
    ) external returns (uint256) {
        require(amount > 0, "Amount must be positive");
        require(maturityDate > block.timestamp, "Maturity date must be in future");
        require(investor != seller, "Investor and seller cannot be same");
        require(invoiceToEscrow[invoiceId] == 0, "Escrow already exists for invoice");
        require(authorizedTokens[tokenId], "Token not authorized");
        require(yieldBps >= 100 && yieldBps <= 5000, "Invalid yield range");

        uint256 escrowId = nextEscrowId++;
        uint256 fee = (amount * platformFeeBPS) / 10000;

        escrows[escrowId] = Escrow({
            escrowId: escrowId,
            invoiceId: invoiceId,
            investor: investor,
            seller: seller,
            tokenId: tokenId,
            amount: amount,
            createdAt: block.timestamp,
            maturityDate: maturityDate,
            yieldBps: yieldBps,
            isReleased: false,
            isDefaulted: false,
            isActive: true,
            country: country,
            platformFee: fee
        });

        investorEscrows[investor].push(escrowId);
        sellerEscrows[seller].push(escrowId);
        invoiceToEscrow[invoiceId] = escrowId;

        // Transfer tokens to escrow using HTS
        int responseCode = HTS.transferTokens(tokenId, investor, address(this), int64(int256(amount)));
        require(responseCode == 22, "Token transfer failed");

        emit EscrowCreated(escrowId, invoiceId, investor, seller, tokenId, amount, maturityDate, yieldBps, country);
        return escrowId;
    }

    function releaseEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.escrowId != 0, "Escrow does not exist");
        require(!escrow.isReleased, "Escrow already released");
        require(!escrow.isDefaulted, "Escrow defaulted");
        require(escrow.isActive, "Escrow not active");
        require(block.timestamp >= escrow.maturityDate, "Maturity date not reached");

        escrow.isReleased = true;
        escrow.isActive = false;

        // Calculate yield
        uint256 yieldAmount = (escrow.amount * escrow.yieldBps) / 10000;
        uint256 totalPayout = escrow.amount + yieldAmount;
        uint256 platformAmount = (totalPayout * platformFeeBPS) / 10000;
        uint256 sellerAmount = totalPayout - platformAmount;

        // Transfer principal + yield to seller using HTS
        int responseCode1 = HTS.transferTokens(
            escrow.tokenId,
            address(this),
            escrow.seller,
            int64(int256(sellerAmount))
        );
        require(responseCode1 == 22, "Transfer to seller failed");

        // Transfer platform fee using HTS
        int responseCode2 = HTS.transferTokens(
            escrow.tokenId,
            address(this),
            platformWallet,
            int64(int256(platformAmount))
        );
        require(responseCode2 == 22, "Transfer to platform failed");

        emit EscrowReleased(escrowId, escrow.seller, escrow.tokenId, sellerAmount, yieldAmount);
    }

    function markDefaulted(uint256 escrowId) external onlyOwner {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.escrowId != 0, "Escrow does not exist");
        require(!escrow.isReleased, "Escrow already released");
        require(!escrow.isDefaulted, "Escrow already defaulted");
        require(escrow.isActive, "Escrow not active");
        require(block.timestamp > escrow.maturityDate + 30 days, "Grace period not expired");

        escrow.isDefaulted = true;
        escrow.isActive = false;

        // Return principal to investor (no yield on default)
        int responseCode = HTS.transferTokens(
            escrow.tokenId,
            address(this),
            escrow.investor,
            int64(int256(escrow.amount))
        );
        require(responseCode == 22, "Transfer to investor failed");

        emit EscrowDefaulted(escrowId, escrow.investor, escrow.tokenId, escrow.amount);
    }

    function updateRiskProfile(
        address seller,
        uint256 creditScore,
        uint256 defaultRate,
        uint256 collateralRatio,
        uint256 maxInvestment
    ) external onlyOwner {
        require(creditScore <= 1000, "Invalid credit score");
        require(defaultRate <= 10000, "Invalid default rate");
        require(collateralRatio <= 10000, "Invalid collateral ratio");
        require(maxInvestment > 0, "Max investment must be positive");

        riskProfiles[seller] = RiskProfile({
            creditScore: creditScore,
            defaultRate: defaultRate,
            collateralRatio: collateralRatio,
            maxInvestment: maxInvestment,
            isVerified: true,
            isActive: true,
            lastUpdated: block.timestamp
        });

        emit RiskProfileUpdated(seller, creditScore, defaultRate, collateralRatio, maxInvestment);
    }

    function authorizeToken(address tokenId, bool authorized) external onlyOwner {
        require(tokenId != address(0), "Invalid token address");
        authorizedTokens[tokenId] = authorized;
        emit TokenAuthorized(tokenId, authorized);
    }
    
    function calculateRiskAdjustedYield(
        address seller,
        uint256 baseYield
    ) external view returns (uint256) {
        RiskProfile memory profile = riskProfiles[seller];
        if (!profile.isVerified || !profile.isActive) {
            return baseYield;
        }

        uint256 riskAdjustment = (profile.defaultRate * baseYield) / 10000;
        return baseYield + riskAdjustment; // Add risk premium
    }
    
    function calculateExpectedYield(
        uint256 escrowId
    ) external view returns (uint256) {
        Escrow memory escrow = escrows[escrowId];
        require(escrow.escrowId != 0, "Escrow does not exist");
        
        if (escrow.isDefaulted || escrow.isReleased) {
            return 0;
        }
        
        return (escrow.amount * escrow.yieldBps) / 10000;
    }

    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    function getInvestorEscrows(address investor) external view returns (uint256[] memory) {
        return investorEscrows[investor];
    }
    
    function getSellerEscrows(address seller) external view returns (uint256[] memory) {
        return sellerEscrows[seller];
    }

    function getInvoiceEscrow(uint256 invoiceId) external view returns (uint256) {
        return invoiceToEscrow[invoiceId];
    }

    function getRiskProfile(address seller) external view returns (RiskProfile memory) {
        return riskProfiles[seller];
    }
    
    function isTokenAuthorized(address tokenId) external view returns (bool) {
        return authorizedTokens[tokenId];
    }

    function setPlatformFee(uint256 newFeeBPS) external onlyOwner {
        require(newFeeBPS <= 1000, "Fee cannot exceed 10%");
        platformFeeBPS = newFeeBPS;
    }

    function setPlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet address");
        platformWallet = newWallet;
    }
    
    function setInvoiceContract(address newContract) external onlyOwner {
        require(newContract != address(0), "Invalid contract address");
        invoiceContract = newContract;
    }
    
    function emergencyWithdraw(address tokenId, uint256 amount) external onlyOwner {
        require(tokenId != address(0), "Invalid token address");
        require(amount > 0, "Amount must be positive");
        
        int responseCode = HTS.transferTokens(
            tokenId,
            address(this),
            owner(),
            int64(int256(amount))
        );
        require(responseCode == 22, "Emergency withdraw failed");
    }
}
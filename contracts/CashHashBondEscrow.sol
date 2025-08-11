// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CashHashBondEscrow is ReentrancyGuard, Ownable {
    struct Escrow {
        uint256 invoiceId;
        address investor;
        address exporter;
        uint256 amount;
        uint256 createdAt;
        uint256 releaseDate;
        bool isReleased;
        bool isDefaulted;
        uint256 platformFee;
    }

    struct RiskProfile {
        uint256 creditScore;
        uint256 defaultRate;
        uint256 collateralRatio;
        bool isVerified;
    }

    mapping(uint256 => Escrow) public escrows;
    mapping(address => RiskProfile) public riskProfiles;
    mapping(address => uint256[]) public userEscrows;
    mapping(uint256 => uint256) public invoiceToEscrow;
    
    uint256 public nextEscrowId = 1;
    uint256 public platformFeeBPS = 75;
    address public platformWallet;
    address public invoiceToken;

    event EscrowCreated(
        uint256 indexed escrowId,
        uint256 indexed invoiceId,
        address indexed investor,
        address exporter,
        uint256 amount,
        uint256 releaseDate
    );
    
    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed exporter,
        uint256 amount
    );
    
    event EscrowDefaulted(
        uint256 indexed escrowId,
        address indexed investor,
        uint256 amount
    );
    
    event RiskProfileUpdated(
        address indexed exporter,
        uint256 creditScore,
        uint256 defaultRate,
        uint256 collateralRatio
    );

    constructor(address _invoiceToken, address _platformWallet) {
        invoiceToken = _invoiceToken;
        platformWallet = _platformWallet;
    }

    function createEscrow(
        uint256 invoiceId,
        address investor,
        address exporter,
        uint256 amount,
        uint256 releaseDate
    ) external returns (uint256) {
        require(amount > 0, "Amount must be positive");
        require(releaseDate > block.timestamp, "Release date must be in future");
        require(investor != exporter, "Investor and exporter cannot be same");
        require(invoiceToEscrow[invoiceId] == 0, "Escrow already exists for invoice");

        uint256 escrowId = nextEscrowId++;
        uint256 fee = (amount * platformFeeBPS) / 10000;

        escrows[escrowId] = Escrow({
            invoiceId: invoiceId,
            investor: investor,
            exporter: exporter,
            amount: amount,
            createdAt: block.timestamp,
            releaseDate: releaseDate,
            isReleased: false,
            isDefaulted: false,
            platformFee: fee
        });

        userEscrows[investor].push(escrowId);
        userEscrows[exporter].push(escrowId);
        invoiceToEscrow[invoiceId] = escrowId;

        emit EscrowCreated(escrowId, invoiceId, investor, exporter, amount, releaseDate);
        return escrowId;
    }

    function releaseEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.amount > 0, "Escrow does not exist");
        require(!escrow.isReleased, "Escrow already released");
        require(!escrow.isDefaulted, "Escrow defaulted");
        require(block.timestamp >= escrow.releaseDate, "Release date not reached");

        escrow.isReleased = true;

        uint256 platformAmount = escrow.platformFee;
        uint256 exporterAmount = escrow.amount - platformAmount;

        IERC20(invoiceToken).transferFrom(
            address(this),
            escrow.exporter,
            exporterAmount
        );

        IERC20(invoiceToken).transferFrom(
            address(this),
            platformWallet,
            platformAmount
        );

        emit EscrowReleased(escrowId, escrow.exporter, exporterAmount);
    }

    function markDefaulted(uint256 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.amount > 0, "Escrow does not exist");
        require(!escrow.isReleased, "Escrow already released");
        require(!escrow.isDefaulted, "Escrow already defaulted");
        require(block.timestamp > escrow.releaseDate, "Release date not reached");

        escrow.isDefaulted = true;

        uint256 investorAmount = escrow.amount;

        IERC20(invoiceToken).transferFrom(
            address(this),
            escrow.investor,
            investorAmount
        );

        emit EscrowDefaulted(escrowId, escrow.investor, investorAmount);
    }

    function updateRiskProfile(
        address exporter,
        uint256 creditScore,
        uint256 defaultRate,
        uint256 collateralRatio
    ) external onlyOwner {
        require(creditScore <= 1000, "Invalid credit score");
        require(defaultRate <= 10000, "Invalid default rate");
        require(collateralRatio <= 10000, "Invalid collateral ratio");

        riskProfiles[exporter] = RiskProfile({
            creditScore: creditScore,
            defaultRate: defaultRate,
            collateralRatio: collateralRatio,
            isVerified: true
        });

        emit RiskProfileUpdated(exporter, creditScore, defaultRate, collateralRatio);
    }

    function calculateRiskAdjustedYield(
        address exporter,
        uint256 baseYield
    ) external view returns (uint256) {
        RiskProfile memory profile = riskProfiles[exporter];
        if (!profile.isVerified) {
            return baseYield;
        }

        uint256 riskAdjustment = (profile.defaultRate * baseYield) / 10000;
        return baseYield - riskAdjustment;
    }

    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    function getUserEscrows(address user) external view returns (uint256[] memory) {
        return userEscrows[user];
    }

    function getInvoiceEscrow(uint256 invoiceId) external view returns (uint256) {
        return invoiceToEscrow[invoiceId];
    }

    function getRiskProfile(address exporter) external view returns (RiskProfile memory) {
        return riskProfiles[exporter];
    }

    function updatePlatformFee(uint256 newFeeBPS) external onlyOwner {
        require(newFeeBPS <= 1000, "Fee too high");
        platformFeeBPS = newFeeBPS;
    }

    function updatePlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid address");
        platformWallet = newWallet;
    }
}
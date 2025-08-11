// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CashHashInvoice.sol";

contract CashHashBondEscrow is ReentrancyGuard, Ownable {
    CashHashInvoice public immutable invoiceContract;
    
    struct Bond {
        uint256 amount;
        address exporter;
        uint256 timestamp;
        bool isActive;
        bool isSlashed;
    }
    
    mapping(uint256 => Bond) public bonds;
    mapping(address => uint256[]) public exporterBonds;
    
    uint256 public constant MIN_BOND_HBAR = 300 * 1e8; // 300 HBAR in tinybars
    uint256 public constant MAX_BOND_HBAR = 5000 * 1e8; // 5000 HBAR in tinybars
    uint256 public constant BOND_RATE_BPS = 100; // 1% of invoice amount
    
    event BondPosted(
        uint256 indexed invoiceId,
        address indexed exporter,
        uint256 amount,
        uint256 timestamp
    );
    
    event BondRefunded(
        uint256 indexed invoiceId,
        address indexed exporter,
        uint256 amount,
        uint256 timestamp
    );
    
    event BondSlashed(
        uint256 indexed invoiceId,
        address indexed exporter,
        uint256 amount,
        uint256 timestamp
    );
    
    constructor(address _invoiceContract) {
        invoiceContract = CashHashInvoice(_invoiceContract);
    }
    
    function calculateBondAmount(uint256 amountUSD) public pure returns (uint256) {
        // Convert USD to HBAR (assuming 1 HBAR = $0.10 for calculation)
        uint256 bondInHBAR = (amountUSD * BOND_RATE_BPS * 1e8) / (10000 * 10); // 1% in HBAR
        
        // Clamp between MIN and MAX
        if (bondInHBAR < MIN_BOND_HBAR) {
            return MIN_BOND_HBAR;
        } else if (bondInHBAR > MAX_BOND_HBAR) {
            return MAX_BOND_HBAR;
        }
        return bondInHBAR;
    }
    
    function postExporterBond(uint256 invoiceId) external payable nonReentrant {
        require(invoiceContract.ownerOf(invoiceId) == msg.sender, "Not invoice owner");
        require(bonds[invoiceId].amount == 0, "Bond already posted");
        
        CashHashInvoice.InvoiceTerms memory terms = invoiceContract.getInvoiceTerms(invoiceId);
        uint256 requiredBond = calculateBondAmount(terms.amountUSD);
        
        require(msg.value >= requiredBond, "Insufficient bond amount");
        
        bonds[invoiceId] = Bond({
            amount: msg.value,
            exporter: msg.sender,
            timestamp: block.timestamp,
            isActive: true,
            isSlashed: false
        });
        
        exporterBonds[msg.sender].push(invoiceId);
        
        // Refund excess if any
        if (msg.value > requiredBond) {
            payable(msg.sender).transfer(msg.value - requiredBond);
            bonds[invoiceId].amount = requiredBond;
        }
        
        emit BondPosted(invoiceId, msg.sender, bonds[invoiceId].amount, block.timestamp);
    }
    
    function refundBond(uint256 invoiceId) external nonReentrant onlyOwner {
        Bond storage bond = bonds[invoiceId];
        require(bond.isActive, "Bond not active");
        require(!bond.isSlashed, "Bond already slashed");
        
        uint256 refundAmount = bond.amount;
        address exporter = bond.exporter;
        
        bond.isActive = false;
        bond.amount = 0;
        
        payable(exporter).transfer(refundAmount);
        
        emit BondRefunded(invoiceId, exporter, refundAmount, block.timestamp);
    }
    
    function slashBond(uint256 invoiceId) external nonReentrant onlyOwner {
        Bond storage bond = bonds[invoiceId];
        require(bond.isActive, "Bond not active");
        require(!bond.isSlashed, "Bond already slashed");
        
        uint256 slashAmount = bond.amount;
        address exporter = bond.exporter;
        
        bond.isActive = false;
        bond.isSlashed = true;
        // Amount stays in contract (slashed)
        
        emit BondSlashed(invoiceId, exporter, slashAmount, block.timestamp);
    }
    
    function getBond(uint256 invoiceId) external view returns (Bond memory) {
        return bonds[invoiceId];
    }
    
    function getExporterBonds(address exporter) external view returns (uint256[] memory) {
        return exporterBonds[exporter];
    }
    
    function isBondPosted(uint256 invoiceId) external view returns (bool) {
        return bonds[invoiceId].isActive;
    }
    
    function getBondAmount(uint256 invoiceId) external view returns (uint256) {
        return bonds[invoiceId].amount;
    }
    
    // Emergency withdrawal function for slashed bonds (owner only)
    function withdrawSlashedFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // View function to check total slashed amount
    function getTotalSlashedAmount() external view returns (uint256) {
        return address(this).balance;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CashHashInvoice is ERC20, ReentrancyGuard, Ownable {
    struct Invoice {
        uint256 amount;
        uint256 dueDate;
        address debtor;
        address creditor;
        bool isPaid;
        bool isDefaulted;
        string documentHash;
        uint256 platformFee;
    }

    struct Bond {
        uint256 invoiceId;
        address investor;
        uint256 amount;
        uint256 postedDate;
        bool isActive;
    }

    mapping(uint256 => Invoice) public invoices;
    mapping(uint256 => Bond) public bonds;
    mapping(address => uint256[]) public userInvoices;
    mapping(address => uint256[]) public userBonds;
    
    uint256 public nextInvoiceId = 1;
    uint256 public nextBondId = 1;
    uint256 public platformFeeBPS = 75; // 0.75%
    address public platformWallet;

    event InvoiceListed(uint256 indexed invoiceId, address indexed creditor, uint256 amount, uint256 dueDate);
    event BondPosted(uint256 indexed bondId, uint256 indexed invoiceId, address indexed investor, uint256 amount);
    event InvoicePaid(uint256 indexed invoiceId, address indexed debtor, uint256 amount);
    event InvoiceDefaulted(uint256 indexed invoiceId, address indexed investor, uint256 amount);
    event PlatformFeeUpdated(uint256 newFeeBPS);

    constructor(address _platformWallet) ERC20("CashHash Invoice Token", "CHIT") {
        platformWallet = _platformWallet;
    }

    function listInvoice(
        uint256 amount,
        uint256 dueDate,
        address debtor,
        string memory documentHash
    ) external returns (uint256) {
        require(amount > 0, "Amount must be positive");
        require(dueDate > block.timestamp, "Due date must be in future");
        require(debtor != address(0), "Invalid debtor address");

        uint256 invoiceId = nextInvoiceId++;
        uint256 fee = (amount * platformFeeBPS) / 10000;

        invoices[invoiceId] = Invoice({
            amount: amount,
            dueDate: dueDate,
            debtor: debtor,
            creditor: msg.sender,
            isPaid: false,
            isDefaulted: false,
            documentHash: documentHash,
            platformFee: fee
        });

        userInvoices[msg.sender].push(invoiceId);
        
        _mint(address(this), amount);
        
        emit InvoiceListed(invoiceId, msg.sender, amount, dueDate);
        return invoiceId;
    }

    function postBond(uint256 invoiceId, uint256 amount) external nonReentrant returns (uint256) {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.amount > 0, "Invoice does not exist");
        require(!invoice.isPaid, "Invoice already paid");
        require(!invoice.isDefaulted, "Invoice defaulted");
        require(amount <= invoice.amount, "Bond amount exceeds invoice");

        uint256 bondId = nextBondId++;
        
        bonds[bondId] = Bond({
            invoiceId: invoiceId,
            investor: msg.sender,
            amount: amount,
            postedDate: block.timestamp,
            isActive: true
        });

        userBonds[msg.sender].push(bondId);
        
        _transfer(address(this), msg.sender, amount);
        
        emit BondPosted(bondId, invoiceId, msg.sender, amount);
        return bondId;
    }

    function payInvoice(uint256 invoiceId) external payable nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.amount > 0, "Invoice does not exist");
        require(msg.sender == invoice.debtor, "Only debtor can pay");
        require(!invoice.isPaid, "Invoice already paid");
        require(!invoice.isDefaulted, "Invoice defaulted");

        invoice.isPaid = true;
        
        uint256 platformAmount = invoice.platformFee;
        uint256 creditorAmount = invoice.amount - platformAmount;
        
        // Transfer to creditor
        _transfer(address(this), invoice.creditor, creditorAmount);
        
        // Transfer platform fee
        _transfer(address(this), platformWallet, platformAmount);
        
        emit InvoicePaid(invoiceId, msg.sender, invoice.amount);
    }

    function markDefaulted(uint256 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.amount > 0, "Invoice does not exist");
        require(!invoice.isPaid, "Invoice already paid");
        require(!invoice.isDefaulted, "Invoice already defaulted");
        require(block.timestamp > invoice.dueDate, "Invoice not yet due");

        invoice.isDefaulted = true;
        
        emit InvoiceDefaulted(invoiceId, address(0), invoice.amount);
    }

    function getUserInvoices(address user) external view returns (uint256[] memory) {
        return userInvoices[user];
    }

    function getUserBonds(address user) external view returns (uint256[] memory) {
        return userBonds[user];
    }

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }

    function getBond(uint256 bondId) external view returns (Bond memory) {
        return bonds[bondId];
    }

    function updatePlatformFee(uint256 newFeeBPS) external onlyOwner {
        require(newFeeBPS <= 1000, "Fee too high"); // Max 10%
        platformFeeBPS = newFeeBPS;
        emit PlatformFeeUpdated(newFeeBPS);
    }

    function updatePlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid address");
        platformWallet = newWallet;
    }
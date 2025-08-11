// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for Hedera Token Service
interface IHederaTokenService {
    struct TokenInfo {
        address token;
        uint totalSupply;
        bool deleted;
        bool defaultKycStatus;
        bool pauseStatus;
        bool defaultFreezeStatus;
        address treasury;
        string name;
        string symbol;
        string memo;
        uint8 decimals;
        uint expiry;
        address autoRenewAccount;
        uint autoRenewPeriod;
    }
    
    struct Expiry {
        uint second;
        address autoRenewAccount;
        uint autoRenewPeriod;
    }
    
    struct HederaToken {
        string name;
        string symbol;
        address treasury;
        string memo;
        bool tokenSupplyType;
        uint maxSupply;
        bool freezeDefault;
        TokenKey[] tokenKeys;
        Expiry expiry;
    }
    
    struct TokenKey {
        uint keyType;
        bytes key;
    }
    
    function createFungibleToken(
        HederaToken memory token,
        uint initialTotalSupply,
        uint decimals
    ) external payable returns (int responseCode, address tokenAddress);
    
    function createNonFungibleToken(
        HederaToken memory token
    ) external payable returns (int responseCode, address tokenAddress);
    
    function mintToken(
        address token,
        uint64 amount,
        bytes[] memory metadata
    ) external returns (int responseCode, uint64 newTotalSupply, int64[] memory serialNumbers);
    
    function associateTokens(
        address account,
        address[] memory tokens
    ) external returns (int responseCode);
    
    function transferTokens(
        address token,
        address[] memory accountIds,
        int64[] memory amounts
    ) external returns (int responseCode);
}

contract CashHashInvoice is ReentrancyGuard, Ownable {
    IHederaTokenService constant HTS = IHederaTokenService(0x0000000000000000000000000000000000000167);
    
    struct Invoice {
        uint256 invoiceId;
        address seller;
        string buyerName;
        uint256 amountUSD;
        string currency;
        uint256 tenorDays;
        uint256 yieldBps;
        uint256 maturityDate;
        string country;
        address nftTokenId;
        address ftTokenId;
        uint256 totalSupply;
        bool isListed;
        bool isPaid;
        bool isDefaulted;
        string[] documentHashes;
        uint256 createdAt;
    }

    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public sellerInvoices;
    mapping(address => bool) public tokenExists;
    
    uint256 public nextInvoiceId = 1;
    uint256 public platformFeeBPS = 75; // 0.75%
    address public platformWallet;
    uint256 public constant TOKEN_DECIMALS = 6;

    // Hedera-native events
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed seller,
        address nftId,
        address ftId,
        uint256 yieldBps,
        uint256 maturity,
        string country
    );
    
    event InvoiceListed(
        uint256 indexed invoiceId,
        address indexed nftId,
        address indexed ftId,
        uint256 yieldBps,
        uint256 maturity,
        string country
    );
    
    event DocumentAdded(
        uint256 indexed invoiceId,
        string docType,
        string docHash
    );

    constructor(address _platformWallet) {
        platformWallet = _platformWallet;
    }

    function createInvoice(
        string memory buyerName,
        uint256 amountUSD,
        string memory currency,
        uint256 tenorDays,
        uint256 yieldBps,
        string memory country
    ) external payable returns (uint256) {
        require(amountUSD > 0, "Amount must be positive");
        require(tenorDays > 0 && tenorDays <= 365, "Invalid tenor days");
        require(yieldBps >= 100 && yieldBps <= 5000, "Yield must be 1-50%");
        require(bytes(buyerName).length > 0, "Buyer name required");

        uint256 invoiceId = nextInvoiceId++;
        uint256 maturityDate = block.timestamp + (tenorDays * 1 days);
        
        // Create NFT for invoice ownership
        address nftTokenId = _createInvoiceNFT(invoiceId, buyerName);
        
        // Create FT for investment units
        uint256 totalSupply = amountUSD * (10 ** TOKEN_DECIMALS); // 6 decimals
        address ftTokenId = _createInvoiceFT(invoiceId, totalSupply);
        
        invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            seller: msg.sender,
            buyerName: buyerName,
            amountUSD: amountUSD,
            currency: currency,
            tenorDays: tenorDays,
            yieldBps: yieldBps,
            maturityDate: maturityDate,
            country: country,
            nftTokenId: nftTokenId,
            ftTokenId: ftTokenId,
            totalSupply: totalSupply,
            isListed: false,
            isPaid: false,
            isDefaulted: false,
            documentHashes: new string[](0),
            createdAt: block.timestamp
        });

        sellerInvoices[msg.sender].push(invoiceId);
        tokenExists[nftTokenId] = true;
        tokenExists[ftTokenId] = true;
        
        emit InvoiceCreated(invoiceId, msg.sender, nftTokenId, ftTokenId, yieldBps, maturityDate, country);
        return invoiceId;
    }

    function _createInvoiceNFT(uint256 invoiceId, string memory buyerName) internal returns (address) {
        IHederaTokenService.HederaToken memory nftToken;
        nftToken.name = string(abi.encodePacked("Invoice #", _toString(invoiceId)));
        nftToken.symbol = string(abi.encodePacked("INV", _toString(invoiceId)));
        nftToken.treasury = address(this);
        nftToken.memo = string(abi.encodePacked("Invoice NFT for buyer: ", buyerName));
        nftToken.tokenSupplyType = true; // FINITE
        nftToken.maxSupply = 1;
        nftToken.freezeDefault = false;
        
        (int responseCode, address tokenAddress) = HTS.createNonFungibleToken(nftToken);
        require(responseCode == 22, "NFT creation failed");
        
        return tokenAddress;
    }
    
    function _createInvoiceFT(uint256 invoiceId, uint256 totalSupply) internal returns (address) {
        IHederaTokenService.HederaToken memory ftToken;
        ftToken.name = string(abi.encodePacked("Invoice Units #", _toString(invoiceId)));
        ftToken.symbol = string(abi.encodePacked("IU", _toString(invoiceId)));
        ftToken.treasury = address(this);
        ftToken.memo = "Fractional investment units for invoice";
        ftToken.tokenSupplyType = true; // FINITE
        ftToken.maxSupply = totalSupply;
        ftToken.freezeDefault = false;
        
        (int responseCode, address tokenAddress) = HTS.createFungibleToken(ftToken, totalSupply, TOKEN_DECIMALS);
        require(responseCode == 22, "FT creation failed");
        
        return tokenAddress;
    }
    
    function listInvoice(uint256 invoiceId) external {
        require(invoices[invoiceId].seller == msg.sender, "Only seller can list");
        require(!invoices[invoiceId].isListed, "Already listed");
        require(!invoices[invoiceId].isPaid, "Invoice already paid");
        require(!invoices[invoiceId].isDefaulted, "Invoice defaulted");
        
        invoices[invoiceId].isListed = true;
        
        emit InvoiceListed(
            invoiceId,
            invoices[invoiceId].nftTokenId,
            invoices[invoiceId].ftTokenId,
            invoices[invoiceId].yieldBps,
            invoices[invoiceId].maturityDate,
            invoices[invoiceId].country
        );
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function addDocument(uint256 invoiceId, string memory docType, string memory docHash) external {
        require(invoices[invoiceId].seller == msg.sender, "Only seller can add documents");
        require(bytes(docHash).length > 0, "Document hash required");
        
        invoices[invoiceId].documentHashes.push(docHash);
        
        emit DocumentAdded(invoiceId, docType, docHash);
    }
    
    function getInvoice(uint256 invoiceId) external view returns (
        uint256 id,
        address seller,
        string memory buyerName,
        uint256 amountUSD,
        string memory currency,
        uint256 tenorDays,
        uint256 yieldBps,
        uint256 maturityDate,
        string memory country,
        address nftTokenId,
        address ftTokenId,
        uint256 totalSupply,
        bool isListed,
        bool isPaid,
        bool isDefaulted
    ) {
        Invoice storage invoice = invoices[invoiceId];
        return (
            invoice.invoiceId,
            invoice.seller,
            invoice.buyerName,
            invoice.amountUSD,
            invoice.currency,
            invoice.tenorDays,
            invoice.yieldBps,
            invoice.maturityDate,
            invoice.country,
            invoice.nftTokenId,
            invoice.ftTokenId,
            invoice.totalSupply,
            invoice.isListed,
            invoice.isPaid,
            invoice.isDefaulted
        );
    }
    
    function getInvoiceDocuments(uint256 invoiceId) external view returns (string[] memory) {
        return invoices[invoiceId].documentHashes;
    }
    
    function getSellerInvoices(address seller) external view returns (uint256[] memory) {
        return sellerInvoices[seller];
    }
    
    function markInvoicePaid(uint256 invoiceId) external onlyOwner {
        require(invoices[invoiceId].invoiceId != 0, "Invoice does not exist");
        require(!invoices[invoiceId].isPaid, "Invoice already paid");
        
        invoices[invoiceId].isPaid = true;
    }
    
    function markInvoiceDefaulted(uint256 invoiceId) external onlyOwner {
        require(invoices[invoiceId].invoiceId != 0, "Invoice does not exist");
        require(!invoices[invoiceId].isPaid, "Invoice already paid");
        require(!invoices[invoiceId].isDefaulted, "Invoice already defaulted");
        require(block.timestamp > invoices[invoiceId].maturityDate, "Invoice not yet matured");
        
        invoices[invoiceId].isDefaulted = true;
    }

    function setPlatformFee(uint256 newFeeBPS) external onlyOwner {
        require(newFeeBPS <= 1000, "Fee cannot exceed 10%");
        platformFeeBPS = newFeeBPS;
    }
    
    function setPlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet address");
        platformWallet = newWallet;
    }
}
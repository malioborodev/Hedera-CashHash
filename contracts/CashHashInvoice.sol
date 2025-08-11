// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CashHashInvoice is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    struct InvoiceTerms {
        uint256 amountUSD;
        uint256 tenorDays;
        uint256 yieldBps; // basis points
        uint256 bondHBAR;
        string commodity;
        string country;
        string[] documentHashes;
        bool isListed;
        uint256 createdAt;
        uint256 maturityDate;
    }
    
    struct FractionalToken {
        address tokenAddress;
        uint256 totalSupply;
        uint256 unitPrice; // in USD cents
        uint256 fundedAmount;
        bool isActive;
    }
    
    mapping(uint256 => InvoiceTerms) public invoiceTerms;
    mapping(uint256 => FractionalToken) public fractionalTokens;
    mapping(uint256 => address) public exporters;
    
    event InvoiceCreated(
        uint256 indexed tokenId,
        address indexed exporter,
        uint256 amountUSD,
        string commodity,
        string country
    );
    
    event FractionalTokenMinted(
        uint256 indexed invoiceId,
        address indexed tokenAddress,
        uint256 totalSupply,
        uint256 unitPrice
    );
    
    event TermsUpdated(
        uint256 indexed tokenId,
        uint256 yieldBps,
        uint256 bondHBAR
    );
    
    event DocumentAdded(
        uint256 indexed tokenId,
        string documentHash
    );
    
    event ListingEnabled(
        uint256 indexed tokenId,
        uint256 timestamp
    );
    
    constructor() ERC721("CashHash Invoice", "CHI") {}
    
    function createInvoice(
        address exporter,
        uint256 amountUSD,
        uint256 tenorDays,
        uint256 yieldBps,
        uint256 bondHBAR,
        string memory commodity,
        string memory country,
        string[] memory documentHashes
    ) external returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(exporter, newTokenId);
        
        invoiceTerms[newTokenId] = InvoiceTerms({
            amountUSD: amountUSD,
            tenorDays: tenorDays,
            yieldBps: yieldBps,
            bondHBAR: bondHBAR,
            commodity: commodity,
            country: country,
            documentHashes: documentHashes,
            isListed: false,
            createdAt: block.timestamp,
            maturityDate: block.timestamp + (tenorDays * 1 days)
        });
        
        exporters[newTokenId] = exporter;
        
        emit InvoiceCreated(newTokenId, exporter, amountUSD, commodity, country);
        
        return newTokenId;
    }
    
    function mintFractionalToken(
        uint256 invoiceId,
        address tokenAddress,
        uint256 totalSupply,
        uint256 unitPrice
    ) external {
        require(ownerOf(invoiceId) == msg.sender, "Not invoice owner");
        require(fractionalTokens[invoiceId].tokenAddress == address(0), "FT already minted");
        
        fractionalTokens[invoiceId] = FractionalToken({
            tokenAddress: tokenAddress,
            totalSupply: totalSupply,
            unitPrice: unitPrice,
            fundedAmount: 0,
            isActive: true
        });
        
        emit FractionalTokenMinted(invoiceId, tokenAddress, totalSupply, unitPrice);
    }
    
    function setTerms(
        uint256 tokenId,
        uint256 yieldBps,
        uint256 bondHBAR
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not invoice owner");
        require(!invoiceTerms[tokenId].isListed, "Already listed");
        
        invoiceTerms[tokenId].yieldBps = yieldBps;
        invoiceTerms[tokenId].bondHBAR = bondHBAR;
        
        emit TermsUpdated(tokenId, yieldBps, bondHBAR);
    }
    
    function addDocument(
        uint256 tokenId,
        string memory documentHash
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not invoice owner");
        
        invoiceTerms[tokenId].documentHashes.push(documentHash);
        
        emit DocumentAdded(tokenId, documentHash);
    }
    
    function enableListing(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not invoice owner");
        require(!invoiceTerms[tokenId].isListed, "Already listed");
        require(fractionalTokens[tokenId].tokenAddress != address(0), "FT not minted");
        
        invoiceTerms[tokenId].isListed = true;
        
        emit ListingEnabled(tokenId, block.timestamp);
    }
    
    function updateFundedAmount(
        uint256 invoiceId,
        uint256 newFundedAmount
    ) external onlyOwner {
        require(fractionalTokens[invoiceId].isActive, "FT not active");
        fractionalTokens[invoiceId].fundedAmount = newFundedAmount;
    }
    
    function getInvoiceTerms(uint256 tokenId) external view returns (InvoiceTerms memory) {
        return invoiceTerms[tokenId];
    }
    
    function getFractionalToken(uint256 invoiceId) external view returns (FractionalToken memory) {
        return fractionalTokens[invoiceId];
    }
    
    function getDocuments(uint256 tokenId) external view returns (string[] memory) {
        return invoiceTerms[tokenId].documentHashes;
    }
    
    function isMatured(uint256 tokenId) external view returns (bool) {
        return block.timestamp >= invoiceTerms[tokenId].maturityDate;
    }
}
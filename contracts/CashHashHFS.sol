// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Interface for Hedera File Service
interface IHederaFileService {
    struct FileInfo {
        bytes fileId;
        uint size;
        uint expirationTime;
        bool deleted;
        bytes32[] keys;
    }
    
    struct ExpirationTime {
        uint second;
    }
    
    function createFile(
        ExpirationTime memory expiration,
        bytes32[] memory keys,
        bytes memory contents
    ) external payable returns (int responseCode, bytes memory fileId);
    
    function updateFile(
        bytes memory fileId,
        bytes memory contents
    ) external returns (int responseCode);
    
    function appendFile(
        bytes memory fileId,
        bytes memory contents
    ) external returns (int responseCode);
    
    function deleteFile(
        bytes memory fileId
    ) external returns (int responseCode);
    
    function getFileInfo(
        bytes memory fileId
    ) external returns (int responseCode, FileInfo memory fileInfo);
    
    function getFileContent(
        bytes memory fileId
    ) external returns (int responseCode, bytes memory contents);
}

contract CashHashHFS is Ownable, ReentrancyGuard {
    IHederaFileService constant HFS = IHederaFileService(0x0000000000000000000000000000000000000166);
    
    enum DocumentType {
        INVOICE,
        CONTRACT,
        PAYMENT_PROOF,
        LEGAL_DOCUMENT,
        AUDIT_REPORT,
        COMPLIANCE_CERTIFICATE,
        OTHER
    }
    
    struct Document {
        bytes fileId;
        uint256 invoiceId;
        DocumentType docType;
        string fileName;
        string description;
        uint256 fileSize;
        bytes32 fileHash;
        uint256 uploadedAt;
        address uploadedBy;
        bool isActive;
        string ipfsHash; // Backup storage
        uint256 expirationTime;
    }
    
    struct DocumentMetadata {
        string mimeType;
        string version;
        bool isEncrypted;
        bytes32 encryptionKey;
        string[] tags;
        mapping(string => string) customFields;
    }
    
    mapping(uint256 => Document[]) public invoiceDocuments;
    mapping(bytes => uint256) public fileToInvoice;
    mapping(bytes => DocumentMetadata) public documentMetadata;
    mapping(uint256 => mapping(DocumentType => uint256)) public documentCounts;
    
    uint256 public constant FILE_EXPIRATION_PERIOD = 365 days * 7; // 7 years
    uint256 public constant MAX_FILE_SIZE = 1024 * 1024; // 1MB
    
    event DocumentUploaded(
        uint256 indexed invoiceId,
        bytes indexed fileId,
        DocumentType indexed docType,
        string fileName,
        uint256 fileSize,
        bytes32 fileHash,
        address uploadedBy,
        uint256 timestamp
    );
    
    event DocumentUpdated(
        uint256 indexed invoiceId,
        bytes indexed fileId,
        string fileName,
        uint256 newFileSize,
        bytes32 newFileHash,
        address updatedBy,
        uint256 timestamp
    );
    
    event DocumentDeleted(
        uint256 indexed invoiceId,
        bytes indexed fileId,
        address deletedBy,
        uint256 timestamp
    );
    
    event DocumentAccessed(
        uint256 indexed invoiceId,
        bytes indexed fileId,
        address accessedBy,
        uint256 timestamp
    );
    
    constructor() {}
    
    function uploadDocument(
        uint256 invoiceId,
        DocumentType docType,
        string memory fileName,
        string memory description,
        bytes memory fileContent,
        bytes32 fileHash,
        string memory ipfsHash,
        string memory mimeType
    ) external payable onlyOwner returns (bytes memory fileId) {
        require(invoiceId > 0, "Invalid invoice ID");
        require(fileContent.length > 0, "File content cannot be empty");
        require(fileContent.length <= MAX_FILE_SIZE, "File too large");
        require(bytes(fileName).length > 0, "File name required");
        require(fileHash != bytes32(0), "File hash required");
        
        // Create file keys
        bytes32[] memory keys = new bytes32[](1);
        keys[0] = bytes32(abi.encodePacked(address(this)));
        
        // Set expiration time
        IHederaFileService.ExpirationTime memory expiration = IHederaFileService.ExpirationTime({
            second: block.timestamp + FILE_EXPIRATION_PERIOD
        });
        
        // Create file on Hedera
        (int responseCode, bytes memory createdFileId) = HFS.createFile{
            value: msg.value
        }(expiration, keys, fileContent);
        
        require(responseCode == 22, "File creation failed"); // SUCCESS = 22
        
        // Store document information
        Document memory newDoc = Document({
            fileId: createdFileId,
            invoiceId: invoiceId,
            docType: docType,
            fileName: fileName,
            description: description,
            fileSize: fileContent.length,
            fileHash: fileHash,
            uploadedAt: block.timestamp,
            uploadedBy: msg.sender,
            isActive: true,
            ipfsHash: ipfsHash,
            expirationTime: block.timestamp + FILE_EXPIRATION_PERIOD
        });
        
        invoiceDocuments[invoiceId].push(newDoc);
        fileToInvoice[createdFileId] = invoiceId;
        documentCounts[invoiceId][docType]++;
        
        // Store metadata
        DocumentMetadata storage metadata = documentMetadata[createdFileId];
        metadata.mimeType = mimeType;
        metadata.version = "1.0";
        metadata.isEncrypted = false;
        
        emit DocumentUploaded(
            invoiceId,
            createdFileId,
            docType,
            fileName,
            fileContent.length,
            fileHash,
            msg.sender,
            block.timestamp
        );
        
        return createdFileId;
    }
    
    function updateDocument(
        bytes memory fileId,
        bytes memory newContent,
        bytes32 newFileHash,
        string memory newFileName
    ) external onlyOwner {
        uint256 invoiceId = fileToInvoice[fileId];
        require(invoiceId > 0, "File not found");
        require(newContent.length > 0, "Content cannot be empty");
        require(newContent.length <= MAX_FILE_SIZE, "File too large");
        
        // Update file content on Hedera
        (int responseCode) = HFS.updateFile(fileId, newContent);
        require(responseCode == 22, "File update failed");
        
        // Update document record
        Document[] storage docs = invoiceDocuments[invoiceId];
        for (uint256 i = 0; i < docs.length; i++) {
            if (keccak256(docs[i].fileId) == keccak256(fileId)) {
                docs[i].fileSize = newContent.length;
                docs[i].fileHash = newFileHash;
                if (bytes(newFileName).length > 0) {
                    docs[i].fileName = newFileName;
                }
                
                // Update version
                DocumentMetadata storage metadata = documentMetadata[fileId];
                uint256 currentVersion = _parseVersion(metadata.version);
                metadata.version = string(abi.encodePacked(Strings.toString(currentVersion + 1), ".0"));
                
                emit DocumentUpdated(
                    invoiceId,
                    fileId,
                    docs[i].fileName,
                    newContent.length,
                    newFileHash,
                    msg.sender,
                    block.timestamp
                );
                break;
            }
        }
    }
    
    function deleteDocument(bytes memory fileId) external onlyOwner {
        uint256 invoiceId = fileToInvoice[fileId];
        require(invoiceId > 0, "File not found");
        
        // Delete file from Hedera
        (int responseCode) = HFS.deleteFile(fileId);
        require(responseCode == 22, "File deletion failed");
        
        // Mark document as inactive
        Document[] storage docs = invoiceDocuments[invoiceId];
        for (uint256 i = 0; i < docs.length; i++) {
            if (keccak256(docs[i].fileId) == keccak256(fileId)) {
                docs[i].isActive = false;
                documentCounts[invoiceId][docs[i].docType]--;
                
                emit DocumentDeleted(
                    invoiceId,
                    fileId,
                    msg.sender,
                    block.timestamp
                );
                break;
            }
        }
    }
    
    function getDocument(bytes memory fileId) external returns (bytes memory content) {
        uint256 invoiceId = fileToInvoice[fileId];
        require(invoiceId > 0, "File not found");
        
        // Get file content from Hedera
        (int responseCode, bytes memory fileContent) = HFS.getFileContent(fileId);
        require(responseCode == 22, "Failed to retrieve file");
        
        emit DocumentAccessed(
            invoiceId,
            fileId,
            msg.sender,
            block.timestamp
        );
        
        return fileContent;
    }
    
    function getDocumentInfo(bytes memory fileId) external view returns (Document memory) {
        uint256 invoiceId = fileToInvoice[fileId];
        require(invoiceId > 0, "File not found");
        
        Document[] storage docs = invoiceDocuments[invoiceId];
        for (uint256 i = 0; i < docs.length; i++) {
            if (keccak256(docs[i].fileId) == keccak256(fileId)) {
                return docs[i];
            }
        }
        
        revert("Document not found");
    }
    
    function getInvoiceDocuments(uint256 invoiceId) external view returns (Document[] memory) {
        return invoiceDocuments[invoiceId];
    }
    
    function getDocumentsByType(
        uint256 invoiceId,
        DocumentType docType
    ) external view returns (Document[] memory) {
        Document[] storage allDocs = invoiceDocuments[invoiceId];
        uint256 count = documentCounts[invoiceId][docType];
        
        Document[] memory filteredDocs = new Document[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allDocs.length; i++) {
            if (allDocs[i].docType == docType && allDocs[i].isActive) {
                filteredDocs[index] = allDocs[i];
                index++;
            }
        }
        
        return filteredDocs;
    }
    
    function getDocumentMetadata(bytes memory fileId) external view returns (
        string memory mimeType,
        string memory version,
        bool isEncrypted
    ) {
        DocumentMetadata storage metadata = documentMetadata[fileId];
        return (metadata.mimeType, metadata.version, metadata.isEncrypted);
    }
    
    function setDocumentTags(bytes memory fileId, string[] memory tags) external onlyOwner {
        uint256 invoiceId = fileToInvoice[fileId];
        require(invoiceId > 0, "File not found");
        
        DocumentMetadata storage metadata = documentMetadata[fileId];
        metadata.tags = tags;
    }
    
    function addCustomField(
        bytes memory fileId,
        string memory key,
        string memory value
    ) external onlyOwner {
        uint256 invoiceId = fileToInvoice[fileId];
        require(invoiceId > 0, "File not found");
        
        DocumentMetadata storage metadata = documentMetadata[fileId];
        metadata.customFields[key] = value;
    }
    
    function getCustomField(
        bytes memory fileId,
        string memory key
    ) external view returns (string memory) {
        return documentMetadata[fileId].customFields[key];
    }
    
    function isDocumentExpired(bytes memory fileId) external view returns (bool) {
        uint256 invoiceId = fileToInvoice[fileId];
        if (invoiceId == 0) return true;
        
        Document[] storage docs = invoiceDocuments[invoiceId];
        for (uint256 i = 0; i < docs.length; i++) {
            if (keccak256(docs[i].fileId) == keccak256(fileId)) {
                return block.timestamp > docs[i].expirationTime;
            }
        }
        
        return true;
    }
    
    function _parseVersion(string memory version) internal pure returns (uint256) {
        bytes memory versionBytes = bytes(version);
        uint256 result = 0;
        
        for (uint256 i = 0; i < versionBytes.length; i++) {
            if (versionBytes[i] >= 0x30 && versionBytes[i] <= 0x39) {
                result = result * 10 + (uint256(uint8(versionBytes[i])) - 48);
            } else {
                break;
            }
        }
        
        return result;
    }
    
    // Emergency function to withdraw any HBAR sent to contract
    function withdrawHBAR() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No HBAR to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // Function to receive HBAR for file creation fees
    receive() external payable {}
}
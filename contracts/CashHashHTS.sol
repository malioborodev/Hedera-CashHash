// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

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
    
    function mintToken(
        address token,
        uint64 amount,
        bytes[] memory metadata
    ) external returns (int responseCode, uint64 newTotalSupply, int64[] memory serialNumbers);
    
    function burnToken(
        address token,
        uint64 amount,
        int64[] memory serialNumbers
    ) external returns (int responseCode, uint64 newTotalSupply);
    
    function associateTokens(
        address account,
        address[] memory tokens
    ) external returns (int responseCode);
    
    function transferTokens(
        address token,
        address[] memory accountIds,
        int64[] memory amounts
    ) external returns (int responseCode);
    
    function getTokenInfo(
        address token
    ) external returns (int responseCode, TokenInfo memory tokenInfo);
}

contract CashHashHTS is Ownable, ReentrancyGuard {
    IHederaTokenService constant HTS = IHederaTokenService(0x0000000000000000000000000000000000000167);
    
    struct FractionalToken {
        address tokenAddress;
        uint256 invoiceId;
        string name;
        string symbol;
        uint256 totalSupply;
        uint256 decimals;
        uint256 createdAt;
        bool isActive;
        string metadata;
    }
    
    mapping(uint256 => FractionalToken) public invoiceTokens;
    mapping(address => uint256) public tokenToInvoice;
    mapping(uint256 => bool) public tokenExists;
    
    uint256 public constant TOKEN_DECIMALS = 6;
    uint256 public constant MAX_SUPPLY = 1000000 * 10**TOKEN_DECIMALS; // 1M tokens max
    
    event TokenCreated(
        uint256 indexed invoiceId,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 totalSupply,
        uint256 timestamp
    );
    
    event TokenMinted(
        uint256 indexed invoiceId,
        address indexed tokenAddress,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    event TokenBurned(
        uint256 indexed invoiceId,
        address indexed tokenAddress,
        uint256 amount,
        uint256 timestamp
    );
    
    event TokenTransferred(
        uint256 indexed invoiceId,
        address indexed tokenAddress,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );
    
    constructor() {}
    
    function createFractionalToken(
        uint256 invoiceId,
        string memory tokenName,
        string memory tokenSymbol,
        uint256 totalSupply,
        string memory metadata
    ) external payable onlyOwner returns (address tokenAddress) {
        require(!tokenExists[invoiceId], "Token already exists for this invoice");
        require(totalSupply > 0 && totalSupply <= MAX_SUPPLY, "Invalid total supply");
        require(bytes(tokenName).length > 0, "Token name required");
        require(bytes(tokenSymbol).length > 0, "Token symbol required");
        
        // Create token keys for admin control
        IHederaTokenService.TokenKey[] memory tokenKeys = new IHederaTokenService.TokenKey[](4);
        
        // Admin key
        tokenKeys[0] = IHederaTokenService.TokenKey({
            keyType: 1, // ADMIN_KEY
            key: abi.encodePacked(address(this))
        });
        
        // Supply key
        tokenKeys[1] = IHederaTokenService.TokenKey({
            keyType: 4, // SUPPLY_KEY
            key: abi.encodePacked(address(this))
        });
        
        // Freeze key
        tokenKeys[2] = IHederaTokenService.TokenKey({
            keyType: 8, // FREEZE_KEY
            key: abi.encodePacked(address(this))
        });
        
        // Wipe key
        tokenKeys[3] = IHederaTokenService.TokenKey({
            keyType: 16, // WIPE_KEY
            key: abi.encodePacked(address(this))
        });
        
        // Create expiry
        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry({
            second: block.timestamp + 365 days,
            autoRenewAccount: address(this),
            autoRenewPeriod: 365 days
        });
        
        // Create token
        IHederaTokenService.HederaToken memory token = IHederaTokenService.HederaToken({
            name: tokenName,
            symbol: tokenSymbol,
            treasury: address(this),
            memo: string(abi.encodePacked("CashHash Invoice #", Strings.toString(invoiceId))),
            tokenSupplyType: true, // FINITE
            maxSupply: totalSupply,
            freezeDefault: false,
            tokenKeys: tokenKeys,
            expiry: expiry
        });
        
        (int responseCode, address createdTokenAddress) = HTS.createFungibleToken{
            value: msg.value
        }(token, 0, TOKEN_DECIMALS);
        
        require(responseCode == 22, "Token creation failed"); // SUCCESS = 22
        
        // Store token information
        invoiceTokens[invoiceId] = FractionalToken({
            tokenAddress: createdTokenAddress,
            invoiceId: invoiceId,
            name: tokenName,
            symbol: tokenSymbol,
            totalSupply: totalSupply,
            decimals: TOKEN_DECIMALS,
            createdAt: block.timestamp,
            isActive: true,
            metadata: metadata
        });
        
        tokenToInvoice[createdTokenAddress] = invoiceId;
        tokenExists[invoiceId] = true;
        
        emit TokenCreated(
            invoiceId,
            createdTokenAddress,
            tokenName,
            tokenSymbol,
            totalSupply,
            block.timestamp
        );
        
        return createdTokenAddress;
    }
    
    function mintTokensToInvestor(
        uint256 invoiceId,
        address investor,
        uint256 amount
    ) external onlyOwner {
        require(tokenExists[invoiceId], "Token does not exist");
        require(investor != address(0), "Invalid investor address");
        require(amount > 0, "Amount must be greater than 0");
        
        FractionalToken storage tokenInfo = invoiceTokens[invoiceId];
        require(tokenInfo.isActive, "Token is not active");
        
        // Associate token with investor first
        address[] memory tokens = new address[](1);
        tokens[0] = tokenInfo.tokenAddress;
        HTS.associateTokens(investor, tokens);
        
        // Mint tokens
        bytes[] memory metadata = new bytes[](0);
        (int responseCode, , ) = HTS.mintToken(
            tokenInfo.tokenAddress,
            uint64(amount),
            metadata
        );
        
        require(responseCode == 22, "Token minting failed");
        
        // Transfer tokens to investor
        address[] memory accounts = new address[](2);
        int64[] memory amounts = new int64[](2);
        
        accounts[0] = address(this); // From treasury
        accounts[1] = investor; // To investor
        amounts[0] = -int64(uint64(amount)); // Negative for sender
        amounts[1] = int64(uint64(amount)); // Positive for receiver
        
        (int transferResponseCode) = HTS.transferTokens(
            tokenInfo.tokenAddress,
            accounts,
            amounts
        );
        
        require(transferResponseCode == 22, "Token transfer failed");
        
        emit TokenMinted(
            invoiceId,
            tokenInfo.tokenAddress,
            investor,
            amount,
            block.timestamp
        );
    }
    
    function burnTokens(
        uint256 invoiceId,
        uint256 amount
    ) external onlyOwner {
        require(tokenExists[invoiceId], "Token does not exist");
        require(amount > 0, "Amount must be greater than 0");
        
        FractionalToken storage tokenInfo = invoiceTokens[invoiceId];
        require(tokenInfo.isActive, "Token is not active");
        
        int64[] memory serialNumbers = new int64[](0);
        (int responseCode, ) = HTS.burnToken(
            tokenInfo.tokenAddress,
            uint64(amount),
            serialNumbers
        );
        
        require(responseCode == 22, "Token burning failed");
        
        emit TokenBurned(
            invoiceId,
            tokenInfo.tokenAddress,
            amount,
            block.timestamp
        );
    }
    
    function transferTokens(
        uint256 invoiceId,
        address from,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(tokenExists[invoiceId], "Token does not exist");
        require(from != address(0) && to != address(0), "Invalid addresses");
        require(amount > 0, "Amount must be greater than 0");
        
        FractionalToken storage tokenInfo = invoiceTokens[invoiceId];
        require(tokenInfo.isActive, "Token is not active");
        
        // Associate token with recipient if needed
        address[] memory tokens = new address[](1);
        tokens[0] = tokenInfo.tokenAddress;
        HTS.associateTokens(to, tokens);
        
        address[] memory accounts = new address[](2);
        int64[] memory amounts = new int64[](2);
        
        accounts[0] = from;
        accounts[1] = to;
        amounts[0] = -int64(uint64(amount));
        amounts[1] = int64(uint64(amount));
        
        (int responseCode) = HTS.transferTokens(
            tokenInfo.tokenAddress,
            accounts,
            amounts
        );
        
        require(responseCode == 22, "Token transfer failed");
        
        emit TokenTransferred(
            invoiceId,
            tokenInfo.tokenAddress,
            from,
            to,
            amount,
            block.timestamp
        );
    }
    
    function deactivateToken(uint256 invoiceId) external onlyOwner {
        require(tokenExists[invoiceId], "Token does not exist");
        invoiceTokens[invoiceId].isActive = false;
    }
    
    function getTokenInfo(uint256 invoiceId) external view returns (FractionalToken memory) {
        require(tokenExists[invoiceId], "Token does not exist");
        return invoiceTokens[invoiceId];
    }
    
    function getTokenAddress(uint256 invoiceId) external view returns (address) {
        require(tokenExists[invoiceId], "Token does not exist");
        return invoiceTokens[invoiceId].tokenAddress;
    }
    
    function getInvoiceFromToken(address tokenAddress) external view returns (uint256) {
        uint256 invoiceId = tokenToInvoice[tokenAddress];
        require(invoiceId != 0, "Token not found");
        return invoiceId;
    }
    
    function isTokenActive(uint256 invoiceId) external view returns (bool) {
        if (!tokenExists[invoiceId]) return false;
        return invoiceTokens[invoiceId].isActive;
    }
    
    // Emergency function to withdraw any HBAR sent to contract
    function withdrawHBAR() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No HBAR to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // Function to receive HBAR for token creation fees
    receive() external payable {}
}
const {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenBurnTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  TokenInfoQuery,
  AccountBalanceQuery,
  TokenSupplyType,
  TokenType,
  TokenFreezeStatus,
  TokenKycStatus,
  Hbar
} = require('@hashgraph/sdk');
const config = require('../config/config');

class HTSService {
  constructor() {
    this.client = null;
    this.treasuryId = null;
    this.treasuryKey = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      if (this.initialized) return;

      // Initialize Hedera client
      this.client = Client.forTestnet(); // or Client.forMainnet() for production
      
      this.treasuryId = AccountId.fromString(config.hedera.accountId);
      this.treasuryKey = PrivateKey.fromString(config.hedera.privateKey);
      
      this.client.setOperator(this.treasuryId, this.treasuryKey);

      this.initialized = true;
      console.log('HTS service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HTS service:', error);
      throw error;
    }
  }

  async createFractionalToken(tokenData) {
    try {
      await this.ensureInitialized();

      const {
        invoiceId,
        tokenName,
        tokenSymbol,
        totalSupply,
        decimals = 2,
        memo = ''
      } = tokenData;

      // Create the token
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(decimals)
        .setInitialSupply(totalSupply)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(totalSupply)
        .setTreasuryAccountId(this.treasuryId)
        .setAdminKey(this.treasuryKey)
        .setSupplyKey(this.treasuryKey)
        .setFreezeKey(this.treasuryKey)
        .setWipeKey(this.treasuryKey)
        .setKycKey(this.treasuryKey)
        .setFreezeDefault(TokenFreezeStatus.Unfrozen)
        .setTokenMemo(memo || `Fractional token for invoice ${invoiceId}`)
        .freezeWith(this.client);

      // Sign and submit the transaction
      const tokenCreateSign = await tokenCreateTx.sign(this.treasuryKey);
      const tokenCreateSubmit = await tokenCreateSign.execute(this.client);
      const tokenCreateRx = await tokenCreateSubmit.getReceipt(this.client);
      
      const tokenId = tokenCreateRx.tokenId;

      console.log(`Created token ${tokenId} for invoice ${invoiceId}`);

      return {
        success: true,
        tokenId: tokenId.toString(),
        transactionId: tokenCreateSubmit.transactionId.toString(),
        tokenName,
        tokenSymbol,
        totalSupply,
        decimals,
        treasuryAccountId: this.treasuryId.toString()
      };
    } catch (error) {
      console.error('Create fractional token error:', error);
      throw new Error(`Failed to create fractional token: ${error.message}`);
    }
  }

  async mintTokens(mintData) {
    try {
      await this.ensureInitialized();

      const { tokenId, amount, memo = '' } = mintData;

      // Mint additional tokens
      const tokenMintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(amount)
        .setTransactionMemo(memo)
        .freezeWith(this.client);

      const tokenMintSign = await tokenMintTx.sign(this.treasuryKey);
      const tokenMintSubmit = await tokenMintSign.execute(this.client);
      const tokenMintRx = await tokenMintSubmit.getReceipt(this.client);

      console.log(`Minted ${amount} tokens for token ${tokenId}`);

      return {
        success: true,
        tokenId,
        mintedAmount: amount,
        transactionId: tokenMintSubmit.transactionId.toString(),
        newTotalSupply: tokenMintRx.totalSupply?.toString()
      };
    } catch (error) {
      console.error('Mint tokens error:', error);
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }

  async burnTokens(burnData) {
    try {
      await this.ensureInitialized();

      const { tokenId, amount, memo = '' } = burnData;

      // Burn tokens
      const tokenBurnTx = new TokenBurnTransaction()
        .setTokenId(tokenId)
        .setAmount(amount)
        .setTransactionMemo(memo)
        .freezeWith(this.client);

      const tokenBurnSign = await tokenBurnTx.sign(this.treasuryKey);
      const tokenBurnSubmit = await tokenBurnSign.execute(this.client);
      const tokenBurnRx = await tokenBurnSubmit.getReceipt(this.client);

      console.log(`Burned ${amount} tokens for token ${tokenId}`);

      return {
        success: true,
        tokenId,
        burnedAmount: amount,
        transactionId: tokenBurnSubmit.transactionId.toString(),
        newTotalSupply: tokenBurnRx.totalSupply?.toString()
      };
    } catch (error) {
      console.error('Burn tokens error:', error);
      throw new Error(`Failed to burn tokens: ${error.message}`);
    }
  }

  async associateToken(associateData) {
    try {
      await this.ensureInitialized();

      const { tokenId, accountId, accountPrivateKey } = associateData;

      const accountKey = PrivateKey.fromString(accountPrivateKey);
      const account = AccountId.fromString(accountId);

      // Associate token with account
      const associateTx = new TokenAssociateTransaction()
        .setAccountId(account)
        .setTokenIds([tokenId])
        .freezeWith(this.client);

      const associateSign = await associateTx.sign(accountKey);
      const associateSubmit = await associateSign.execute(this.client);
      const associateRx = await associateSubmit.getReceipt(this.client);

      console.log(`Associated token ${tokenId} with account ${accountId}`);

      return {
        success: true,
        tokenId,
        accountId,
        transactionId: associateSubmit.transactionId.toString()
      };
    } catch (error) {
      console.error('Associate token error:', error);
      throw new Error(`Failed to associate token: ${error.message}`);
    }
  }

  async transferTokens(transferData) {
    try {
      await this.ensureInitialized();

      const {
        tokenId,
        fromAccountId,
        toAccountId,
        amount,
        fromPrivateKey,
        memo = ''
      } = transferData;

      const fromKey = PrivateKey.fromString(fromPrivateKey);
      const fromAccount = AccountId.fromString(fromAccountId);
      const toAccount = AccountId.fromString(toAccountId);

      // Transfer tokens
      const transferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, fromAccount, -amount)
        .addTokenTransfer(tokenId, toAccount, amount)
        .setTransactionMemo(memo)
        .freezeWith(this.client);

      const transferSign = await transferTx.sign(fromKey);
      const transferSubmit = await transferSign.execute(this.client);
      const transferRx = await transferSubmit.getReceipt(this.client);

      console.log(`Transferred ${amount} tokens from ${fromAccountId} to ${toAccountId}`);

      return {
        success: true,
        tokenId,
        fromAccountId,
        toAccountId,
        amount,
        transactionId: transferSubmit.transactionId.toString()
      };
    } catch (error) {
      console.error('Transfer tokens error:', error);
      throw new Error(`Failed to transfer tokens: ${error.message}`);
    }
  }

  async distributeTokensToInvestors(distributionData) {
    try {
      await this.ensureInitialized();

      const { tokenId, investors, memo = '' } = distributionData;

      // Create transfer transaction for multiple investors
      let transferTx = new TransferTransaction().setTransactionMemo(memo);

      let totalAmount = 0;
      for (const investor of investors) {
        const { accountId, amount } = investor;
        transferTx = transferTx
          .addTokenTransfer(tokenId, this.treasuryId, -amount)
          .addTokenTransfer(tokenId, AccountId.fromString(accountId), amount);
        totalAmount += amount;
      }

      transferTx = transferTx.freezeWith(this.client);

      const transferSign = await transferTx.sign(this.treasuryKey);
      const transferSubmit = await transferSign.execute(this.client);
      const transferRx = await transferSubmit.getReceipt(this.client);

      console.log(`Distributed ${totalAmount} tokens to ${investors.length} investors`);

      return {
        success: true,
        tokenId,
        totalAmount,
        investorCount: investors.length,
        transactionId: transferSubmit.transactionId.toString(),
        distributions: investors
      };
    } catch (error) {
      console.error('Distribute tokens error:', error);
      throw new Error(`Failed to distribute tokens: ${error.message}`);
    }
  }

  async getTokenInfo(tokenId) {
    try {
      await this.ensureInitialized();

      const tokenInfo = await new TokenInfoQuery()
        .setTokenId(tokenId)
        .execute(this.client);

      return {
        tokenId: tokenInfo.tokenId.toString(),
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        totalSupply: tokenInfo.totalSupply.toString(),
        maxSupply: tokenInfo.maxSupply?.toString(),
        treasuryAccountId: tokenInfo.treasuryAccountId.toString(),
        adminKey: tokenInfo.adminKey?.toString(),
        supplyKey: tokenInfo.supplyKey?.toString(),
        freezeKey: tokenInfo.freezeKey?.toString(),
        wipeKey: tokenInfo.wipeKey?.toString(),
        kycKey: tokenInfo.kycKey?.toString(),
        freezeDefault: tokenInfo.defaultFreezeStatus,
        kycDefault: tokenInfo.defaultKycStatus,
        deleted: tokenInfo.isDeleted,
        autoRenewPeriod: tokenInfo.autoRenewPeriod?.seconds?.toString(),
        autoRenewAccount: tokenInfo.autoRenewAccountId?.toString(),
        expirationTime: tokenInfo.expirationTime?.toString(),
        tokenMemo: tokenInfo.tokenMemo
      };
    } catch (error) {
      console.error('Get token info error:', error);
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  async getAccountTokenBalance(accountId, tokenId) {
    try {
      await this.ensureInitialized();

      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(this.client);

      const tokenBalance = balance.tokens.get(tokenId);

      return {
        accountId,
        tokenId,
        balance: tokenBalance ? tokenBalance.toString() : '0',
        hbarBalance: balance.hbars.toString()
      };
    } catch (error) {
      console.error('Get account token balance error:', error);
      throw new Error(`Failed to get account token balance: ${error.message}`);
    }
  }

  async getAllAccountTokenBalances(accountId) {
    try {
      await this.ensureInitialized();

      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(this.client);

      const tokenBalances = [];
      balance.tokens.forEach((tokenBalance, tokenId) => {
        tokenBalances.push({
          tokenId: tokenId.toString(),
          balance: tokenBalance.toString()
        });
      });

      return {
        accountId,
        hbarBalance: balance.hbars.toString(),
        tokenBalances
      };
    } catch (error) {
      console.error('Get all account token balances error:', error);
      throw new Error(`Failed to get all account token balances: ${error.message}`);
    }
  }

  async freezeToken(freezeData) {
    try {
      await this.ensureInitialized();

      const { tokenId, accountId } = freezeData;

      const freezeTx = new TokenFreezeAccountTransaction()
        .setTokenId(tokenId)
        .setAccountId(accountId)
        .freezeWith(this.client);

      const freezeSign = await freezeTx.sign(this.treasuryKey);
      const freezeSubmit = await freezeSign.execute(this.client);
      const freezeRx = await freezeSubmit.getReceipt(this.client);

      return {
        success: true,
        tokenId,
        accountId,
        transactionId: freezeSubmit.transactionId.toString()
      };
    } catch (error) {
      console.error('Freeze token error:', error);
      throw new Error(`Failed to freeze token: ${error.message}`);
    }
  }

  async unfreezeToken(unfreezeData) {
    try {
      await this.ensureInitialized();

      const { tokenId, accountId } = unfreezeData;

      const unfreezeTx = new TokenUnfreezeAccountTransaction()
        .setTokenId(tokenId)
        .setAccountId(accountId)
        .freezeWith(this.client);

      const unfreezeSign = await unfreezeTx.sign(this.treasuryKey);
      const unfreezeSubmit = await unfreezeSign.execute(this.client);
      const unfreezeRx = await unfreezeSubmit.getReceipt(this.client);

      return {
        success: true,
        tokenId,
        accountId,
        transactionId: unfreezeSubmit.transactionId.toString()
      };
    } catch (error) {
      console.error('Unfreeze token error:', error);
      throw new Error(`Failed to unfreeze token: ${error.message}`);
    }
  }

  async grantKyc(kycData) {
    try {
      await this.ensureInitialized();

      const { tokenId, accountId } = kycData;

      const grantKycTx = new TokenGrantKycTransaction()
        .setTokenId(tokenId)
        .setAccountId(accountId)
        .freezeWith(this.client);

      const grantKycSign = await grantKycTx.sign(this.treasuryKey);
      const grantKycSubmit = await grantKycSign.execute(this.client);
      const grantKycRx = await grantKycSubmit.getReceipt(this.client);

      return {
        success: true,
        tokenId,
        accountId,
        transactionId: grantKycSubmit.transactionId.toString()
      };
    } catch (error) {
      console.error('Grant KYC error:', error);
      throw new Error(`Failed to grant KYC: ${error.message}`);
    }
  }

  async revokeKyc(kycData) {
    try {
      await this.ensureInitialized();

      const { tokenId, accountId } = kycData;

      const revokeKycTx = new TokenRevokeKycTransaction()
        .setTokenId(tokenId)
        .setAccountId(accountId)
        .freezeWith(this.client);

      const revokeKycSign = await revokeKycTx.sign(this.treasuryKey);
      const revokeKycSubmit = await revokeKycSign.execute(this.client);
      const revokeKycRx = await revokeKycSubmit.getReceipt(this.client);

      return {
        success: true,
        tokenId,
        accountId,
        transactionId: revokeKycSubmit.transactionId.toString()
      };
    } catch (error) {
      console.error('Revoke KYC error:', error);
      throw new Error(`Failed to revoke KYC: ${error.message}`);
    }
  }

  async wipeTokens(wipeData) {
    try {
      await this.ensureInitialized();

      const { tokenId, accountId, amount } = wipeData;

      const wipeTx = new TokenWipeTransaction()
        .setTokenId(tokenId)
        .setAccountId(accountId)
        .setAmount(amount)
        .freezeWith(this.client);

      const wipeSign = await wipeTx.sign(this.treasuryKey);
      const wipeSubmit = await wipeSign.execute(this.client);
      const wipeRx = await wipeSubmit.getReceipt(this.client);

      return {
        success: true,
        tokenId,
        accountId,
        wipedAmount: amount,
        transactionId: wipeSubmit.transactionId.toString()
      };
    } catch (error) {
      console.error('Wipe tokens error:', error);
      throw new Error(`Failed to wipe tokens: ${error.message}`);
    }
  }

  async deleteToken(tokenId) {
    try {
      await this.ensureInitialized();

      const deleteTx = new TokenDeleteTransaction()
        .setTokenId(tokenId)
        .freezeWith(this.client);

      const deleteSign = await deleteTx.sign(this.treasuryKey);
      const deleteSubmit = await deleteSign.execute(this.client);
      const deleteRx = await deleteSubmit.getReceipt(this.client);

      return {
        success: true,
        tokenId,
        transactionId: deleteSubmit.transactionId.toString()
      };
    } catch (error) {
      console.error('Delete token error:', error);
      throw new Error(`Failed to delete token: ${error.message}`);
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Utility methods
  generateTokenName(invoiceId, sellerName) {
    return `CashHash-${invoiceId}-${sellerName.replace(/\s+/g, '')}`;
  }

  generateTokenSymbol(invoiceId) {
    return `CH${invoiceId}`;
  }

  calculateTokenAmount(investmentAmount, tokenPrice) {
    return Math.floor(investmentAmount / tokenPrice);
  }

  formatTokenAmount(amount, decimals = 2) {
    return (amount / Math.pow(10, decimals)).toFixed(decimals);
  }

  parseTokenAmount(amount, decimals = 2) {
    return Math.floor(amount * Math.pow(10, decimals));
  }

  async getTransactionStatus(transactionId) {
    try {
      await this.ensureInitialized();
      
      const receipt = await this.client.getTransactionReceipt(transactionId);
      
      return {
        status: receipt.status.toString(),
        transactionId: transactionId,
        consensusTimestamp: receipt.consensusTimestamp?.toString()
      };
    } catch (error) {
      console.error('Get transaction status error:', error);
      return {
        status: 'UNKNOWN',
        error: error.message
      };
    }
  }
}

module.exports = new HTSService();
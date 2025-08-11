import { Router, Request, Response } from 'express';
import { hederaRelayService } from '../lib/hedera-relay.ts';

export const relayRouter = Router();

// Bridge token from EVM to Hedera
relayRouter.post('/bridge-to-hedera', async (req: Request, res: Response) => {
  try {
    const { sourceChain, amount, userAddress, evmTokenAddress } = req.body;
    
    if (!sourceChain || !amount || !userAddress || !evmTokenAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: sourceChain, amount, userAddress, evmTokenAddress' 
      });
    }

    // Call with correct parameter order: (fromChain, token, amount, hederaRecipient)
    const result = await hederaRelayService.bridgeToHedera(
      sourceChain,
      evmTokenAddress,
      amount,
      userAddress
    );

    res.json({
      success: true,
      hederaTxId: result.hederaTxId,
      txHash: result.txHash,
      bridgeEventId: result.id,
      status: result.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bridge to Hedera error:', error);
    res.status(500).json({ 
      error: 'Failed to bridge to Hedera',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bridge token from Hedera to EVM
relayRouter.post('/bridge-from-hedera', async (req: Request, res: Response) => {
  try {
    const { targetChain, amount, hederaTokenId, targetAddress } = req.body;
    
    if (!targetChain || !amount || !hederaTokenId || !targetAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: targetChain, amount, hederaTokenId, targetAddress' 
      });
    }

    // Call with correct parameter order: (toChain, token, amount, evmRecipient)
    const result = await hederaRelayService.bridgeFromHedera(
      targetChain,
      hederaTokenId,
      amount,
      targetAddress
    );

    res.json({
      success: true,
      evmTxHash: result.txHash,
      bridgeEventId: result.id,
      status: result.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bridge from Hedera error:', error);
    res.status(500).json({ 
      error: 'Failed to bridge from Hedera',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get bridge status by event ID
relayRouter.get('/status/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID required' });
    }

    const status = await hederaRelayService.getBridgeStatus(eventId);
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get bridge status error:', error);
    res.status(500).json({ 
      error: 'Failed to get bridge status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get supported chains and their details
relayRouter.get('/chains', async (req: Request, res: Response) => {
  try {
    const chains = await hederaRelayService.getSupportedChains();
    
    res.json({
      success: true,
      chains,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get supported chains error:', error);
    res.status(500).json({ 
      error: 'Failed to get supported chains',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's bridge history
relayRouter.get('/history/:userAddress', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;
    const { limit = 10, offset = 0 } = req.query as { limit?: string; offset?: string };
    
    if (!userAddress) {
      return res.status(400).json({ error: 'User address required' });
    }

    const history = await hederaRelayService.getUserBridgeHistory(
      userAddress,
      Number(limit),
      Number(offset)
    );
    
    res.json({
      success: true,
      history,
      total: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get bridge history error:', error);
    res.status(500).json({ 
      error: 'Failed to get bridge history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate bridge parameters
relayRouter.post('/validate', async (req: Request, res: Response) => {
  try {
    const { sourceChain, targetChain, amount, tokenAddress } = req.body;
    
    const validation = await hederaRelayService.validateBridgeParameters({
      sourceChain,
      targetChain,
      amount,
      tokenAddress
    });
    
    res.json({
      success: true,
      validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Validate bridge parameters error:', error);
    res.status(500).json({ 
      error: 'Failed to validate bridge parameters',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
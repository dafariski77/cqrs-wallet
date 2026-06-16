import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Job } from 'bullmq';
import {
  RawTransaction,
  RawTokenTransfer,
  TransactionsSyncedEvent,
  TRANSACTIONS_SYNCED_ROUTING_KEY,
} from '@shared/index';

interface SyncJobData {
  userId: string;
  walletId: string;
  address: string;
  chainType: string;
}

@Processor('blockchain-sync')
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    @Inject('RABBITMQ_CLIENT') private readonly rmqClient: ClientProxy,
  ) {
    super();
  }

  async process(job: Job<SyncJobData>): Promise<void> {
    const { userId, walletId, address, chainType } = job.data;

    this.logger.log(
      `Processing sync job for wallet ${address} (${chainType})`,
    );

    try {
      // Fetch transaction data (mock implementation for demonstration)
      // In production, replace with actual RPC/API calls via ethers.js or viem
      const transactions = await this.fetchTransactions(address, chainType);

      this.logger.log(
        `Fetched ${transactions.length} transactions for wallet ${address}`,
      );

      // Publish the synced transactions event to RabbitMQ
      const event = new TransactionsSyncedEvent(
        userId,
        walletId,
        address,
        transactions,
      );
      this.rmqClient.emit(TRANSACTIONS_SYNCED_ROUTING_KEY, event);

      this.logger.log(
        `Published transactions.synced event for wallet ${walletId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync wallet ${address}: ${error.message}`,
        error.stack,
      );
      throw error; // rethrow so BullMQ can retry
    }
  }

  private async fetchTransactions(
    address: string,
    chainType: string,
  ): Promise<RawTransaction[]> {
    this.logger.log(`Fetching live native balance for ${address} on ${chainType}`);
    
    let nativeBalance = 0;
    let symbol = '';
    let mint = '';
    let decimals = 18;

    try {
      if (chainType === 'ETHEREUM' || chainType === 'POLYGON') {
        const { createPublicClient, http, formatEther } = await import('viem');
        
        let rpcUrl = '';
        if (chainType === 'ETHEREUM') {
          rpcUrl = process.env.ETH_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
          symbol = 'ETH';
          mint = '0x0000000000000000000000000000000000000000'; // Native ETH representation
        } else {
          rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-amoy-rpc.publicnode.com';
          symbol = 'MATIC';
          mint = '0x0000000000000000000000000000000000000000'; // Native MATIC representation
        }

        const client = createPublicClient({ transport: http(rpcUrl) });
        const balanceBigInt = await client.getBalance({ address: address as `0x${string}` });
        nativeBalance = Number(formatEther(balanceBigInt));
        
      } else if (chainType === 'SOLANA') {
        const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
        
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        symbol = 'SOL';
        mint = 'So11111111111111111111111111111111111111112'; // Native SOL mint
        decimals = 9;
        
        const connection = new Connection(rpcUrl, 'confirmed');
        const pubKey = new PublicKey(address);
        const balance = await connection.getBalance(pubKey);
        nativeBalance = balance / LAMPORTS_PER_SOL;
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch live balance, using 0 fallback: ${err.message}`);
    }

    const now = Math.floor(Date.now() / 1000);

    // Return a single snapshot transaction that acts as an "initial deposit" 
    // to reflect the current on-chain balance in the portfolio view
    return [
      {
        signature: `live_sync_${address.slice(0, 8)}_${now}`,
        blockTime: now,
        fee: 0,
        status: 'SUCCESS',
        type: 'TRANSFER',
        tokenTransfers: [
          {
            tokenMint: mint,
            symbol: symbol,
            amount: '0', // Raw amount string not strictly needed for UI if we pass formatted
            amountFormatted: nativeBalance,
            direction: 'IN',
            decimals: decimals,
          },
        ],
      },
    ];
  }
}

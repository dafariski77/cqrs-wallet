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

  /**
   * Fetch transactions from the blockchain.
   * This is a MOCK implementation returning simulated data.
   * Replace with actual Etherscan API, Alchemy, or ethers.js provider calls.
   */
  private async fetchTransactions(
    address: string,
    chainType: string,
  ): Promise<RawTransaction[]> {
    this.logger.log(
      `Fetching mock transactions for ${address} on ${chainType}`,
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const now = Math.floor(Date.now() / 1000);

    const mockTokenTransferIn: RawTokenTransfer = {
      tokenMint:
        chainType === 'SOLANA'
          ? 'So11111111111111111111111111111111111111112'
          : '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      symbol: chainType === 'SOLANA' ? 'SOL' : 'ETH',
      amount: '5500000000',
      amountFormatted: 5.5,
      direction: 'IN',
      decimals: 9,
    };

    const mockTokenTransferOut: RawTokenTransfer = {
      tokenMint:
        chainType === 'SOLANA'
          ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
          : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      amount: '453250000',
      amountFormatted: 453.25,
      direction: 'OUT',
      decimals: 6,
    };

    const transactions: RawTransaction[] = [
      {
        signature: `mock_tx_1_${address.slice(0, 8)}_${now}`,
        blockTime: now - 3600,
        fee: 5000,
        status: 'SUCCESS',
        type: 'SWAP',
        tokenTransfers: [mockTokenTransferIn, mockTokenTransferOut],
      },
      {
        signature: `mock_tx_2_${address.slice(0, 8)}_${now - 1}`,
        blockTime: now - 7200,
        fee: 5000,
        status: 'SUCCESS',
        type: 'TRANSFER',
        tokenTransfers: [
          {
            ...mockTokenTransferIn,
            direction: 'IN',
            amountFormatted: 1.0,
            amount: '1000000000',
          },
        ],
      },
    ];

    return transactions;
  }
}

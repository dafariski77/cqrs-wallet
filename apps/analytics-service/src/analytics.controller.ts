import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TransactionsSyncedEvent,
  TRANSACTIONS_SYNCED_ROUTING_KEY,
  RawTransaction,
  RawTokenTransfer,
  GET_PORTFOLIO_QUERY,
  GET_TRANSACTIONS_QUERY,
  GetPortfolioDto,
  GetTransactionsDto,
} from '@shared/index';
import {
  PortfolioSummary,
  PortfolioSummaryDocument,
} from './schemas/portfolio.schema';
import {
  EnrichedTransaction,
  EnrichedTransactionDocument,
} from './schemas/enriched-transaction.schema';
import { PricingService } from './pricing.service';

@Controller()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    @InjectModel(PortfolioSummary.name)
    private portfolioModel: Model<PortfolioSummaryDocument>,
    @InjectModel(EnrichedTransaction.name)
    private enrichedTxModel: Model<EnrichedTransactionDocument>,
    private readonly pricingService: PricingService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────────
  // Event consumers (RabbitMQ)
  // ──────────────────────────────────────────────────────────────────────────────

  @EventPattern(TRANSACTIONS_SYNCED_ROUTING_KEY)
  async handleTransactionsSynced(
    @Payload() event: TransactionsSyncedEvent,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Received transactions.synced for wallet ${event.walletId} (${event.transactions.length} txs)`,
    );

    try {
      await Promise.all([
        this.updatePortfolioSummary(event),
        this.saveEnrichedTransactions(event),
      ]);
    } finally {
      // Acknowledge the message
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Query handlers (TCP, called from Gateway)
  // ──────────────────────────────────────────────────────────────────────────────

  @MessagePattern(GET_PORTFOLIO_QUERY)
  async getPortfolio(@Payload() dto: GetPortfolioDto) {
    this.logger.log(`getPortfolio query for userId=${dto.userId}`);
    const doc = await this.portfolioModel.findOne({ userId: dto.userId }).lean();
    if (!doc) {
      return {
        userId: dto.userId,
        totalNetWorthUsd: 0,
        assets: [],
        lastSyncedAt: null,
        message: 'Portfolio not yet synced. Add a wallet to start.',
      };
    }
    return doc;
  }

  @MessagePattern(GET_TRANSACTIONS_QUERY)
  async getTransactions(@Payload() dto: GetTransactionsDto) {
    this.logger.log(`getTransactions query for userId=${dto.userId}`);
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = { userId: dto.userId };
    if (dto.type) filter.type = dto.type.toUpperCase();

    const [docs, total] = await Promise.all([
      this.enrichedTxModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.enrichedTxModel.countDocuments(filter),
    ]);

    return {
      data: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Private: Portfolio projection
  // ──────────────────────────────────────────────────────────────────────────────

  private async updatePortfolioSummary(event: TransactionsSyncedEvent) {
    const { userId, address, transactions, walletId } = event;

    // Aggregate token balances from transactions
    const balanceMap = new Map<string, { symbol: string; balance: number; tokenMint: string; chain: string }>();

    for (const tx of transactions) {
      for (const transfer of tx.tokenTransfers) {
        const key = transfer.tokenMint;
        const existing = balanceMap.get(key) || {
          symbol: transfer.symbol,
          balance: 0,
          tokenMint: transfer.tokenMint,
          chain: 'UNKNOWN',
        };

        if (transfer.direction === 'IN') {
          existing.balance += transfer.amountFormatted;
        } else {
          existing.balance -= transfer.amountFormatted;
        }

        balanceMap.set(key, existing);
      }
    }

    // Get prices and compute values
    const assets: {
      tokenMint: string;
      symbol: string;
      chain: string;
      balance: number;
      currentPriceUsd: number;
      totalValueUsd: number;
      allocationPercentage: number;
    }[] = [];
    let totalNetWorthUsd = 0;

    for (const [, asset] of balanceMap) {
      const price = await this.pricingService.getPrice(asset.symbol);
      const totalValueUsd = Math.max(0, asset.balance) * price;
      totalNetWorthUsd += totalValueUsd;

      if (asset.balance > 0) {
        assets.push({
          tokenMint: asset.tokenMint,
          symbol: asset.symbol,
          chain: asset.chain,
          balance: Math.max(0, asset.balance),
          currentPriceUsd: price,
          totalValueUsd,
          allocationPercentage: 0,
        });
      }
    }

    // Calculate allocation %
    if (totalNetWorthUsd > 0) {
      for (const asset of assets) {
        asset.allocationPercentage =
          (asset.totalValueUsd / totalNetWorthUsd) * 100;
      }
    }

    // Upsert the portfolio summary document in MongoDB
    await this.portfolioModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          totalNetWorthUsd,
          assets,
          lastSyncedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    this.logger.log(
      `Updated portfolio for userId=${userId}: $${totalNetWorthUsd.toFixed(2)} total net worth`,
    );
  }

  private async saveEnrichedTransactions(event: TransactionsSyncedEvent) {
    const { userId, address, transactions } = event;

    const enrichedDocs = await Promise.all(
      transactions.map(async (tx) => {
        const timestamp = new Date(tx.blockTime * 1000);
        const details: any = {};

        const inTransfer = tx.tokenTransfers.find((t) => t.direction === 'IN');
        const outTransfer = tx.tokenTransfers.find((t) => t.direction === 'OUT');

        if (inTransfer) {
          const usdValueAtTime = await this.pricingService.getHistoricalPrice(
            inTransfer.symbol,
            timestamp,
          );
          details.tokenIn = {
            symbol: inTransfer.symbol,
            amountFormatted: inTransfer.amountFormatted,
            usdValueAtTime: inTransfer.amountFormatted * usdValueAtTime,
          };
        }

        if (outTransfer) {
          const usdValueAtTime = await this.pricingService.getHistoricalPrice(
            outTransfer.symbol,
            timestamp,
          );
          details.tokenOut = {
            symbol: outTransfer.symbol,
            amountFormatted: outTransfer.amountFormatted,
            usdValueAtTime: outTransfer.amountFormatted * usdValueAtTime,
          };
        }

        return {
          userId,
          walletAddress: address,
          signature: tx.signature,
          type: tx.type,
          timestamp,
          details,
          feeUsd: (tx.fee / 1e9) * 145, // rough SOL/ETH fee to USD conversion
        };
      }),
    );

    // Bulk upsert by signature
    for (const doc of enrichedDocs) {
      await this.enrichedTxModel.findOneAndUpdate(
        { signature: doc.signature },
        { $set: doc },
        { upsert: true },
      );
    }

    this.logger.log(
      `Saved ${enrichedDocs.length} enriched transactions for userId=${userId}`,
    );
  }
}

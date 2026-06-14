import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { PricingService } from './pricing.service';
import {
  PortfolioSummary,
  PortfolioSummarySchema,
} from './schemas/portfolio.schema';
import {
  EnrichedTransaction,
  EnrichedTransactionSchema,
} from './schemas/enriched-transaction.schema';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/wallet_analytics',
    ),
    MongooseModule.forFeature([
      { name: PortfolioSummary.name, schema: PortfolioSummarySchema },
      { name: EnrichedTransaction.name, schema: EnrichedTransactionSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [PricingService],
})
export class AnalyticsServiceModule {}

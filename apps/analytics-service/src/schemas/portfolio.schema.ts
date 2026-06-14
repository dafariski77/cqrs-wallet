import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PortfolioSummaryDocument = PortfolioSummary & Document;

export class AssetItem {
  @Prop({ required: true })
  tokenMint: string;

  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true })
  chain: string;

  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ required: true, default: 0 })
  currentPriceUsd: number;

  @Prop({ required: true, default: 0 })
  totalValueUsd: number;

  @Prop({ required: true, default: 0 })
  allocationPercentage: number;
}

@Schema({ collection: 'portfolio_summaries', timestamps: true })
export class PortfolioSummary {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ default: 0 })
  totalNetWorthUsd: number;

  @Prop({ type: [Object], default: [] })
  assets: AssetItem[];

  @Prop({ default: Date.now })
  lastSyncedAt: Date;
}

export const PortfolioSummarySchema =
  SchemaFactory.createForClass(PortfolioSummary);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EnrichedTransactionDocument = EnrichedTransaction & Document;

export class TokenDetail {
  symbol: string;
  amountFormatted: number;
  usdValueAtTime: number;
}

export class TransactionDetails {
  tokenIn?: TokenDetail;
  tokenOut?: TokenDetail;
}

@Schema({ collection: 'enriched_transactions', timestamps: true })
export class EnrichedTransaction {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true, unique: true })
  signature: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: Object })
  details: TransactionDetails;

  @Prop({ default: 0 })
  feeUsd: number;
}

export const EnrichedTransactionSchema =
  SchemaFactory.createForClass(EnrichedTransaction);

// Index for fast querying by userId + timestamp
EnrichedTransactionSchema.index({ userId: 1, timestamp: -1 });

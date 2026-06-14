// --- Events published to RabbitMQ ---

export class WalletAddedEvent {
  constructor(
    public readonly userId: string,
    public readonly walletId: string,
    public readonly address: string,
    public readonly chainType: string,
  ) {}
}

export class TransactionsSyncedEvent {
  constructor(
    public readonly userId: string,
    public readonly walletId: string,
    public readonly address: string,
    public readonly transactions: RawTransaction[],
  ) {}
}

// --- Raw data shapes from blockchain / indexer ---

export interface RawTokenTransfer {
  tokenMint: string;
  symbol: string;
  amount: string; // raw, unformatted
  amountFormatted: number;
  direction: 'IN' | 'OUT';
  decimals: number;
}

export interface RawTransaction {
  signature: string;
  blockTime: number; // Unix timestamp
  fee: number; // in lamports/wei
  status: 'SUCCESS' | 'FAILED';
  type: 'TRANSFER' | 'SWAP' | 'MINT' | 'OTHER';
  tokenTransfers: RawTokenTransfer[];
}

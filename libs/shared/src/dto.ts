export class AddWalletDto {
  userId: string;
  address: string;
  chainType: 'ETHEREUM' | 'POLYGON' | 'SOLANA';
}

export class GetPortfolioDto {
  userId: string;
}

export class GetTransactionsDto {
  userId: string;
  page?: number;
  limit?: number;
  type?: string;
}

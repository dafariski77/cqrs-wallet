import { Injectable, Logger } from '@nestjs/common';

// Mock token price map (USD)
// In production: replace with CoinGecko API / Binance API
const MOCK_PRICES: Record<string, number> = {
  SOL: 145.0,
  ETH: 3200.0,
  USDC: 1.0,
  USDT: 1.0,
  BTC: 65000.0,
  MATIC: 0.9,
  BNB: 580.0,
};

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  /**
   * Get the current USD price for a token by its symbol.
   * Falls back to 0 if the price is not found (unlisted tokens).
   */
  async getPrice(symbol: string): Promise<number> {
    const price = MOCK_PRICES[symbol.toUpperCase()];
    if (!price) {
      this.logger.warn(`No mock price found for token: ${symbol}. Using 0.`);
      return 0;
    }
    return price;
  }

  /**
   * Get USD price at transaction time.
   * In production: use historical price APIs.
   */
  async getHistoricalPrice(symbol: string, _timestamp: Date): Promise<number> {
    // Simplified: use current mock price with a small variance for demo
    const currentPrice = await this.getPrice(symbol);
    return currentPrice * (0.95 + Math.random() * 0.1); // ±5% variance
  }
}

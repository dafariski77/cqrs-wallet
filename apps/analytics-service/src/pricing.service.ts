import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private cache: Record<string, { price: number; timestamp: number }> = {};
  private readonly CACHE_TTL = 60 * 1000; // 1 minute cache

  // Map symbols to CoinGecko IDs
  private readonly COINGECKO_IDS: Record<string, string> = {
    SOL: 'solana',
    ETH: 'ethereum',
    USDC: 'usd-coin',
    USDT: 'tether',
    BTC: 'bitcoin',
    MATIC: 'matic-network',
    BNB: 'binancecoin',
  };

  /**
   * Get the current USD price for a token by its symbol using CoinGecko API.
   * Falls back to 0 if the price is not found (unlisted tokens).
   */
  async getPrice(symbol: string): Promise<number> {
    const sym = symbol.toUpperCase();
    const now = Date.now();

    // Check cache first
    if (this.cache[sym] && now - this.cache[sym].timestamp < this.CACHE_TTL) {
      return this.cache[sym].price;
    }

    const cgId = this.COINGECKO_IDS[sym];
    if (!cgId) {
      this.logger.warn(`No CoinGecko mapping found for token: ${sym}. Using 0.`);
      return 0;
    }

    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`);
      if (!response.ok) {
        throw new Error(`CoinGecko HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const price = data[cgId]?.usd;
      if (price !== undefined) {
        // Update cache
        this.cache[sym] = { price, timestamp: now };
        return price;
      }
      return 0;
    } catch (err) {
      this.logger.error(`Failed to fetch price from CoinGecko for ${sym}: ${err.message}`);
      // Fallback to cache if available even if expired, else 0
      return this.cache[sym]?.price || 0;
    }
  }

  /**
   * Get USD price at transaction time.
   */
  async getHistoricalPrice(symbol: string, _timestamp: Date): Promise<number> {
    // For production, this would call CoinGecko historical endpoint
    // To avoid complex rate limiting for MVP, returning current price
    return await this.getPrice(symbol);
  }
}

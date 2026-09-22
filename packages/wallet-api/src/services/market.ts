/**
 * Market and pricing related API methods
 */

import type { BaseHttpClient, HttpClient } from '../client/http-client'
import type { CoinPrice, FeeSummary, TickPriceItem } from '../types'

export class MarketService {
  constructor(private readonly httpClient: BaseHttpClient) {}

  // ========================================
  // Price related
  // ========================================

  /**
   * Get coin price
   */
  async getCoinPrice(): Promise<CoinPrice> {
    return this.httpClient.get('/v5/default/price')
  }

  async getBrc20sPrice(ticks: string[]): Promise<TickPriceItem> {
    return this.httpClient.post('/v5/market/brc20/price', { ticks })
  }

  async getRunesPrice(ticks: string[]): Promise<TickPriceItem> {
    return this.httpClient.post('/v5/market/runes/price', { ticks })
  }

  async getAlkanesPrice(ticks: string[]): Promise<TickPriceItem> {
    return this.httpClient.post('/v5/market/alkanes/price', { ticks })
  }
}

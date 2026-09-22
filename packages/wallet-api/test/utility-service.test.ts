import { describe, expect, it, vi } from 'vitest'

import { UtilityService } from '../src/services/utility'

describe('UtilityService', () => {
  it('routes getBuyCoinChannelList by coin type', async () => {
    const httpClient = {
      get: vi.fn().mockResolvedValue([]),
      post: vi.fn(),
    }

    const service = new UtilityService(httpClient as any)

    await service.getBuyCoinChannelList('BTC')
    await service.getBuyCoinChannelList('FB')

    expect(httpClient.get).toHaveBeenNthCalledWith(1, '/v5/buy-btc/channel-list')
    expect(httpClient.get).toHaveBeenNthCalledWith(2, '/v5/buy-fb/channel-list')
  })

  it('routes createBuyCoinPaymentUrl by coin type with same payload', async () => {
    const httpClient = {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue('url'),
    }

    const service = new UtilityService(httpClient as any)

    await service.createBuyCoinPaymentUrl('BTC', 'bc1qabc', 'moonpay')
    await service.createBuyCoinPaymentUrl('FB', 'fb1abc', 'transak')

    expect(httpClient.post).toHaveBeenNthCalledWith(1, '/v5/buy-btc/create', {
      address: 'bc1qabc',
      channel: 'moonpay',
    })
    expect(httpClient.post).toHaveBeenNthCalledWith(2, '/v5/buy-fb/create', {
      address: 'fb1abc',
      channel: 'transak',
    })
  })

  it('passes query params for getAnnouncements', async () => {
    const httpClient = {
      get: vi.fn().mockResolvedValue({ hasMore: false, list: [] }),
      post: vi.fn(),
    }

    const service = new UtilityService(httpClient as any)

    await service.getAnnouncements(10, 20)

    expect(httpClient.get).toHaveBeenCalledWith('/v5/announcement/list', {
      query: {
        cursor: 10,
        size: 20,
      },
    })
  })

  it('passes query params for getAppExtra', async () => {
    const httpClient = {
      get: vi.fn().mockResolvedValue({}),
      post: vi.fn(),
    }

    const service = new UtilityService(httpClient as any)

    await service.getAppExtra(1001, 'zh_TW')

    expect(httpClient.get).toHaveBeenCalledWith('/v5/discovery/app-extra', {
      query: {
        id: 1001,
        locale: 'zh_TW',
      },
    })
  })
})

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { PermissionService } from '../src/permission-service'
import { ChainType } from '@unisat/wallet-types'

const createMockStorage = () => {
  const store: Record<string, any> = {}
  return {
    get: vi.fn(async (key: string) => store[key]),
    set: vi.fn(async (key: string, value: any) => {
      store[key] = value
    }),
    _store: store,
  }
}

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}

describe('PermissionService', () => {
  let service: PermissionService
  let mockStorage: ReturnType<typeof createMockStorage>

  beforeEach(async () => {
    service = new PermissionService()
    mockStorage = createMockStorage()
    await service.init({
      storage: mockStorage as any,
      logger: mockLogger,
    })
  })

  describe('init', () => {
    it('should throw error if storage is not provided', async () => {
      const newService = new PermissionService()
      await expect(newService.init({} as any)).rejects.toThrow(
        'PermissionService: Storage adapter is required'
      )
    })

    it('should load existing cache from storage', async () => {
      const existingData = {
        dumpCache: [
          {
            k: 'https://example.com',
            v: {
              origin: 'https://example.com',
              name: 'Example',
              icon: 'icon.png',
              chain: ChainType.BITCOIN_MAINNET,
              isSigned: false,
              isTop: false,
              isConnected: true,
            },
            e: 0,
          },
        ],
      }
      const storage = createMockStorage()
      storage._store['permission'] = existingData

      const newService = new PermissionService()
      await newService.init({ storage: storage as any })

      const site = newService.getSite('https://example.com')
      expect(site).toBeDefined()
      expect(site?.name).toBe('Example')
    })

    it('should respect autoSync config', async () => {
      const storage = createMockStorage()
      const newService = new PermissionService()
      await newService.init({
        storage: storage as any,
        autoSync: true,
      })

      await newService.addConnectedSite(
        'https://autosync.com',
        'Auto Sync',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )

      expect(storage.set).toHaveBeenCalledWith(
        'permission',
        expect.objectContaining({
          dumpCache: expect.arrayContaining([
            expect.objectContaining({
              k: 'https://autosync.com',
            }),
          ]),
        })
      )
    })

  })

  describe('addConnectedSite', () => {
    it('should add a new connected site', async () => {
      await service.addConnectedSite(
        'https://test.com',
        'Test Site',
        'test-icon.png',
        ChainType.BITCOIN_MAINNET
      )

      const site = service.getSite('https://test.com')
      expect(site).toBeDefined()
      expect(site?.origin).toBe('https://test.com')
      expect(site?.name).toBe('Test Site')
      expect(site?.isConnected).toBe(true)
      expect(site?.isTop).toBe(false)
    })

    it('should set isSigned when provided', async () => {
      await service.addConnectedSite(
        'https://signed.com',
        'Signed Site',
        'icon.png',
        ChainType.BITCOIN_MAINNET,
        true
      )

      const site = service.getSite('https://signed.com')
      expect(site?.isSigned).toBe(true)
    })
  })

  describe('getSite / getConnectedSite', () => {
    beforeEach(async () => {
      await service.addConnectedSite(
        'https://test.com',
        'Test',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
    })

    it('should return site by origin', () => {
      const site = service.getSite('https://test.com')
      expect(site).toBeDefined()
    })

    it('should return undefined for non-existent site', () => {
      const site = service.getSite('https://nonexistent.com')
      expect(site).toBeUndefined()
    })

    it('getConnectedSite should return undefined for disconnected site', async () => {
      await service.removeConnectedSite('https://test.com')
      const site = service.getConnectedSite('https://test.com')
      expect(site).toBeUndefined()
    })
  })

  describe('getWithoutUpdate', () => {
    it('should return site without updating LRU order', async () => {
      await service.addConnectedSite(
        'https://test.com',
        'Test',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )

      const site = service.getWithoutUpdate('https://test.com')
      expect(site).toBeDefined()
      expect(site?.origin).toBe('https://test.com')
    })
  })

  describe('hasPermission', () => {
    it('should return true for connected site', async () => {
      await service.addConnectedSite(
        'https://test.com',
        'Test',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )

      expect(service.hasPermission('https://test.com')).toBe(true)
    })

    it('should return false for non-existent site', () => {
      expect(service.hasPermission('https://unknown.com')).toBe(false)
    })

    it('should return false for an unconnected UniSat origin', () => {
      expect(service.hasPermission('https://unisat.io')).toBe(false)
    })

    it('should return true for the UniSat origin after connection approval', async () => {
      await service.addConnectedSite(
        'https://unisat.io',
        'UniSat',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )

      expect(service.hasPermission('https://unisat.io')).toBe(true)
    })

    it('should return false for disconnected site', async () => {
      await service.addConnectedSite(
        'https://test.com',
        'Test',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.removeConnectedSite('https://test.com')

      expect(service.hasPermission('https://test.com')).toBe(false)
    })
  })

  describe('updateConnectSite', () => {
    beforeEach(async () => {
      await service.addConnectedSite(
        'https://test.com',
        'Test',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
    })

    it('should update site with partial update', async () => {
      await service.updateConnectSite(
        'https://test.com',
        { name: 'Updated Name' },
        true
      )

      const site = service.getSite('https://test.com')
      expect(site?.name).toBe('Updated Name')
      expect(site?.origin).toBe('https://test.com')
    })

    it('should replace site without partial update', async () => {
      await service.updateConnectSite('https://test.com', {
        origin: 'https://test.com',
        name: 'Replaced',
        icon: 'new-icon.png',
        chain: ChainType.BITCOIN_TESTNET,
        isSigned: true,
        isTop: true,
        isConnected: true,
      })

      const site = service.getSite('https://test.com')
      expect(site?.name).toBe('Replaced')
      expect(site?.chain).toBe(ChainType.BITCOIN_TESTNET)
    })

    it('should update the UniSat origin when connected', async () => {
      await service.addConnectedSite(
        'https://unisat.io',
        'UniSat',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.updateConnectSite(
        'https://unisat.io',
        { name: 'Changed' },
        true
      )

      const site = service.getSite('https://unisat.io')
      expect(site?.name).toBe('Changed')
    })
  })

  describe('topConnectedSite / unpinConnectedSite', () => {
    beforeEach(async () => {
      await service.addConnectedSite(
        'https://site1.com',
        'Site 1',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.addConnectedSite(
        'https://site2.com',
        'Site 2',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
    })

    it('should pin site to top', async () => {
      await service.topConnectedSite('https://site1.com')

      const site = service.getSite('https://site1.com')
      expect(site?.isTop).toBe(true)
      expect(site?.order).toBe(1)
    })

    it('should pin with custom order', async () => {
      await service.topConnectedSite('https://site1.com', 5)

      const site = service.getSite('https://site1.com')
      expect(site?.order).toBe(5)
    })

    it('should unpin site', async () => {
      await service.topConnectedSite('https://site1.com')
      await service.unpinConnectedSite('https://site1.com')

      const site = service.getSite('https://site1.com')
      expect(site?.isTop).toBe(false)
    })
  })

  describe('getRecentConnectedSites', () => {
    beforeEach(async () => {
      await service.addConnectedSite(
        'https://site1.com',
        'Site 1',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.addConnectedSite(
        'https://site2.com',
        'Site 2',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.addConnectedSite(
        'https://site3.com',
        'Site 3',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
    })

    it('should return connected sites with pinned first', async () => {
      await service.topConnectedSite('https://site2.com', 1)

      const sites = service.getRecentConnectedSites()
      expect(sites[0].origin).toBe('https://site2.com')
    })

    it('should sort pinned sites by order', async () => {
      await service.topConnectedSite('https://site1.com', 2)
      await service.topConnectedSite('https://site3.com', 1)

      const sites = service.getRecentConnectedSites()
      expect(sites[0].origin).toBe('https://site3.com')
      expect(sites[1].origin).toBe('https://site1.com')
    })
  })

  describe('getConnectedSites', () => {
    it('should return only connected sites', async () => {
      await service.addConnectedSite(
        'https://connected.com',
        'Connected',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.addConnectedSite(
        'https://disconnected.com',
        'Disconnected',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.removeConnectedSite('https://disconnected.com')

      const sites = service.getConnectedSites()
      expect(sites.length).toBe(1)
      expect(sites[0].origin).toBe('https://connected.com')
    })
  })

  describe('getSitesByDefaultChain', () => {
    it('should filter sites by chain', async () => {
      await service.addConnectedSite(
        'https://mainnet.com',
        'Mainnet',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.addConnectedSite(
        'https://testnet.com',
        'Testnet',
        'icon.png',
        ChainType.BITCOIN_TESTNET
      )

      const mainnetSites = service.getSitesByDefaultChain(ChainType.BITCOIN_MAINNET)
      expect(mainnetSites.length).toBe(1)
      expect(mainnetSites[0].origin).toBe('https://mainnet.com')
    })
  })

  describe('removeConnectedSite', () => {
    it('should mark site as disconnected', async () => {
      await service.addConnectedSite(
        'https://test.com',
        'Test',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.removeConnectedSite('https://test.com')

      const site = service.getSite('https://test.com')
      expect(site?.isConnected).toBe(false)
    })

    it('should do nothing for non-existent site', async () => {
      await service.removeConnectedSite('https://nonexistent.com')
      expect(service.getSite('https://nonexistent.com')).toBeUndefined()
    })
  })

  describe('clearAllPermissions', () => {
    it('should clear all sites', async () => {
      await service.addConnectedSite(
        'https://site1.com',
        'Site 1',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.addConnectedSite(
        'https://site2.com',
        'Site 2',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )

      await service.clearAllPermissions()

      expect(service.getConnectedSites().length).toBe(0)
      expect(mockStorage.set).toHaveBeenCalledWith('permission', { dumpCache: [] })
    })
  })

  describe('resetAllData', () => {
    it('should reset all data', async () => {
      await service.addConnectedSite(
        'https://test.com',
        'Test',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )

      service.resetAllData()

      expect(service.getConnectedSites().length).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      await service.addConnectedSite(
        'https://site1.com',
        'Site 1',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.addConnectedSite(
        'https://site2.com',
        'Site 2',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )
      await service.topConnectedSite('https://site1.com')

      const stats = service.getStats()
      expect(stats.total).toBe(2)
      expect(stats.connected).toBe(2)
      expect(stats.pinned).toBe(1)
    })

    it('should return zeros when no sites', () => {
      const stats = service.getStats()
      expect(stats.total).toBe(0)
      expect(stats.connected).toBe(0)
      expect(stats.pinned).toBe(0)
    })
  })

  describe('setRecentConnectedSites', () => {
    it('should set sites order', async () => {
      await service.addConnectedSite(
        'https://site1.com',
        'Site 1',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )

      const newSites = [
        {
          origin: 'https://new-site.com',
          name: 'New Site',
          icon: 'icon.png',
          chain: ChainType.BITCOIN_MAINNET,
          isSigned: false,
          isTop: false,
          isConnected: true,
        },
      ]

      await service.setRecentConnectedSites(newSites)

      const site = service.getSite('https://new-site.com')
      expect(site).toBeDefined()
      expect(site?.name).toBe('New Site')
    })
  })

  describe('touchConnectedSite', () => {
    it('should not throw for existing site', async () => {
      await service.addConnectedSite(
        'https://test.com',
        'Test',
        'icon.png',
        ChainType.BITCOIN_MAINNET
      )

      await expect(service.touchConnectedSite('https://test.com')).resolves.not.toThrow()
    })

    it('should not throw for an unconnected site', async () => {
      await expect(service.touchConnectedSite('https://unisat.io')).resolves.not.toThrow()
    })
  })
})

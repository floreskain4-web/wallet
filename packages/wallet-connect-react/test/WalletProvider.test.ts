import { afterEach, describe, expect, it, vi } from 'vitest'

import { WalletProvider } from '../src/WalletProvider'
import { ChainType, WalletType } from '@unisat/wallet-connect'
import type { BaseWallet, WalletListenerParams } from '@unisat/wallet-connect'

const hookState = {
  effects: [] as Array<() => void | (() => void)>,
  states: [] as unknown[],
  stateSetters: [] as Array<(value: unknown) => void>,
  stateIndex: 0,
}

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useMemo: (factory: () => unknown) => factory(),
    useCallback: (callback: unknown) => callback,
    useEffect: (effect: () => void | (() => void)) => {
      hookState.effects.push(effect)
    },
    useState: (initialValue?: unknown) => {
      const index = hookState.stateIndex
      hookState.stateIndex += 1

      if (hookState.states.length <= index) {
        hookState.states[index] = initialValue
      }

      const setter = (value: unknown) => {
        hookState.states[index] = value
      }
      hookState.stateSetters[index] = setter

      return [hookState.states[index], setter]
    },
  }
})

function resetHooks() {
  hookState.effects = []
  hookState.states = []
  hookState.stateSetters = []
  hookState.stateIndex = 0
}

function createWallet() {
  let listener: WalletListenerParams | undefined
  const wallet = {
    installed: true,
    config: {
      name: 'Test Wallet',
      icon: '',
      type: WalletType.UniSat,
      supportChain: [ChainType.BITCOIN_MAINNET],
    },
    init: vi.fn().mockResolvedValue(undefined),
    setChainType: vi.fn(),
    setTranslator: vi.fn(),
    setNotifier: vi.fn(),
    requestAccount: vi.fn(),
    getAccount: vi.fn().mockResolvedValue({
      address: 'bc1qaccount',
      pubKey: 'pubkey',
    }),
    addListener: vi.fn((params: WalletListenerParams) => {
      listener = params
    }),
    removeListener: vi.fn(),
    getBalance: vi.fn(),
    signPsbt: vi.fn(),
    signPsbts: vi.fn(),
    signMessage: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as BaseWallet

  return {
    wallet,
    getListener: () => listener,
  }
}

async function renderConnectedProvider(options: {
  disconnectOnNetworkChange?: boolean
  wallet: BaseWallet
}) {
  resetHooks()

  WalletProvider({
    chainType: ChainType.BITCOIN_MAINNET,
    wallets: [options.wallet],
    disconnectOnNetworkChange: options.disconnectOnNetworkChange,
    validateAddress: () => true,
    children: null,
  })

  hookState.stateSetters[0]?.(options.wallet)
  hookState.stateIndex = 0
  hookState.effects = []

  WalletProvider({
    chainType: ChainType.BITCOIN_MAINNET,
    wallets: [options.wallet],
    disconnectOnNetworkChange: options.disconnectOnNetworkChange,
    validateAddress: () => true,
    children: null,
  })

  hookState.effects.forEach(effect => effect())
}

describe('WalletProvider network change handling', () => {
  afterEach(() => {
    resetHooks()
    vi.clearAllMocks()
  })

  it('keeps the wallet connected on network change by default', async () => {
    const { wallet, getListener } = createWallet()

    await renderConnectedProvider({ wallet })

    await getListener()?.onNetworkChange()

    expect(wallet.disconnect).not.toHaveBeenCalled()
  })

  it('disconnects on network change when explicitly enabled', async () => {
    const { wallet, getListener } = createWallet()

    await renderConnectedProvider({ wallet, disconnectOnNetworkChange: true })

    await getListener()?.onNetworkChange()

    expect(wallet.disconnect).toHaveBeenCalledTimes(1)
  })

  it('keeps the wallet connected when account is temporarily unavailable during change events', async () => {
    const { wallet, getListener } = createWallet()
    vi.mocked(wallet.getAccount).mockResolvedValue(undefined)

    await renderConnectedProvider({ wallet })

    await getListener()?.onAccountChange()

    expect(wallet.disconnect).not.toHaveBeenCalled()
  })

  it('disconnects when accountsChanged explicitly reports no accounts', async () => {
    const { wallet, getListener } = createWallet()

    await renderConnectedProvider({ wallet })

    await getListener()?.onAccountChange([])

    expect(wallet.disconnect).toHaveBeenCalledTimes(1)
  })
})

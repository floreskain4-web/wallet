'use client'

import type { BaseWallet, ToSignInput } from '@unisat/wallet-connect'
import { isSupportedAddressType } from '@unisat/wallet-connect'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type {
  ConnectedAccount,
  WalletContextType,
  WalletModalProps,
  WalletProviderConfig,
} from './types'

const DEFAULT_STORAGE_KEY = 'wallet_connected_type'

/**
 * Create wallet context with empty defaults
 */
const WalletContext = createContext<WalletContextType>({} as WalletContextType)

/**
 * Hook to access wallet context
 * Must be used within WalletProvider
 */
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext)
  if (!context || Object.keys(context).length === 0) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

/**
 * Default modal component (headless - just renders nothing)
 * Override with renderModal prop to provide custom UI
 */
function DefaultModal(_props: WalletModalProps): React.ReactNode {
  return null
}

/**
 * WalletProvider component
 * Manages wallet connection state and provides context to children
 */
export function WalletProvider({
  chainType,
  wallets,
  storageKey = DEFAULT_STORAGE_KEY,
  translator,
  notifier,
  onUserInitialize,
  onConnectError,
  onAccountChange,
  disconnectOnNetworkChange = false,
  validateAddress = isSupportedAddressType,
  disableAutoConnect = false,
  disableConnect = false,
  children,
  renderModal = DefaultModal,
}: WalletProviderConfig): React.ReactElement {
  // Initialize wallets with config
  const supportedWallets = useMemo(() => {
    wallets.forEach(w => {
      w.setChainType(chainType)
      if (translator) w.setTranslator(translator)
      if (notifier) w.setNotifier(notifier)
    })
    return wallets
  }, [wallets, chainType, translator, notifier])

  const [wallet, setWallet] = useState<BaseWallet>()
  const [account, setAccount] = useState<ConnectedAccount>()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [connectingWallet, setConnectingWallet] = useState<BaseWallet>()
  const [canceledConnect, setCanceledConnect] = useState(false)

  /**
   * Clear connection state
   */
  const clearConnection = useCallback(() => {
    setAccount(undefined)
    setWallet(undefined)
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, '')
    }
  }, [storageKey])

  /**
   * Disconnect from wallet
   */
  const disconnect = useCallback(() => {
    clearConnection()
    if (wallet) {
      wallet.disconnect()
    }
  }, [clearConnection, wallet])

  const loadConnectedAccount = useCallback(
    async (connectedWallet: BaseWallet): Promise<ConnectedAccount | undefined> => {
      const acc = await connectedWallet.getAccount()
      if (!acc || !validateAddress(acc.address)) {
        return undefined
      }

      let extendedData: Record<string, unknown> = {}
      if (onUserInitialize) {
        extendedData = await onUserInitialize(acc)
      }

      return { ...acc, ...extendedData }
    },
    [validateAddress, onUserInitialize]
  )

  /**
   * Initialize wallets on mount
   */
  useEffect(() => {
    async function init() {
      if (typeof window === 'undefined') return

      const connectedWalletType = localStorage.getItem(storageKey)

      // Initialize all wallets
      await Promise.all(
        supportedWallets.map(async w => {
          await w.init()

          // Auto-reconnect if previously connected and not disabled
          if (!disableAutoConnect && connectedWalletType === w.config.type) {
            if (disableConnect) {
              clearConnection()
              return
            }

            try {
              const connectedAccount = await loadConnectedAccount(w)
              if (connectedAccount) {
                setAccount(connectedAccount)
                setWallet(w)
                onAccountChange?.(connectedAccount)
              } else {
                clearConnection()
              }
            } catch {
              clearConnection()
            }
          }
        })
      )

      setIsInitialized(true)
    }

    init()
  }, [
    supportedWallets,
    storageKey,
    disableAutoConnect,
    disableConnect,
    onAccountChange,
    clearConnection,
    loadConnectedAccount,
  ])

  /**
   * Set up wallet event listeners
   */
  useEffect(() => {
    if (!wallet) return

    const handleConnectionRefresh = async (options: { disconnectOnUnavailable: boolean }) => {
      setIsConnecting(true)

      try {
        const connectedAccount = await loadConnectedAccount(wallet)
        if (connectedAccount) {
          setAccount(connectedAccount)
          onAccountChange?.(connectedAccount)
        } else if (options.disconnectOnUnavailable) {
          disconnect()
        }
      } catch {
        if (!options.disconnectOnUnavailable) {
          return
        }
        disconnect()
      } finally {
        setIsConnecting(false)
      }
    }

    const handleAccountChange = async (accounts?: unknown) => {
      if (Array.isArray(accounts) && accounts.length === 0) {
        disconnect()
        return
      }

      await handleConnectionRefresh({ disconnectOnUnavailable: false })
    }

    const handleNetworkChange = async () => {
      if (disconnectOnNetworkChange) {
        disconnect()
        return
      }

      await handleConnectionRefresh({ disconnectOnUnavailable: false })
    }

    wallet.addListener({
      onAccountChange: handleAccountChange,
      onNetworkChange: handleNetworkChange,
    })

    return () => {
      wallet.removeListener({
        onAccountChange: handleAccountChange,
        onNetworkChange: handleNetworkChange,
      })
    }
  }, [wallet, disconnectOnNetworkChange, loadConnectedAccount, onAccountChange, disconnect])

  /**
   * Handle wallet selection
   */
  const handleSelectWallet = useCallback(
    async (selectedWallet: BaseWallet) => {
      if (disableConnect) {
        onConnectError?.(new Error('Connection disabled'))
        return
      }

      try {
        setConnectingWallet(selectedWallet)
        setIsConnecting(true)
        setCanceledConnect(false)

        const acc = await selectedWallet.requestAccount()
        if (acc && !canceledConnect) {
          if (!validateAddress(acc.address)) {
            onConnectError?.(new Error('Unsupported address type'))
            return
          }

          let extendedData: Record<string, unknown> = {}
          if (onUserInitialize) {
            extendedData = await onUserInitialize(acc)
          }

          const connectedAccount: ConnectedAccount = { ...acc, ...extendedData }
          setAccount(connectedAccount)
          setWallet(selectedWallet)

          if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, selectedWallet.config.type)
          }

          setIsModalVisible(false)
          onAccountChange?.(connectedAccount)
        }
      } catch (error) {
        onConnectError?.(error)
      } finally {
        setConnectingWallet(undefined)
        setIsConnecting(false)
      }
    },
    [
      disableConnect,
      canceledConnect,
      validateAddress,
      onUserInitialize,
      onConnectError,
      onAccountChange,
      storageKey,
    ]
  )

  /**
   * Sign single PSBT
   */
  const signPsbt = useCallback(
    async (psbt: string, params: { toSignInputs?: ToSignInput[] } = {}) => {
      if (!wallet) {
        throw new Error('Wallet not connected')
      }
      return wallet.signPsbt(psbt, params)
    },
    [wallet]
  )

  /**
   * Sign multiple PSBTs
   */
  const signPsbts = useCallback(
    async (params: { psbt: string; toSignInputs?: ToSignInput[] }[]) => {
      if (!wallet) {
        throw new Error('Wallet not connected')
      }
      return wallet.signPsbts(params)
    },
    [wallet]
  )

  /**
   * Sign message
   */
  const signMessage = useCallback(
    async (message: string, type: 'ecdsa' | 'bip322-simple' = 'bip322-simple') => {
      if (!wallet) {
        throw new Error('Wallet not connected')
      }
      return wallet.signMessage(message, type)
    },
    [wallet]
  )

  /**
   * Open connect modal
   */
  const connect = useCallback(() => {
    setIsModalVisible(true)
  }, [])

  /**
   * Cancel connection
   */
  const handleCancel = useCallback(() => {
    setCanceledConnect(true)
    setConnectingWallet(undefined)
  }, [])

  /**
   * Close modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false)
    handleCancel()
  }, [handleCancel])

  const contextValue: WalletContextType = useMemo(
    () => ({
      account,
      wallet,
      isConnecting,
      isInitialized,
      connect,
      disconnect,
      signPsbt,
      signPsbts,
      signMessage,
      supportedWallets,
    }),
    [
      account,
      wallet,
      isConnecting,
      isInitialized,
      connect,
      disconnect,
      signPsbt,
      signPsbts,
      signMessage,
      supportedWallets,
    ]
  )

  const modalProps: WalletModalProps = {
    visible: isModalVisible,
    onClose: handleCloseModal,
    wallets: supportedWallets,
    connectingWallet,
    isInitialized,
    onSelectWallet: handleSelectWallet,
    onCancel: handleCancel,
  }

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
      {renderModal(modalProps)}
    </WalletContext.Provider>
  )
}

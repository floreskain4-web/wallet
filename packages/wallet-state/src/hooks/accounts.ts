import { useCallback, useMemo } from 'react'

import { Account, getAccountCapabilities } from '@unisat/wallet-shared'

import { KeyringType } from '@unisat/keyring-service/types'
import { AddressType, ChainType } from '@unisat/wallet-types'

import type { AppState } from '..'
import { useWallet } from '../context/WalletContext'
import { accountActions } from '../reducers/accounts'
import { keyringsActions } from '../reducers/keyrings'
import { settingsActions } from '../reducers/settings'
import { useAppDispatch, useAppSelector } from './base'
import { useCurrentKeyring } from './keyrings'
import { useChainType } from './settings'

export function useAccountsState(): AppState['accounts'] {
  return useAppSelector(state => state.accounts)
}

export function useCurrentAccount() {
  const accountsState = useAccountsState()
  return accountsState.current
}

export function useCurrentAddress() {
  const accountsState = useAccountsState()
  return accountsState.current.address
}

export function useCurrentAccountCapabilities() {
  const currentAccount = useCurrentAccount()
  return useMemo(() => getAccountCapabilities(currentAccount), [currentAccount])
}

export function useAccounts() {
  const accountsState = useAccountsState()
  return accountsState.accounts
}

export function useAccountBalance() {
  const accountsState = useAccountsState()
  const currentAccount = useCurrentAccount()
  return (
    accountsState.balanceV2Map[currentAccount.address] || {
      availableBalance: 0,
      unavailableBalance: 0,
      totalBalance: 0,
      chainType: ChainType.BITCOIN_MAINNET,
    }
  )
}

export function useAddressSummary() {
  const accountsState = useAccountsState()
  return accountsState.addressSummary
}

export function useAccountInscriptions() {
  const accountsState = useAccountsState()
  const currentAccount = useCurrentAccount()
  return accountsState.inscriptionsMap[currentAccount.address] || { list: [], expired: true }
}

export function useInscriptionSummary() {
  const accountsState = useAccountsState()
  return accountsState.inscriptionSummary
}

export function useAppSummary() {
  const accountsState = useAccountsState()
  return accountsState.appSummary
}

export function useUnreadAppSummary() {
  const accountsState = useAccountsState()
  const summary = accountsState.appSummary
  return summary.apps.find(w => w.time && summary.readTabTime && w.time > summary.readTabTime)
}

export function useReadTab() {
  const wallet = useWallet()
  const dispatch = useAppDispatch()
  const appSummary = useAppSummary()
  return useCallback(
    async (name: 'app' | 'home' | 'settings') => {
      await wallet.readTab(name)
      if (name == 'app') {
        const appSummary = await wallet.getAppSummary()
        dispatch(accountActions['setAppSummary']!(appSummary))
      }
    },
    [dispatch, wallet, appSummary]
  )
}

export function useReadApp() {
  const wallet = useWallet()
  const dispatch = useAppDispatch()
  const appSummary = useAppSummary()
  return useCallback(
    async (id: number) => {
      await wallet.readApp(id)
      const appSummary = await wallet.getAppSummary()
      dispatch(accountActions['setAppSummary']!(appSummary))
    },
    [dispatch, wallet, appSummary]
  )
}

export function useHistory() {
  const accountsState = useAccountsState()
  const address = useAccountAddress()
  return accountsState.historyMap[address] || { list: [], expired: true }
}

export function useAccountAddress() {
  const currentAccount = useCurrentAccount()
  return currentAccount.address
}

export function useSetCurrentAccountCallback() {
  const dispatch = useAppDispatch()
  return useCallback(
    (account: Account) => {
      dispatch(accountActions['setCurrent']!(account))
    },
    [dispatch]
  )
}

export function useImportAccountCallback() {
  const wallet = useWallet()
  const dispatch = useAppDispatch()
  const currentKeyring = useCurrentKeyring()
  return useCallback(
    async (privateKey: string, addressType: AddressType) => {
      let success = false
      let error
      try {
        const alianName = await wallet.getNextAlianName(currentKeyring)
        await wallet.createKeyringWithPrivateKey(privateKey, addressType, alianName)
        const currentAccount = await wallet.getCurrentAccount()
        dispatch(accountActions['setCurrent']!(currentAccount))

        success = true
      } catch (e) {
        console.log(e)
        error = (e as any).message
      }
      return { success, error }
    },
    [dispatch, wallet, currentKeyring]
  )
}

export function useChangeAddressFlagCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const currentAccount = useCurrentAccount()
  return useCallback(
    async (isAdd: boolean, flag: number) => {
      const account = isAdd
        ? await wallet.addAddressFlag(currentAccount, flag)
        : await wallet.removeAddressFlag(currentAccount, flag)
      dispatch(accountActions['setCurrentAddressFlag']!(account.flag))
    },
    [dispatch, wallet, currentAccount]
  )
}

// export function useFetchHistoryCallback() {
//   const dispatch = useAppDispatch();
//   const wallet = useWallet();
//   const address = useAccountAddress();
//   return useCallback(async () => {
//     const _accountHistory = await wallet.getAddressHistory(address);
//     dispatch(
//       accountActions.setHistory({
//         address: address,
//         list: _accountHistory
//       })
//     );
//   }, [dispatch, wallet, address]);
// }

export function useFetchBalanceCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const currentAccount = useCurrentAccount()
  const { address } = currentAccount
  const chainType = useChainType()
  return useCallback(async () => {
    if (!address) return

    const summary = await wallet.getAddressSummary(address)
    dispatch(accountActions['setAddressSummary']!({ ...summary, address }))

    const balanceV2 = await wallet.getAddressBalanceV2(address)
    dispatch(
      accountActions['setBalanceV2']!({
        address,
        balance: balanceV2,
        chainType: balanceV2.chainType,
      })
    )
  }, [dispatch, wallet, address, chainType])
}

export function useReloadAccounts() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  return useCallback(async () => {
    const keyrings = await wallet.getKeyrings()
    dispatch(keyringsActions['setKeyrings']!(keyrings))

    const currentKeyring = await wallet.getCurrentKeyring()
    dispatch(keyringsActions['setCurrent']!(currentKeyring))

    const _accounts = await wallet.getAccounts()
    dispatch(accountActions['setAccounts']!(_accounts))

    const account = await wallet.getCurrentAccount()
    dispatch(accountActions['setCurrent']!(account))

    dispatch(accountActions['expireBalance']!(null))
    dispatch(accountActions['expireInscriptions']!(null))

    wallet.getWalletConfig().then(data => {
      dispatch(settingsActions['updateSettings']!({ walletConfig: data }))
    })
  }, [dispatch, wallet])
}

export function useIsKeystoneWallet() {
  const currentKeyring = useCurrentKeyring()
  return currentKeyring.type === KeyringType.KeystoneKeyring
}
export function useModelPopover() {
  const modelState = useAccountsState()
  return modelState.molelsPopover
}

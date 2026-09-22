import { useCallback, useMemo } from 'react'

import { ToAddressInfo, ToSignData, UnspentOutput } from '@unisat/wallet-shared'

import { numUtils, timeUtils } from '@unisat/base-utils'
import { AppState, useI18n, useTools } from '..'
import { useWallet } from '../context/WalletContext'
import { useAccountAddress, useCurrentAccount, useCurrentAccountCapabilities } from '../hooks/accounts'
import { accountActions } from '../reducers/accounts'
import { transactionsActions } from '../reducers/transactions'
import { useAppDispatch, useAppSelector } from './base'

export function useTransactionsState(): AppState['transactions'] {
  return useAppSelector(state => state.transactions)
}

export function useBitcoinTx() {
  const transactionsState = useTransactionsState()
  return transactionsState.bitcoinTx
}

export function usePrepareSendBTCCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const fromAddress = useAccountAddress()
  const utxos = useUtxos()
  const fetchUtxos = useFetchUtxosCallback()
  const accountCapabilities = useCurrentAccountCapabilities()

  const { t } = useI18n()
  return useCallback(
    async ({
      toAddressInfo,
      toAmount,
      feeRate,
      memo,
      memos,
      disableAutoAdjust,
      enableRBF,
    }: {
      toAddressInfo: ToAddressInfo
      toAmount: number
      feeRate?: number
      memo?: string
      memos?: string[]
      disableAutoAdjust?: boolean
      enableRBF?: boolean
    }) => {
      if (!accountCapabilities.canCreateSigningRequest) {
        throw new Error(t('not_supported'))
      }
      let _utxos: UnspentOutput[] = utxos
      if (_utxos.length === 0) {
        _utxos = await fetchUtxos()
      }
      const safeBalance = _utxos
        .filter(v => v.inscriptions.length == 0)
        .reduce((pre, cur) => pre + cur.satoshis, 0)
      if (safeBalance < toAmount) {
        throw new Error(t('insufficient_balance'))
      }

      if (!feeRate) {
        const summary = await wallet.getFeeSummary()
        feeRate = summary.list[1]!.feeRate
      }
      let res: ToSignData

      if (safeBalance === toAmount && !disableAutoAdjust) {
        res = await wallet.createSendAllBTCPsbt({
          to: toAddressInfo.address,
          btcUtxos: _utxos,
          feeRate,
          enableRBF,
        })
      } else {
        res = await wallet.createSendBTCPsbt({
          to: toAddressInfo.address,
          amount: toAmount,
          btcUtxos: _utxos,
          feeRate,
          enableRBF,
          memo: memo!,
          memos: memos!,
        })
      }

      return res
    },
    [dispatch, wallet, fromAddress, utxos, fetchUtxos, accountCapabilities.canCreateSigningRequest, t]
  )
}

export function usePrepareSendBypassHeadOffsetsCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const accountCapabilities = useCurrentAccountCapabilities()
  const { t } = useI18n()
  return useCallback(
    async ({
      toAddressInfo,
      toAmount,
      feeRate,
      enableRBF,
    }: {
      toAddressInfo: ToAddressInfo
      toAmount: number
      feeRate: number
      enableRBF?: boolean
    }) => {
      if (!accountCapabilities.canCreateSigningRequest) {
        throw new Error(t('not_supported'))
      }
      const res = await wallet.createSendBTCOffsetPsbt(
        [
          {
            address: toAddressInfo.address,
            satoshis: toAmount,
          },
        ],
        feeRate,
        enableRBF
      )
      return res
    },
    [dispatch, wallet, accountCapabilities.canCreateSigningRequest, t]
  )
}

export function usePushBitcoinTxCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const tools = useTools()
  return useCallback(
    async (rawtx: string) => {
      const ret = {
        success: false,
        txid: '',
        error: '',
      }
      try {
        tools.showLoading(true)
        const txid = await wallet.pushTx(rawtx)
        await timeUtils.sleep(3) // Wait for transaction synchronization
        tools.showLoading(false)
        dispatch((transactionsActions as any).updateBitcoinTx({ txid }))
        dispatch((accountActions as any).expireBalance())
        setTimeout(() => {
          dispatch((accountActions as any).expireBalance())
        }, 2000)
        setTimeout(() => {
          dispatch((accountActions as any).expireBalance())
        }, 5000)

        ret.success = true
        ret.txid = txid
      } catch (e) {
        ret.error = (e as Error).message
        tools.showLoading(false)
      }

      return ret
    },
    [dispatch, wallet, tools]
  )
}

export function useOrdinalsTx() {
  const transactionsState = useTransactionsState()
  return transactionsState.ordinalsTx
}

export function usePrepareSendOrdinalsInscriptionCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const fromAddress = useAccountAddress()
  const utxos = useUtxos()
  const fetchUtxos = useFetchUtxosCallback()
  const accountCapabilities = useCurrentAccountCapabilities()
  const { t } = useI18n()
  return useCallback(
    async ({
      toAddressInfo,
      inscriptionId,
      feeRate,
      outputValue,
      enableRBF,
    }: {
      toAddressInfo: ToAddressInfo
      inscriptionId: string
      feeRate?: number
      outputValue?: number
      enableRBF?: boolean
    }) => {
      if (!accountCapabilities.canCreateSigningRequest) {
        throw new Error(t('not_supported'))
      }
      if (!feeRate) {
        const summary = await wallet.getFeeSummary()
        feeRate = summary.list[1]!.feeRate
      }

      let btcUtxos = utxos
      if (btcUtxos.length === 0) {
        btcUtxos = await fetchUtxos()
      }

      const toSignData = await wallet.createSendInscriptionPsbt({
        to: toAddressInfo.address,
        inscriptionId,
        feeRate,
        outputValue: outputValue!,
        btcUtxos,
        enableRBF,
      })

      return toSignData
    },
    [dispatch, wallet, fromAddress, utxos, accountCapabilities.canCreateSigningRequest, t]
  )
}

export function usePrepareSendOrdinalsInscriptionsCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const fromAddress = useAccountAddress()
  const fetchUtxos = useFetchUtxosCallback()
  const utxos = useUtxos()
  const accountCapabilities = useCurrentAccountCapabilities()
  const { t } = useI18n()
  return useCallback(
    async ({
      toAddressInfo,
      inscriptionIds,
      feeRate,
      enableRBF,
    }: {
      toAddressInfo: ToAddressInfo
      inscriptionIds: string[]
      feeRate?: number
      enableRBF?: boolean
    }) => {
      if (!accountCapabilities.canCreateSigningRequest) {
        throw new Error(t('not_supported'))
      }
      if (!feeRate) {
        const summary = await wallet.getFeeSummary()
        feeRate = summary.list[1]!.feeRate
      }

      let btcUtxos = utxos
      if (btcUtxos.length === 0) {
        btcUtxos = await fetchUtxos()
      }
      const res = await wallet.createSendMultipleInscriptionsPsbt({
        to: toAddressInfo.address,
        inscriptionIds,
        feeRate,
        btcUtxos,
        enableRBF,
      })

      return res
    },
    [dispatch, wallet, fromAddress, utxos, accountCapabilities.canCreateSigningRequest, t]
  )
}

export function useCreateSplitTxCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const fromAddress = useAccountAddress()
  const utxos = useUtxos()
  const fetchUtxos = useFetchUtxosCallback()
  const account = useCurrentAccount()
  const accountCapabilities = useCurrentAccountCapabilities()
  const { t } = useI18n()
  return useCallback(
    async ({
      inscriptionId,
      feeRate,
      outputValue,
      enableRBF,
    }: {
      inscriptionId: string
      feeRate: number
      outputValue: number
      enableRBF?: boolean
    }) => {
      if (!accountCapabilities.canCreateSigningRequest) {
        throw new Error(t('not_supported'))
      }
      let btcUtxos = utxos
      if (btcUtxos.length === 0) {
        btcUtxos = await fetchUtxos()
      }

      const res = await wallet.createSplitInscriptionPsbt({
        inscriptionId,
        feeRate,
        outputValue,
        btcUtxos,
        enableRBF,
      })

      return res
    },
    [dispatch, wallet, fromAddress, utxos, accountCapabilities.canCreateSigningRequest, t]
  )
}

export function usePushOrdinalsTxCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const tools = useTools()
  return useCallback(
    async (rawtx: string) => {
      const ret = {
        success: false,
        txid: '',
        error: '',
      }
      try {
        tools.showLoading(true)
        const txid = await wallet.pushTx(rawtx)
        await timeUtils.sleep(3) // Wait for transaction synchronization
        tools.showLoading(false)
        dispatch((transactionsActions as any).updateOrdinalsTx({ txid }))

        dispatch((accountActions as any).expireBalance())
        setTimeout(() => {
          dispatch((accountActions as any).expireBalance())
        }, 2000)
        setTimeout(() => {
          dispatch((accountActions as any).expireBalance())
        }, 5000)

        ret.success = true
        ret.txid = txid
      } catch (e) {
        console.log(e)
        ret.error = (e as Error).message
        tools.showLoading(false)
      }

      return ret
    },
    [dispatch, wallet]
  )
}

export function useUtxos() {
  const transactionsState = useTransactionsState()
  return transactionsState.utxos
}

export function useFetchUtxosCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const account = useCurrentAccount()
  return useCallback(async () => {
    const data = await wallet.getBTCUtxos()
    dispatch((transactionsActions as any).setUtxos(data))
    return data
  }, [wallet, account])
}

export function useSpendUnavailableUtxos() {
  const transactionsState = useTransactionsState()
  return transactionsState.spendUnavailableUtxos
}

export function useSetSpendUnavailableUtxosCallback() {
  const dispatch = useAppDispatch()
  return useCallback(
    (utxos: UnspentOutput[]) => {
      dispatch((transactionsActions as any).setSpendUnavailableUtxos(utxos))
    },
    [dispatch]
  )
}

export function useSafeBalance() {
  const utxos = useUtxos()
  return useMemo(() => {
    const satoshis = utxos
      .filter(v => v.inscriptions.length === 0)
      .reduce((pre, cur) => pre + cur.satoshis, 0)
    return numUtils.satoshisToAmount(satoshis)
  }, [utxos])
}

export function useAssetUtxosRunes() {
  const transactionsState = useTransactionsState()
  return transactionsState.assetUtxos_runes
}

export function useFetchAssetUtxosRunesCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const account = useCurrentAccount()
  return useCallback(
    async (rune: string) => {
      const data = await wallet.getAssetUtxosRunes(rune)
      dispatch((transactionsActions as any).setAssetUtxosRunes(data))
      return data
    },
    [wallet, account]
  )
}

export function usePrepareSendRunesCallback() {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const fromAddress = useAccountAddress()
  const utxos = useUtxos()
  const fetchUtxos = useFetchUtxosCallback()
  const assetUtxosRunes = useAssetUtxosRunes()
  const fetchAssetUtxosRunes = useFetchAssetUtxosRunesCallback()
  const account = useCurrentAccount()
  const accountCapabilities = useCurrentAccountCapabilities()
  const { t } = useI18n()
  return useCallback(
    async ({
      toAddressInfo,
      runeid,
      runeAmount,
      outputValue,
      feeRate,
      enableRBF,
    }: {
      toAddressInfo: ToAddressInfo
      runeid: string
      runeAmount: string
      outputValue?: number
      feeRate: number
      enableRBF?: boolean
    }) => {
      if (!accountCapabilities.canCreateSigningRequest) {
        throw new Error(t('not_supported'))
      }
      if (!feeRate) {
        const summary = await wallet.getFeeSummary()
        feeRate = summary.list[1]!.feeRate
      }

      let btcUtxos = utxos
      if (btcUtxos.length === 0) {
        btcUtxos = await fetchUtxos()
      }

      let assetUtxos = assetUtxosRunes
      if (assetUtxos.length == 0) {
        assetUtxos = await fetchAssetUtxosRunes(runeid)
      }

      const toSignData = await wallet.createSendRunesPsbt({
        to: toAddressInfo.address,
        runeid,
        runeAmount,
        outputValue: outputValue!,
        feeRate,
        btcUtxos,
        assetUtxos,
        enableRBF,
      })

      return toSignData
    },
    [
      dispatch,
      wallet,
      fromAddress,
      utxos,
      assetUtxosRunes,
      fetchAssetUtxosRunes,
      account,
      accountCapabilities.canCreateSigningRequest,
      t,
    ]
  )
}

export function useRunesTx() {
  const transactionsState = useTransactionsState()
  return transactionsState.runesTx
}

export function usePrepareSendAlkanesCallback() {
  const wallet = useWallet()
  const account = useCurrentAccount()
  const accountCapabilities = useCurrentAccountCapabilities()
  const { t } = useI18n()
  const callback = useCallback(
    async (
      toAddressInfo: ToAddressInfo,
      alkaneid: string,
      amount: string,
      feeRate: number,
      type: 'ft' | 'nft',
      enableRBF?: boolean
    ) => {
      if (!accountCapabilities.canCreateSigningRequest) {
        throw new Error(t('not_supported'))
      }
      return await wallet.createSendAlkanesPsbt({
        to: toAddressInfo.address,
        alkaneid,
        amount,
        feeRate,
        type,
        enableRBF,
      })
    },
    [wallet, account, accountCapabilities.canCreateSigningRequest, t]
  )
  return callback
}

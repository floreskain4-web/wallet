import { bnUtils } from '@unisat/base-utils'
import { AddressTokenSummary, TickPriceItem, TokenBalance } from '@unisat/wallet-shared'
import { useMemo, useState } from 'react'
import { useI18n } from 'src/context'
import { useBRC20IconInfo, useChain, useCurrentAccount } from 'src/hooks'

export interface BRC20BalanceCardProps {
  tokenBalance: TokenBalance
  onClick?: () => void
  price?: TickPriceItem
}
export function useBRC20BalanceCardLogic(props: BRC20BalanceCardProps) {
  const {
    price,
    tokenBalance: {
      ticker,
      overallBalance,
      transferableBalance,
      selfMint,
      displayName,
      tag,
      swapBalance,
      progBalance,
    },
    onClick,
  } = props

  const account = useCurrentAccount()
  const [tokenSummary, setTokenSummary] = useState<AddressTokenSummary>()

  const { t } = useI18n()

  const deploy_count = tokenSummary ? (tokenSummary.tokenInfo.holder == account.address ? 1 : 0) : 0
  let _names: string[] = []
  const _amounts: string[] = []
  if (deploy_count > 0) {
    _names.push('Deploy')
    _amounts.push('')
  }
  if (tokenSummary) {
    tokenSummary.transferableList.forEach(v => {
      _names.push('Transfer')
      _amounts.push(v.amount)
    })
  }

  for (let i = 0; i < _names.length; i++) {
    if (i == 3) {
      if (_names.length > 4) {
        if (deploy_count > 0) {
          _names[i] = `${_names.length - 3}+`
        } else {
          _names[i] = `${_names.length - 2}+`
        }
        _amounts[i] = ''
      }
      break
    }
  }
  _names = _names.splice(0, 4)

  const onSwapBalance = swapBalance
  const onProgBalance = progBalance
  const inWalletBalance = overallBalance

  const totalBalance = useMemo(() => {
    return bnUtils
      .toBigNumber(inWalletBalance)
      .plus(bnUtils.toBigNumber(onSwapBalance || '0'))
      .plus(bnUtils.toBigNumber(onProgBalance || '0'))
      .toString()
  }, [inWalletBalance, onSwapBalance, onProgBalance])

  const displayTotalBalance = bnUtils.toDisplayAmount(totalBalance)
  const displayInWalletBalance = bnUtils.toDisplayAmount(inWalletBalance)
  const displayOnSwapBalance = bnUtils.toDisplayAmount(onSwapBalance || '0')
  const displayOnProgBalance = bnUtils.toDisplayAmount(onProgBalance || '0')

  let hasOutWalletBalance = false
  if (onSwapBalance && onSwapBalance !== '0') {
    hasOutWalletBalance = true
  }
  if (onProgBalance && onProgBalance !== '0') {
    hasOutWalletBalance = true
  }

  // icon
  const iconInfo = useBRC20IconInfo(ticker)

  // price
  const chain = useChain()
  const showPrice = chain.showPrice

  return {
    // info
    ticker,
    displayName,
    selfMint,
    tag,

    // icon
    iconInfo,

    // balance
    totalBalance,
    hasOutWalletBalance,
    onProgBalance,
    inWalletBalance,
    onSwapBalance,

    // display balance
    displayTotalBalance,
    displayInWalletBalance,
    displayOnSwapBalance,
    displayOnProgBalance,

    // price
    price,
    showPrice,

    // click
    onClick,

    // others
    t,
  }
}

/**
 * Bitcoin related type definitions
 */

import type { Inscription } from './inscriptions'
import type { AlkanesBalance } from './alkanes'
import { AddressType } from '@unisat/wallet-types'

// ========================================
// Bitcoin balance and address types
// ========================================

export interface BitcoinBalance {
  confirm_amount: string
  pending_amount: string
  amount: string
  confirm_btc_amount: string
  pending_btc_amount: string
  btc_amount: string
  confirm_inscription_amount: string
  pending_inscription_amount: string
  inscription_amount: string
  usd_value: string
}

export interface BitcoinBalanceV2 {
  availableBalance: number
  unavailableBalance: number
  totalBalance: number
}

export interface UTXO {
  txid: string
  vout: number
  satoshis: number
  scriptPk: string
  addressType: AddressType
  inscriptions: {
    inscriptionId: string
    inscriptionNumber?: number
    offset: number
  }[]
  atomicals: {
    atomicalId: string
    atomicalNumber: number
    type: 'NFT' | 'FT'
    ticker?: string
    atomicalValue?: number
  }[]
  runes: {
    runeid: string
    rune: string
    amount: string
  }[]
  alkanes?: AlkanesBalance[]
}

export interface UTXO_Detail {
  txId: string
  outputIndex: number
  satoshis: number
  scriptPk: string
  addressType: AddressType
  inscriptions: Inscription[]
}

export interface AddressSummary {
  address: string
  totalSatoshis: number
  btcSatoshis: number
  assetSatoshis: number
  inscriptionCount: number
  atomicalsCount: number
  brc20Count: number
  brc20Count5Byte: number
  arc20Count: number
  runesCount: number
  loading?: boolean
}

// ========================================
// Fee related
// ========================================

export interface FeeSummary {
  list: {
    title: string
    desc: string
    feeRate: number
  }[]
}

// ========================================
// Price related
// ========================================

export interface CoinPrice {
  btc: number
  fb: number
}

export type TickPriceItem = {
  curPrice: number
  changePercent: number
}

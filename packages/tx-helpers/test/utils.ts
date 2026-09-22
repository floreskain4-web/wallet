import { AddressType } from '@unisat/wallet-types'
import { expect } from 'vitest'
import {
  sendAllBTC,
  sendBTC,
  sendInscription,
  sendInscriptions,
  sendRunes,
  splitInscriptionUtxo,
  UnspentOutput,
} from '../src'
import { LocalWallet } from '../src/wallet/local-wallet'
import { printPsbt } from './dump'

let dummyUtxoIndex = 0

/**
 * generate dummy utxos
 */
export function genDummyUtxos(
  wallet: LocalWallet,
  satoshisArray: number[],
  assetsArray?: {
    inscriptions?: { inscriptionId: string; offset: number }[]
    atomicals?: {
      atomicalId: string
      atomicalNumber: number
      type: 'NFT' | 'FT'
      ticker?: string
      atomicalValue: number
    }[]
  }[]
) {
  return satoshisArray.map((v, index) =>
    genDummyUtxo(wallet, satoshisArray[index], assetsArray ? assetsArray[index] : undefined)
  )
}

/**
 * generate a dummy utxo
 */
export function genDummyUtxo(
  wallet: LocalWallet,
  satoshis: number,
  assets?: {
    inscriptions?: { inscriptionId: string; offset: number }[]
    atomicals?: {
      atomicalId: string
      atomicalNumber: number
      type: 'NFT' | 'FT'
      ticker?: string
      atomicalValue?: number
    }[]
    runes?: {
      runeid: string
      amount: string
    }[]
    alkanes?: {
      alkaneid: string
      amount: string
    }[]
  },
  txid?: string,
  vout?: number
): UnspentOutput {
  return {
    txid: txid || '0000000000000000000000000000000000000000000000000000000000000000',
    vout: vout !== undefined ? vout : dummyUtxoIndex++,
    satoshis: satoshis,
    scriptPk: wallet.scriptPk,
    addressType: wallet.addressType,
    pubkey: wallet.pubkey,
    inscriptions: assets?.inscriptions || [],
    runes: assets?.runes || [],
    alkanes: assets?.alkanes || [],
  }
}

/**
 * generate a dummy atomical ft
 */
export function genDummyAtomicalsFT(
  ticker: string,
  atomicalValue: number
): {
  atomicalId: string
  atomicalNumber: number
  type: 'NFT' | 'FT'
  ticker: string
  atomicalValue: number
} {
  return {
    atomicalId: ticker + '_id',
    atomicalNumber: 0,
    type: 'FT',
    ticker,
    atomicalValue,
  }
}

/**
 * generate a dummy atomical nft
 */
export function genDummyAtomicalsNFT(): {
  atomicalId: string
  atomicalNumber: number
  type: 'NFT' | 'FT'
} {
  return {
    atomicalId: 'id',
    atomicalNumber: 0,
    type: 'NFT',
  }
}
/**
 * For P2PKH, the signature length is not fixed, so we need to handle it specially
 */
export function expectFeeRate(addressType: AddressType, feeRateA: number, feeRateB: number) {
  if (addressType === AddressType.P2PKH) {
    expect(feeRateA).lt(feeRateB * 1.01)
    expect(feeRateA).gt(feeRateB * 0.99)
  } else {
    expect(feeRateA).eq(feeRateB)
  }
}

/**
 * create a dummy send btc psbt for test
 */
export async function dummySendBTC({
  wallet,
  btcUtxos,
  tos,
  feeRate,
  dump,
  enableRBF,
  memo,
  memos,
}: {
  wallet: LocalWallet
  btcUtxos: UnspentOutput[]
  tos: { address: string; satoshis: number }[]
  feeRate: number
  dump?: boolean
  enableRBF?: boolean
  memo?: string
  memos?: string[]
}) {
  const { psbt, toSignInputs } = await sendBTC({
    btcUtxos,
    tos,
    networkType: wallet.networkType,
    changeAddress: wallet.address,
    feeRate,
    memo,
    memos,
  })

  await wallet.signPsbt(psbt, { autoFinalized: true, toSignInputs })
  const tx = psbt.extractTransaction(true)
  const txid = tx.getId()
  const inputCount = psbt.txInputs.length
  const outputCount = psbt.txOutputs.length
  const fee = psbt.getFee()
  const virtualSize = tx.virtualSize()
  const finalFeeRate = parseFloat((fee / virtualSize).toFixed(1))
  if (dump) {
    printPsbt(psbt)
  }
  return { psbt, txid, inputCount, outputCount, feeRate: finalFeeRate }
}

/**
 * create a dummy send all btc psbt for test
 */
export async function dummySendAllBTC({
  wallet,
  btcUtxos,
  toAddress,
  feeRate,
  dump,
  enableRBF,
}: {
  wallet: LocalWallet
  btcUtxos: UnspentOutput[]
  toAddress: string
  feeRate: number
  dump?: boolean
  enableRBF?: boolean
}) {
  const { psbt, toSignInputs } = await sendAllBTC({
    btcUtxos,
    toAddress,
    feeRate,
    networkType: wallet.networkType,
  })
  await wallet.signPsbt(psbt, { autoFinalized: true, toSignInputs })

  const inputCount = psbt.txInputs.length
  const outputCount = psbt.txOutputs.length
  if (dump) {
    printPsbt(psbt)
  }

  const fee = psbt.getFee()
  const tx = psbt.extractTransaction(true)
  const virtualSize = tx.virtualSize()
  const txid = tx.getId()
  const finalFeeRate = parseFloat((fee / virtualSize).toFixed(1))
  return { psbt, txid, inputCount, outputCount, feeRate: finalFeeRate }
}

/**
 * create a dummy send inscription psbt for test
 */
export async function dummySendInscription({
  assetWallet,
  assetUtxo,
  btcWallet,
  btcUtxos,
  feeRate,
  toAddress,
  outputValue,
  dump,
  enableRBF,
  enableMixed,
}: {
  assetWallet: LocalWallet
  assetUtxo: UnspentOutput
  btcWallet: LocalWallet
  btcUtxos: UnspentOutput[]
  outputValue: number
  feeRate: number
  toAddress: string
  dump?: boolean
  enableRBF?: boolean
  enableMixed?: boolean
}) {
  const { psbt, toSignInputs } = await sendInscription({
    assetUtxo,
    btcUtxos,
    toAddress,
    feeRate,
    outputValue,
    networkType: btcWallet.networkType,
    changeAddress: btcWallet.address,
    enableMixed,
  })
  const btcToSignInputs = toSignInputs.filter(v => v.publicKey === btcWallet.pubkey)
  if (btcToSignInputs.length > 0) {
    await btcWallet.signPsbt(psbt, {
      autoFinalized: false,
      toSignInputs: btcToSignInputs,
    })
  }

  const assetToSignInputs = toSignInputs.filter(v => v.publicKey === assetWallet.pubkey)

  if (assetToSignInputs.length > 0) {
    await assetWallet.signPsbt(psbt, {
      autoFinalized: false,
      toSignInputs: assetToSignInputs,
    })
  }

  psbt.finalizeAllInputs()

  const tx = psbt.extractTransaction(true)
  const txid = tx.getId()
  const inputCount = psbt.txInputs.length
  const outputCount = psbt.txOutputs.length
  const fee = psbt.getFee()
  const virtualSize = tx.virtualSize()
  const finalFeeRate = parseFloat((fee / virtualSize).toFixed(1))
  if (dump) {
    printPsbt(psbt)
  }
  return { psbt, txid, inputCount, outputCount, feeRate: finalFeeRate }
}

/**
 * create a dummy send inscriptions psbt for test
 */
export async function dummySendInscriptions({
  assetWallet,
  assetUtxos,
  btcWallet,
  btcUtxos,
  feeRate,
  toAddress,
  dump,
  enableRBF,
}: {
  assetWallet: LocalWallet
  assetUtxos: UnspentOutput[]
  btcWallet: LocalWallet
  btcUtxos: UnspentOutput[]
  feeRate: number
  toAddress: string
  dump?: boolean
  enableRBF?: boolean
}) {
  const { psbt, toSignInputs } = await sendInscriptions({
    btcUtxos,
    assetUtxos,
    toAddress,
    feeRate,
    networkType: btcWallet.networkType,
    changeAddress: btcWallet.address,
  })

  const btcToSignInputs = toSignInputs.filter(v => v.publicKey === btcWallet.pubkey)
  if (btcToSignInputs.length > 0) {
    await btcWallet.signPsbt(psbt, {
      autoFinalized: false,
      toSignInputs: btcToSignInputs,
    })
  }

  const assetToSignInputs = toSignInputs.filter(v => v.publicKey === assetWallet.pubkey)
  if (assetToSignInputs.length > 0) {
    await assetWallet.signPsbt(psbt, {
      autoFinalized: false,
      toSignInputs: assetToSignInputs,
    })
  }

  psbt.finalizeAllInputs()

  const tx = psbt.extractTransaction(true)
  const txid = tx.getId()
  const inputCount = psbt.txInputs.length
  const outputCount = psbt.txOutputs.length
  const fee = psbt.getFee()
  const virtualSize = tx.virtualSize()
  const finalFeeRate = parseFloat((fee / virtualSize).toFixed(1))
  if (dump) {
    printPsbt(psbt)
  }
  return { psbt, txid, inputCount, outputCount, feeRate: finalFeeRate }
}

/**
 * create a dummy split inscription psbt for test
 */
export async function dummySplitOrdUtxo({
  assetWallet,
  assetUtxo,
  btcWallet,
  btcUtxos,
  feeRate,
  outputValue,
  dump,
  enableRBF,
}: {
  assetWallet: LocalWallet
  assetUtxo: UnspentOutput
  btcWallet: LocalWallet
  btcUtxos: UnspentOutput[]
  outputValue?: number
  feeRate: number
  dump?: boolean
  enableRBF?: boolean
}) {
  const { psbt, toSignInputs, splitedCount } = await splitInscriptionUtxo({
    assetUtxo,
    btcUtxos,
    feeRate,
    networkType: btcWallet.networkType,
    changeAddress: btcWallet.address,
    outputValue,
  })

  const btcToSignInputs = toSignInputs.filter(v => v.publicKey === btcWallet.pubkey)
  if (btcToSignInputs.length > 0) {
    await btcWallet.signPsbt(psbt, {
      autoFinalized: false,
      toSignInputs: btcToSignInputs,
    })
  }

  const assetToSignInputs = toSignInputs.filter(v => v.publicKey === assetWallet.pubkey)
  if (assetToSignInputs.length > 0) {
    await assetWallet.signPsbt(psbt, {
      autoFinalized: false,
      toSignInputs: assetToSignInputs,
    })
  }

  psbt.finalizeAllInputs()

  const tx = psbt.extractTransaction(true)
  const txid = tx.getId()
  const inputCount = psbt.txInputs.length
  const outputCount = psbt.txOutputs.length
  const fee = psbt.getFee()
  const virtualSize = tx.virtualSize()
  const finalFeeRate = parseFloat((fee / virtualSize).toFixed(1))
  if (dump) {
    printPsbt(psbt)
  }
  return {
    psbt,
    txid,
    inputCount,
    outputCount,
    feeRate: finalFeeRate,
    splitedCount,
  }
}

export async function dummySendRunes({
  assetWallet,
  assetUtxo,
  btcWallet,
  btcUtxos,
  feeRate,
  toAddress,
  dump,
  enableRBF,
  runeid,
  runeAmount,
  outputValue,
}: {
  assetWallet: LocalWallet
  assetUtxo: UnspentOutput
  btcWallet: LocalWallet
  btcUtxos: UnspentOutput[]
  feeRate: number
  toAddress: string
  dump?: boolean
  enableRBF?: boolean
  runeid: string
  runeAmount: string
  outputValue: number
}) {
  const { psbt, toSignInputs } = await sendRunes({
    assetUtxos: [assetUtxo],
    btcUtxos,
    toAddress,
    networkType: btcWallet.networkType,
    btcAddress: btcWallet.address,
    assetAddress: assetWallet.address,
    feeRate,
    runeid,
    runeAmount,
    outputValue,
  })
  const btcToSignInputs = toSignInputs.filter(v => v.publicKey === btcWallet.pubkey)
  if (btcToSignInputs.length > 0) {
    await btcWallet.signPsbt(psbt, {
      autoFinalized: false,
      toSignInputs: btcToSignInputs,
    })
  }

  const assetToSignInputs = toSignInputs.filter(v => v.publicKey === assetWallet.pubkey)

  if (assetToSignInputs.length > 0) {
    await assetWallet.signPsbt(psbt, {
      autoFinalized: false,
      toSignInputs: assetToSignInputs,
    })
  }

  psbt.finalizeAllInputs()

  const tx = psbt.extractTransaction(true)
  const txid = tx.getId()
  const inputCount = psbt.txInputs.length
  const outputCount = psbt.txOutputs.length
  const fee = psbt.getFee()
  const virtualSize = tx.virtualSize()
  const finalFeeRate = parseFloat((fee / virtualSize).toFixed(1))
  if (dump) {
    printPsbt(psbt)
  }
  return { psbt, txid, inputCount, outputCount, feeRate: finalFeeRate }
}

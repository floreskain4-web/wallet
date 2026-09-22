import { ToSignInput } from '@unisat/keyring-service/types'
import { bitcoin, UTXO_DUST } from '@unisat/wallet-bitcoin'
import { ErrorCodes, WalletError } from '@unisat/wallet-shared'
import { NetworkType } from '@unisat/wallet-types'
import { createTx } from './transaction/transaction'
import { utxoHelper } from './transaction/utxo'
import { UnspentOutput } from './types'
export async function sendBTC({
  btcUtxos,
  tos,
  networkType,
  changeAddress,
  feeRate,
  enableRBF = true,
  memo,
  memos,
}: {
  btcUtxos: UnspentOutput[]
  tos: {
    address: string
    satoshis: number
  }[]
  networkType: NetworkType
  changeAddress: string
  feeRate: number
  enableRBF?: boolean
  memo?: string
  memos?: string[]
}): Promise<{
  psbt: bitcoin.Psbt
  toSignInputs: any[]
}> {
  if (utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletError(ErrorCodes.NOT_SAFE_UTXOS)
  }

  const tx = createTx({ networkType, feeRate, changeAddress, enableRBF })

  tos.forEach(v => {
    tx.addOutput(v.address, v.satoshis)
  })

  if (memo) {
    if (Buffer.from(memo, 'hex').toString('hex') === memo) {
      tx.addOpreturn([Buffer.from(memo, 'hex')])
    } else {
      tx.addOpreturn([Buffer.from(memo)])
    }
  } else if (memos) {
    if (Buffer.from(memos[0]!, 'hex').toString('hex') === memos[0]) {
      tx.addOpreturn(memos.map(memo => Buffer.from(memo, 'hex')))
    } else {
      tx.addOpreturn(memos.map(memo => Buffer.from(memo)))
    }
  }

  const toSignInputs = await tx.addSufficientUtxosForFee(btcUtxos)

  const psbt = tx.toPsbt()

  return { psbt, toSignInputs }
}

export async function sendAllBTC({
  btcUtxos,
  toAddress,
  networkType,
  feeRate,
  enableRBF = true,
}: {
  btcUtxos: UnspentOutput[]
  toAddress: string
  networkType: NetworkType
  feeRate: number
  enableRBF?: boolean
}) {
  if (utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletError(ErrorCodes.NOT_SAFE_UTXOS)
  }

  const tx = createTx({ networkType, feeRate, enableRBF })
  tx.addOutput(toAddress, UTXO_DUST)

  const toSignInputs: ToSignInput[] = []
  btcUtxos.forEach((v, index) => {
    tx.addInput(v)
    toSignInputs.push({ index, publicKey: v.pubkey })
  })

  const fee = tx.calSendAllNetworkFee(toAddress)
  const unspent = tx.getTotalInput() - fee
  if (unspent < UTXO_DUST) {
    throw new WalletError(ErrorCodes.INSUFFICIENT_BTC_UTXO)
  }
  tx.outputs[0]!.value = unspent

  const psbt = tx.toPsbt()

  return { psbt, toSignInputs }
}

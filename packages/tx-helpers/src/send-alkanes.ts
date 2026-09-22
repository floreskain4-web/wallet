import { encodeRunestoneProtostone, ProtoStone, RuneId } from '@unisat/alkanes-lib'
import { ToSignInput } from '@unisat/keyring-service/types'
import { ErrorCodes, WalletError } from '@unisat/wallet-shared'
import { NetworkType } from '@unisat/wallet-types'

import { createTx } from './transaction/transaction'
import { utxoHelper } from './transaction/utxo'
import { UnspentOutput } from './types'

export async function sendAlkanes({
  assetUtxos,
  btcUtxos,
  assetAddress,
  btcAddress,
  toAddress,
  networkType,
  alkaneid,
  amount,
  outputValue,
  feeRate,
  enableRBF = true,
}: {
  assetUtxos: UnspentOutput[]
  btcUtxos: UnspentOutput[]
  assetAddress: string
  btcAddress: string
  toAddress: string
  networkType: NetworkType
  alkaneid: string
  amount: string
  outputValue: number
  feeRate: number
  enableRBF?: boolean
}) {
  if (utxoHelper.hasInscription(assetUtxos) || utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletError(ErrorCodes.NOT_SAFE_UTXOS)
  }

  const tx = createTx({ networkType, feeRate, changeAddress: btcAddress, enableRBF })
  const toSignInputs: ToSignInput[] = []

  assetUtxos.forEach((utxo, index) => {
    tx.addInput(utxo)
    toSignInputs.push({ index, publicKey: utxo.pubkey })
  })

  let inputAmount = BigInt(0)
  let hasOtherAlkanes = false
  let hasRunes = false
  assetUtxos.forEach(utxo => {
    utxo.alkanes?.forEach(alkane => {
      if (alkane.alkaneid === alkaneid) {
        inputAmount += BigInt(alkane.amount)
      } else {
        hasOtherAlkanes = true
      }
    })
    if (utxo.runes?.length) {
      hasRunes = true
    }
  })

  const transferAmount = BigInt(amount)
  if (transferAmount <= BigInt(0) || inputAmount < transferAmount) {
    throw new WalletError(ErrorCodes.INSUFFICIENT_ASSET_UTXO)
  }

  const needChange = hasOtherAlkanes || hasRunes || inputAmount > transferAmount
  const recipientOutput = needChange ? 2 : 1
  const changeOutput = needChange ? 1 : recipientOutput
  const script = encodeRunestoneProtostone({
    pointer: changeOutput,
    protostones: [
      ProtoStone.message({
        protocolTag: BigInt(1),
        pointer: changeOutput,
        refundPointer: 0,
        calldata: Buffer.alloc(0),
        edicts: [
          {
            id: RuneId.fromString(alkaneid),
            amount: transferAmount,
            output: recipientOutput,
          },
        ],
      }),
    ],
  }).encodedRunestone

  tx.addScriptOutput(script, 0)
  if (needChange) {
    tx.addOutput(assetAddress, outputValue)
  }
  tx.addOutput(toAddress, outputValue)

  const feeToSignInputs = await tx.addSufficientUtxosForFee(btcUtxos, true)
  toSignInputs.push(...feeToSignInputs)

  return { psbt: tx.toPsbt(), toSignInputs }
}

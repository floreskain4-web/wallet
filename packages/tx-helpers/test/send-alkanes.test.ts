import { Runestone } from '@unisat/alkanes-lib'
import { AddressType, NetworkType } from '@unisat/wallet-types'
import { describe, expect, it } from 'vitest'

import { LocalWallet, sendAlkanes } from '../src'
import { genDummyUtxo } from './utils'

describe('send alkanes', () => {
  const fromBtcWallet = LocalWallet.fromRandom(AddressType.P2TR, NetworkType.MAINNET)
  const fromAssetWallet = LocalWallet.fromRandom(AddressType.P2TR, NetworkType.MAINNET)
  const toWallet = LocalWallet.fromRandom(AddressType.P2TR, NetworkType.MAINNET)

  it('builds an exact transfer to the recipient output', async () => {
    const { psbt } = await sendAlkanes({
      assetUtxos: [
        genDummyUtxo(fromAssetWallet, 546, {
          alkanes: [{ alkaneid: '1000:10', amount: '100' }],
        }),
      ],
      btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
      assetAddress: fromAssetWallet.address,
      btcAddress: fromBtcWallet.address,
      toAddress: toWallet.address,
      networkType: NetworkType.MAINNET,
      alkaneid: '1000:10',
      amount: '100',
      outputValue: 546,
      feeRate: 1,
    })

    expect(psbt.txOutputs).toHaveLength(3)

    const runestone = Runestone.fromOpreturnHex(
      psbt.txOutputs[0]!.script.toString('hex')
    ) as Runestone
    const protocol = runestone.protocols?.[0]
    if (!protocol) throw new Error('Expected Alkanes protocol data')
    const edict = protocol.protocolData.edicts?.[0]
    if (!edict) throw new Error('Expected Alkanes transfer edict')
    expect(protocol.protocolTag).toBe(BigInt(1))
    expect(runestone.pointer).toEqual([BigInt(1)])
    expect(protocol.protocolData.pointer).toBe(BigInt(1))
    expect(edict).toMatchObject({ amount: BigInt(100), output: 1 })
    expect(edict.id.toString()).toBe('1000:10')
  })

  it('returns remaining Alkanes to the sender change output', async () => {
    const { psbt } = await sendAlkanes({
      assetUtxos: [
        genDummyUtxo(fromAssetWallet, 546, {
          alkanes: [{ alkaneid: '1000:10', amount: '200' }],
        }),
      ],
      btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
      assetAddress: fromAssetWallet.address,
      btcAddress: fromBtcWallet.address,
      toAddress: toWallet.address,
      networkType: NetworkType.MAINNET,
      alkaneid: '1000:10',
      amount: '100',
      outputValue: 546,
      feeRate: 1,
    })

    expect(psbt.txOutputs).toHaveLength(4)

    const runestone = Runestone.fromOpreturnHex(
      psbt.txOutputs[0]!.script.toString('hex')
    ) as Runestone
    const protocol = runestone.protocols?.[0]
    if (!protocol) throw new Error('Expected Alkanes protocol data')
    const edict = protocol.protocolData.edicts?.[0]
    if (!edict) throw new Error('Expected Alkanes transfer edict')
    expect(runestone.pointer).toEqual([BigInt(1)])
    expect(protocol.protocolData.pointer).toBe(BigInt(1))
    expect(edict).toMatchObject({ amount: BigInt(100), output: 2 })
    expect(edict.id.toString()).toBe('1000:10')
  })

  it('returns runes to the dedicated asset change output', async () => {
    const { psbt } = await sendAlkanes({
      assetUtxos: [
        genDummyUtxo(fromAssetWallet, 546, {
          alkanes: [{ alkaneid: '1000:10', amount: '100' }],
          runes: [{ runeid: '2000:10', amount: '100' }],
        }),
      ],
      btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
      assetAddress: fromAssetWallet.address,
      btcAddress: fromBtcWallet.address,
      toAddress: toWallet.address,
      networkType: NetworkType.MAINNET,
      alkaneid: '1000:10',
      amount: '100',
      outputValue: 546,
      feeRate: 1,
    })

    expect(psbt.txOutputs).toHaveLength(4)

    const runestone = Runestone.fromOpreturnHex(
      psbt.txOutputs[0]!.script.toString('hex')
    ) as Runestone
    const protocol = runestone.protocols?.[0]
    if (!protocol) throw new Error('Expected Alkanes protocol data')
    const edict = protocol.protocolData.edicts?.[0]
    if (!edict) throw new Error('Expected Alkanes transfer edict')

    expect(runestone.pointer).toEqual([BigInt(1)])
    expect(protocol.protocolData.pointer).toBe(BigInt(1))
    expect(edict).toMatchObject({ amount: BigInt(100), output: 2 })
  })
})

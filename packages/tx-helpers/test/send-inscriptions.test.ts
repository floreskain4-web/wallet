import { AddressType, NetworkType } from '@unisat/wallet-types'
import { beforeEach, describe, expect, it } from 'vitest'
import { LocalWallet } from '../src'

import { ErrorCodes, WalletError } from '@unisat/wallet-shared'
import { dummySendInscriptions, expectFeeRate, genDummyUtxo } from './utils'

describe('sendInscriptions', () => {
  beforeEach(() => {
    // todo
  })

  const testAddressTypes = [
    AddressType.P2TR,
    AddressType.P2SH_P2WPKH,
    AddressType.P2PKH,
    AddressType.P2SH_P2WPKH,
    AddressType.M44_P2TR, // deprecated
    AddressType.M44_P2WPKH, // deprecated
  ]
  testAddressTypes.forEach(addressType => {
    const fromBtcWallet = LocalWallet.fromRandom(addressType, NetworkType.MAINNET)

    const fromAssetWallet = LocalWallet.fromRandom(addressType, NetworkType.MAINNET)

    const toWallet = LocalWallet.fromRandom(addressType, NetworkType.MAINNET)
    describe('basic ' + addressType, function () {
      it.each([
        ['runes', { runes: [{ runeid: '1000:10', amount: '100' }] }],
        ['alkanes', { alkanes: [{ alkaneid: '1:10', amount: '100' }] }],
      ])('rejects an inscription UTXO containing %s', async function (_assetType, assets) {
        await expect(
          dummySendInscriptions({
            toAddress: toWallet.address,
            assetWallet: fromAssetWallet,
            assetUtxos: [
              genDummyUtxo(fromAssetWallet, 10000, {
                inscriptions: [{ inscriptionId: '001', offset: 1000 }],
                ...assets,
              }),
            ],
            btcWallet: fromBtcWallet,
            btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
            feeRate: 1,
          })
        ).rejects.toMatchObject({ code: ErrorCodes.NOT_SAFE_UTXOS })
      })

      it('send one inscription', async function () {
        const ret = await dummySendInscriptions({
          toAddress: toWallet.address,
          assetWallet: fromAssetWallet,
          assetUtxos: [
            genDummyUtxo(fromAssetWallet, 10000, {
              inscriptions: [{ inscriptionId: '001', offset: 1000 }],
            }),
          ],
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1,
        })
        expect(ret.inputCount).eq(2)
        expect(ret.outputCount).eq(2)
        expectFeeRate(addressType, ret.feeRate, 1)
      })

      it('send multiple inscriptions', async function () {
        const ret = await dummySendInscriptions({
          toAddress: toWallet.address,
          assetWallet: fromAssetWallet,
          assetUtxos: [
            genDummyUtxo(fromAssetWallet, 10000, {
              inscriptions: [{ inscriptionId: '001', offset: 1000 }],
            }),
            genDummyUtxo(fromAssetWallet, 10000, {
              inscriptions: [{ inscriptionId: '002', offset: 1000 }],
            }),
          ],
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 2000)],
          feeRate: 1,
        })
        expect(ret.inputCount).eq(3)
        expect(ret.outputCount).eq(3)
        expectFeeRate(addressType, ret.feeRate, 1)
      })

      it('can not send multiple inscriptions in one UTXO', async function () {
        try {
          await dummySendInscriptions({
            toAddress: toWallet.address,
            assetWallet: fromAssetWallet,
            assetUtxos: [
              genDummyUtxo(fromAssetWallet, 100000, {
                inscriptions: [
                  { inscriptionId: '001', offset: 1000 },
                  { inscriptionId: '002', offset: 2000 },
                ],
              }),
            ],
            btcWallet: fromBtcWallet,
            btcUtxos: [genDummyUtxo(fromBtcWallet, 1000)],
            feeRate: 1,
          })
        } catch (e) {
          expect((e as WalletError).code).eq(ErrorCodes.NOT_SAFE_UTXOS)
        }
      })
    })

    describe('select UTXO', function () {
      it('total 2 BTC UTXO only use 1', async function () {
        const ret = await dummySendInscriptions({
          toAddress: toWallet.address,
          assetWallet: fromAssetWallet,
          assetUtxos: [
            genDummyUtxo(fromAssetWallet, 1000, {
              inscriptions: [{ inscriptionId: '001', offset: 0 }],
            }),
            genDummyUtxo(fromAssetWallet, 1000, {
              inscriptions: [{ inscriptionId: '002', offset: 0 }],
            }),
          ],
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000), genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1,
        })
        expect(ret.inputCount).eq(3)
        expect(ret.outputCount).eq(3)
        expectFeeRate(addressType, ret.feeRate, 1)
      })
    })
  })
})

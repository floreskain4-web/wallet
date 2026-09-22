import { describe, expect, it } from 'vitest'
import { isAddressLikelyValid } from '../src/address'

describe('addressUtils', () => {
  it('valid address', async () => {
    const allAddresses = [
      'bc1qwvczaaslq63ckhvaknmugd3j0gflep3g5azmcfyswr4y4q7za6ms7w8a22', // P2SH
      'bc1qq2z2wssazy76tfpucdd32r78xe7urcj2rtlnkw', //  P2WPKH
      'tb1qq2z2wssazy76tfpucdd32r78xe7urcj2fdyqda', // testnet P2WPKH
      '3ESTprj6AdpfGEFgDMri4f2iSf9YutNjXP', // P2SH-P2WPKH
      '2N5zftbf7n6L1U1tDtVUagc1yf1Mig123D2', // testnet P2SH-P2WPKH
      'bc1p8wat4p7077p3k6waauz0pjryywfxly35uz74ve9usp4jp6mk04uqd2mk58', // P2TR
      'tb1p8wat4p7077p3k6waauz0pjryywfxly35uz74ve9usp4jp6mk04uq6zdewg', // testnet P2TR
      'bc1pfeessrawgf', // Pay-to-Anchor
      'tb1pfees9rn5nz', // testnet Pay-to-Anchor
      '1JRtSjhQqt2qCRYN7jtqNUwTgn7uwagUpc', // P2PKH
      'mxwqjnnPeuU5yY1yqJsDCQ9nYmicmGTBns', // testnet P2PKH
    ]
    for (const address of allAddresses) {
      const result = isAddressLikelyValid(address)
      if (!result) {
        throw new Error(`Address validation failed: ${address}`)
      }
      expect(result).toBe(true)
    }
  })

  it('invalid address', async () => {
    const allAddresses = [
      'bc1pfenqc0gyp0', // special short address, but not supported
    ]
    for (const address of allAddresses) {
      const result = isAddressLikelyValid(address) == false
      if (!result) {
        throw new Error(`Address validation failed: ${address}`)
      }
      expect(result).toBe(true)
    }
  })
})

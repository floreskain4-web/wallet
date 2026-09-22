import { describe, expect, it } from 'vitest'

import {
  deriveContextHash,
  parseHexContext,
  validateAppName,
} from '../src/keyrings/derive-context-hash'

const hex = (h: string) => Uint8Array.from(Buffer.from(h, 'hex'))

// Pinned test pubkey: compressed SEC1 at m/44'/0'/0'/0/0 of the canonical
// "abandon × 11 about" BIP-39 mnemonic.
const SPEC_PUBKEY = hex('03aaeb52dd7494c361049de67cc680e83ebcbbbdbeb13637d92cd845f70308af5e')

// A second valid compressed pubkey for cross-tests (different parity, different x).
const OTHER_PUBKEY = hex('02' + '11'.repeat(32))

describe('deriveContextHash (v2.0)', () => {
  const APP_NAME = 'test-app'
  const NETWORK = 'bitcoin-mainnet'

  describe('output format', () => {
    it('returns a 64-character hex string (32 bytes)', () => {
      const ctx = parseHexContext('deadbeef')
      const key = new Uint8Array(32).fill(0xab)
      const result = deriveContextHash(key, APP_NAME, NETWORK, SPEC_PUBKEY, ctx)
      expect(result).toHaveLength(64)
      expect(result).toMatch(/^[0-9a-f]{64}$/)
    })
  })

  describe('determinism', () => {
    it('produces identical results for same (key, appName, network, pubkey, context)', () => {
      const ctx = parseHexContext('deadbeef')
      const key = new Uint8Array(32).fill(0xab)
      const a = deriveContextHash(key, APP_NAME, NETWORK, SPEC_PUBKEY, ctx)
      const b = deriveContextHash(key, APP_NAME, NETWORK, SPEC_PUBKEY, ctx)
      expect(a).toBe(b)
    })
  })

  describe('input differentiation', () => {
    const key = new Uint8Array(32).fill(0xab)
    const ctx = parseHexContext('deadbeef')

    it('different contexts produce different outputs', () => {
      const a = deriveContextHash(key, APP_NAME, NETWORK, SPEC_PUBKEY, parseHexContext('01'))
      const b = deriveContextHash(key, APP_NAME, NETWORK, SPEC_PUBKEY, parseHexContext('02'))
      expect(a).not.toBe(b)
    })

    it('different appNames produce different outputs', () => {
      const a = deriveContextHash(key, 'app-one', NETWORK, SPEC_PUBKEY, ctx)
      const b = deriveContextHash(key, 'app-two', NETWORK, SPEC_PUBKEY, ctx)
      expect(a).not.toBe(b)
    })

    it('different networks produce different outputs', () => {
      const a = deriveContextHash(key, APP_NAME, 'bitcoin-mainnet', SPEC_PUBKEY, ctx)
      const b = deriveContextHash(key, APP_NAME, 'bitcoin-testnet', SPEC_PUBKEY, ctx)
      expect(a).not.toBe(b)
    })

    it('different pubkeys produce different outputs', () => {
      const a = deriveContextHash(key, APP_NAME, NETWORK, SPEC_PUBKEY, ctx)
      const b = deriveContextHash(key, APP_NAME, NETWORK, OTHER_PUBKEY, ctx)
      expect(a).not.toBe(b)
    })

    it('different IKM produces different outputs', () => {
      const ikmA = new Uint8Array(32).fill(0xab)
      const ikmB = new Uint8Array(32).fill(0xcd)
      const a = deriveContextHash(ikmA, APP_NAME, NETWORK, SPEC_PUBKEY, ctx)
      const b = deriveContextHash(ikmB, APP_NAME, NETWORK, SPEC_PUBKEY, ctx)
      expect(a).not.toBe(b)
    })
  })

  describe('input validation', () => {
    const ctx = parseHexContext('deadbeef')
    const key = new Uint8Array(32).fill(0xab)

    it('rejects key material that is not 32 bytes', () => {
      expect(() =>
        deriveContextHash(new Uint8Array(16), APP_NAME, NETWORK, SPEC_PUBKEY, ctx),
      ).toThrow('Input key material must be 32 bytes, got 16')
      expect(() =>
        deriveContextHash(new Uint8Array(64), APP_NAME, NETWORK, SPEC_PUBKEY, ctx),
      ).toThrow('Input key material must be 32 bytes, got 64')
    })

    it('rejects invalid appName', () => {
      expect(() => deriveContextHash(key, '', NETWORK, SPEC_PUBKEY, ctx)).toThrow('non-empty string')
      expect(() => deriveContextHash(key, 'UPPER', NETWORK, SPEC_PUBKEY, ctx)).toThrow('lowercase')
      expect(() => deriveContextHash(key, 'has space', NETWORK, SPEC_PUBKEY, ctx)).toThrow('lowercase')
    })

  })

  describe('pinned wallet-integration vector', () => {
    // BIP-39 "abandon × 11 about", empty passphrase
    // ikm = BIP-32 private key at m/73681862' (hex):
    const IKM_HEX = '391cdb922097ec9c96fc13cadb01d5745ccf31f5dbec3a38103440714779ec85'
    const ikm = new Uint8Array(Buffer.from(IKM_HEX, 'hex'))

    it('reproduces the pinned vector exactly', () => {
      const result = deriveContextHash(
        ikm,
        'test-app',
        'bitcoin-mainnet',
        SPEC_PUBKEY,
        parseHexContext('deadbeef'),
      )
      expect(result).toBe('f82ced3be0e29591a7863ece03d65f79fb494fe0de7203549855f462455df008')
    })
  })
})

describe('validateAppName', () => {
  it('accepts valid appNames', () => {
    expect(() => validateAppName('test-app')).not.toThrow()
    expect(() => validateAppName('babylon-vault')).not.toThrow()
    expect(() => validateAppName('a')).not.toThrow()
    expect(() => validateAppName('a-b-c-123')).not.toThrow()
  })

  it('rejects empty', () => {
    expect(() => validateAppName('')).toThrow('non-empty string')
  })

  it('rejects uppercase', () => {
    expect(() => validateAppName('Test-App')).toThrow('lowercase')
  })

  it('rejects spaces', () => {
    expect(() => validateAppName('test app')).toThrow('lowercase')
  })

  it('rejects underscores', () => {
    expect(() => validateAppName('test_app')).toThrow('lowercase')
  })

  it('rejects > 64 bytes', () => {
    const longName = 'a'.repeat(65)
    expect(() => validateAppName(longName)).toThrow('64 bytes')
  })

  it('accepts exactly 64 bytes', () => {
    const name64 = 'a'.repeat(64)
    expect(() => validateAppName(name64)).not.toThrow()
  })
})

describe('parseHexContext', () => {
  it('parses valid lowercase hex string', () => {
    const result = parseHexContext('deadbeef')
    expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
  })

  it('rejects uppercase hex', () => {
    expect(() => parseHexContext('DEADBEEF')).toThrow('lowercase')
  })

  it('rejects mixed case hex', () => {
    expect(() => parseHexContext('DeAdBeEf')).toThrow('lowercase')
  })

  it('rejects empty string', () => {
    expect(() => parseHexContext('')).toThrow('non-empty')
  })

  it('rejects odd-length hex', () => {
    expect(() => parseHexContext('abc')).toThrow('even-length')
  })

  it('rejects non-hex characters', () => {
    expect(() => parseHexContext('xyz123')).toThrow('lowercase hex')
  })

  it('rejects 0x prefix', () => {
    expect(() => parseHexContext('0xdeadbeef')).toThrow('0x prefix')
  })

  it('rejects 0X prefix', () => {
    expect(() => parseHexContext('0Xdeadbeef')).toThrow('0x prefix')
  })

  it('rejects context exceeding 2048 hex chars', () => {
    const longHex = 'ab'.repeat(1025) // 2050 hex chars
    expect(() => parseHexContext(longHex)).toThrow('2048')
  })

  it('accepts context of exactly 2048 hex chars', () => {
    const maxHex = 'ab'.repeat(1024) // 2048 hex chars
    expect(() => parseHexContext(maxHex)).not.toThrow()
  })
})

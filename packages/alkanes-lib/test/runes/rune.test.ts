import { describe, it, expect } from 'vitest'
import { Rune, RUNE_STEPS } from '../../src/runes/rune'
import { NetworkType } from '@unisat/wallet-types'

describe('Rune.toString / Rune.from_str round-trip', () => {
  const names = ['A', 'Z', 'AA', 'AB', 'AZ', 'BA', 'ZZ', 'AAA', 'AAAA', 'RUNESTONE', 'UNCOMMONGOODS']

  for (const name of names) {
    it(`round-trips "${name}"`, () => {
      const rune = Rune.fromString(name)
      expect(rune.toString()).toBe(name)
    })
  }
})

describe('Rune numeric values', () => {
  it('"A" = 0', () => {
    expect(new Rune(0n).toString()).toBe('A')
    expect(Rune.fromString('A').value).toBe(0n)
  })

  it('"B" = 1', () => {
    expect(new Rune(1n).toString()).toBe('B')
  })

  it('"Z" = 25', () => {
    expect(new Rune(25n).toString()).toBe('Z')
    expect(Rune.fromString('Z').value).toBe(25n)
  })

  it('"AA" = 26', () => {
    expect(new Rune(26n).toString()).toBe('AA')
    expect(Rune.fromString('AA').value).toBe(26n)
  })

  it('"AAAA" = 18278', () => {
    expect(Rune.fromString('AAAA').value).toBe(18278n)
  })
})

describe('Rune.is_reserved', () => {
  it('returns false for short names', () => {
    expect(Rune.fromString('AAAA').is_reserved()).toBe(false)
  })

  it('returns true at RESERVED boundary (27-char threshold)', () => {
    const reserved = new Rune(RUNE_STEPS[26])
    expect(reserved.is_reserved()).toBe(true)
  })
})

describe('Rune.commitment', () => {
  it('returns buffer with no trailing zeros', () => {
    const rune = Rune.fromString('AAAA') // 18278 = 0x4766
    const buf = rune.commitment()
    expect(buf.length).toBeGreaterThan(0)
    expect(buf[buf.length - 1]).not.toBe(0)
  })

  it('A (value=0) yields empty commitment', () => {
    const rune = new Rune(0n)
    expect(rune.commitment().length).toBe(0)
  })

  it('commitment is little-endian', () => {
    // 256 = 0x0100 → LE bytes: [0x00, 0x01], trailing zero stripped → [0x01]
    // Wait, 256 in LE: byte0 = 256 % 256 = 0, byte1 = 1 → strip trailing zeros → but byte0=0 is not trailing
    // Actually: LE means LSB first. 256 = [0x00, 0x01], then strip from end: [0x00, 0x01] — last byte is 0x01 ≠ 0
    const rune = new Rune(256n) // LE: [0x00, 0x01]
    const buf = rune.commitment()
    expect(buf).toEqual(Buffer.from([0x00, 0x01]))
  })
})

describe('Rune.minimumAtHeight', () => {
  it('returns Rune(RUNE_STEPS[12]) before genesis height on mainnet', () => {
    // genesis = 840000, offset = height+1 < 840000 means height < 839999
    const min = Rune.minimumAtHeight(NetworkType.MAINNET, 0)
    expect(min.value).toBe(RUNE_STEPS[12])
  })

  it('returns Rune(0) at or after first halving on mainnet', () => {
    // end = 840000 + 210000 = 1050000 → offset = 1050001 >= end
    const min = Rune.minimumAtHeight(NetworkType.MAINNET, 1050000)
    expect(min.value).toBe(0n)
  })

  it('returns a value in valid range during open period', () => {
    const min = Rune.minimumAtHeight(NetworkType.MAINNET, 850000)
    expect(min.value).toBeGreaterThanOrEqual(0n)
    expect(min.value).toBeLessThanOrEqual(RUNE_STEPS[12])
  })
})

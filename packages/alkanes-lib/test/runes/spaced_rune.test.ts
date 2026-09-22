import { describe, it, expect } from 'vitest'
import { SpacedRune } from '../../src/runes/spaced_rune'
import { Rune } from '../../src/runes/rune'

describe('SpacedRune.toString', () => {
  it('formats rune with no spacers', () => {
    const spaced = new SpacedRune(Rune.fromString('RUNESTONE'), 0)
    expect(spaced.toString()).toBe('RUNESTONE')
  })

  it('inserts bullet between chars where spacer bit is set', () => {
    // bit 3 set = space after position 3 (0-indexed) → "RUNE•STONE"
    const spaced = new SpacedRune(Rune.fromString('RUNESTONE'), 1 << 3)
    expect(spaced.toString()).toBe('RUNE•STONE')
  })

  it('supports multiple spacers', () => {
    // UNCOMMONGOODS indices: U(0)N(1)C(2)O(3)M(4)M(5)O(6)N(7)G(8)O(9)O(10)D(11)S(12)
    // UNC•OMMON•GOODS: space after index 2 (bit 2) and after index 7 (bit 7)
    const spaced = new SpacedRune(Rune.fromString('UNCOMMONGOODS'), (1 << 2) | (1 << 7))
    expect(spaced.toString()).toBe('UNC•OMMON•GOODS')
  })
})

describe('SpacedRune.fromString', () => {
  it('parses rune with no spacers', () => {
    const s = SpacedRune.fromString('RUNESTONE')
    expect(s.rune.toString()).toBe('RUNESTONE')
    expect(s.spacers).toBe(0)
  })

  it('parses bullet separator', () => {
    const s = SpacedRune.fromString('RUNE•STONE')
    expect(s.rune.toString()).toBe('RUNESTONE')
    expect(s.spacers).toBe(1 << 3)
  })

  it('parses dot separator', () => {
    const s = SpacedRune.fromString('RUNE.STONE')
    expect(s.rune.toString()).toBe('RUNESTONE')
    expect(s.spacers).toBe(1 << 3)
  })

  it('round-trips RUNE•STONE', () => {
    expect(SpacedRune.fromString('RUNE•STONE').toString()).toBe('RUNE•STONE')
  })

  it('throws on double spacer', () => {
    expect(() => SpacedRune.fromString('RU••NE')).toThrow('Double spacer error')
  })

  it('throws on trailing spacer', () => {
    expect(() => SpacedRune.fromString('RUNE•')).toThrow('Trailing spacer error')
  })

  it('throws on invalid character', () => {
    expect(() => SpacedRune.fromString('RUNE1')).toThrow('Invalid character error')
  })
})

import { describe, it, expect } from 'vitest'
import { RuneId } from '../../src/runes/rune_id'

describe('RuneId.toString / fromString', () => {
  it('serializes to "block:tx"', () => {
    expect(new RuneId({ block: 840000, tx: 1 }).toString()).toBe('840000:1')
  })

  it('round-trips through string', () => {
    const id = new RuneId({ block: 123456, tx: 42 })
    expect(RuneId.fromString(id.toString())).toEqual(id)
  })
})

describe('RuneId.toBigInt / fromBigInt', () => {
  it('encodes block in upper 16 bits, tx in lower 16 bits', () => {
    const id = new RuneId({ block: 1, tx: 2 })
    expect(id.toBigInt()).toBe((1n << 16n) | 2n)
  })

  it('round-trips through BigInt', () => {
    const id = new RuneId({ block: 840000, tx: 7 })
    const back = RuneId.fromBigInt(id.toBigInt())
    expect(back).toEqual(id)
  })

  it('toInt returns same integer representation', () => {
    const id = new RuneId({ block: 5, tx: 3 })
    expect(id.toInt()).toBe(Number((5n << 16n) | 3n))
  })
})

describe('RuneId.delta', () => {
  it('returns block diff and absolute tx when blocks differ', () => {
    const a = new RuneId({ block: 100, tx: 5 })
    const b = new RuneId({ block: 200, tx: 3 })
    expect(a.delta(b)).toEqual({ block: 100, tx: 3 })
  })

  it('returns block=0 and tx diff when same block', () => {
    const a = new RuneId({ block: 100, tx: 5 })
    const b = new RuneId({ block: 100, tx: 9 })
    expect(a.delta(b)).toEqual({ block: 0, tx: 4 })
  })
})

describe('RuneId.next', () => {
  it('adds block offset and sets absolute tx when block > 0', () => {
    const id = new RuneId({ block: 100, tx: 5 })
    expect(id.next(10, 3)).toEqual(new RuneId({ block: 110, tx: 3 }))
  })

  it('keeps block and adds tx offset when block == 0', () => {
    const id = new RuneId({ block: 100, tx: 5 })
    expect(id.next(0, 4)).toEqual(new RuneId({ block: 100, tx: 9 }))
  })
})

describe('RuneId.compare', () => {
  it('returns 0 for equal IDs', () => {
    expect(new RuneId({ block: 1, tx: 1 }).compare(new RuneId({ block: 1, tx: 1 }))).toBe(0)
  })

  it('orders by block first', () => {
    const a = new RuneId({ block: 1, tx: 100 })
    const b = new RuneId({ block: 2, tx: 0 })
    expect(a.compare(b)).toBe(-1)
    expect(b.compare(a)).toBe(1)
  })

  it('orders by tx when blocks are equal', () => {
    const a = new RuneId({ block: 5, tx: 3 })
    const b = new RuneId({ block: 5, tx: 7 })
    expect(a.compare(b)).toBe(-1)
    expect(b.compare(a)).toBe(1)
  })
})

describe('RuneId.isDefault', () => {
  it('returns true for (0, 0)', () => {
    expect(new RuneId({ block: 0, tx: 0 }).isDefault()).toBe(true)
  })

  it('returns false for non-zero IDs', () => {
    expect(new RuneId({ block: 0, tx: 1 }).isDefault()).toBe(false)
    expect(new RuneId({ block: 1, tx: 0 }).isDefault()).toBe(false)
  })
})

describe('RuneId delta + next inverse property', () => {
  it('next(delta(b)) == b for same-block case', () => {
    const a = new RuneId({ block: 100, tx: 5 })
    const b = new RuneId({ block: 100, tx: 12 })
    const { block, tx } = a.delta(b)
    expect(a.next(block, tx)).toEqual(b)
  })

  it('next(delta(b)) == b for different-block case', () => {
    const a = new RuneId({ block: 100, tx: 5 })
    const b = new RuneId({ block: 200, tx: 3 })
    const { block, tx } = a.delta(b)
    expect(a.next(block, tx)).toEqual(b)
  })
})

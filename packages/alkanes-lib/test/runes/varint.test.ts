import { describe, it, expect } from 'vitest'
import { varint } from '../../src/runes/varint'

describe('varint.encode / varint.decode round-trip', () => {
  const cases = [0n, 1n, 127n, 128n, 255n, 256n, 300n, 840000n, 9999999999n]

  for (const n of cases) {
    it(`round-trips ${n}`, () => {
      const encoded = varint.encode(n)
      const { num } = varint.decode(encoded)
      expect(num).toBe(n)
    })
  }
})

describe('varint.encode', () => {
  it('encodes 0 as single zero byte', () => {
    expect(varint.encode(0n)).toEqual(Buffer.from([0x00]))
  })

  it('encodes 127 as single byte', () => {
    expect(varint.encode(127n)).toEqual(Buffer.from([0x7f]))
  })

  it('encodes 128 as two bytes with continuation bit', () => {
    expect(varint.encode(128n)).toEqual(Buffer.from([0x80, 0x01]))
  })

  it('encodes 300', () => {
    expect(varint.encode(300n)).toEqual(Buffer.from([0xac, 0x02]))
  })
})

describe('varint.decode', () => {
  it('returns num and consumed byte count', () => {
    const buf = Buffer.from([0xac, 0x02, 0x05])
    const { num, index } = varint.decode(buf)
    expect(num).toBe(300n)
    expect(index).toBe(2)
  })

  it('decodes single-byte value and advances by 1', () => {
    const buf = Buffer.from([0x7f])
    const { num, index } = varint.decode(buf)
    expect(num).toBe(127n)
    expect(index).toBe(1)
  })

  it('throws on empty buffer', () => {
    expect(() => varint.decode(Buffer.alloc(0))).toThrow()
  })
})

describe('varint.encodeToVec', () => {
  it('appends varint bytes to existing array', () => {
    const v: number[] = [0x01]
    varint.encodeToVec(128n, v)
    expect(v).toEqual([0x01, 0x80, 0x01])
  })

  it('handles number input (coerced to bigint)', () => {
    const v: number[] = []
    varint.encodeToVec(5, v)
    expect(v).toEqual([0x05])
  })
})

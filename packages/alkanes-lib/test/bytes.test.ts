import { describe, it, expect } from 'vitest'
import { encodeVarInt, encipher, decipher, decodeVarInt, tryDecodeVarInt, leftPadByte } from '../src/bytes'
import { SeekBuffer } from '../src/seekbuffer'

describe('leftPadByte', () => {
  it('pads odd-length hex string', () => {
    expect(leftPadByte('f')).toBe('0f')
    expect(leftPadByte('1a3')).toBe('01a3')
  })

  it('leaves even-length hex string unchanged', () => {
    expect(leftPadByte('ff')).toBe('ff')
    expect(leftPadByte('0f')).toBe('0f')
    expect(leftPadByte('')).toBe('')
  })
})

describe('SeekBuffer', () => {
  it('reads bytes sequentially', () => {
    const buf = new SeekBuffer(Uint8Array.from([0x01, 0x02, 0x03]))
    expect(buf.readUInt8()).toBe(1)
    expect(buf.readUInt8()).toBe(2)
    expect(buf.readUInt8()).toBe(3)
  })

  it('returns undefined when exhausted', () => {
    const buf = new SeekBuffer(Uint8Array.from([0x01]))
    buf.readUInt8()
    expect(buf.readUInt8()).toBeUndefined()
  })

  it('isFinished reflects position', () => {
    const buf = new SeekBuffer(Uint8Array.from([0x01]))
    expect(buf.isFinished()).toBe(false)
    buf.readUInt8()
    expect(buf.isFinished()).toBe(true)
  })

  it('handles empty buffer', () => {
    const buf = new SeekBuffer(new Uint8Array(0))
    expect(buf.isFinished()).toBe(true)
    expect(buf.readUInt8()).toBeUndefined()
  })
})

describe('encodeVarInt', () => {
  it('encodes 0', () => {
    expect(encodeVarInt(0n)).toEqual(Buffer.from([0x00]))
  })

  it('encodes values < 128 as single byte', () => {
    expect(encodeVarInt(1n)).toEqual(Buffer.from([0x01]))
    expect(encodeVarInt(127n)).toEqual(Buffer.from([0x7f]))
  })

  it('encodes 128 as two bytes', () => {
    expect(encodeVarInt(128n)).toEqual(Buffer.from([0x80, 0x01]))
  })

  it('encodes 300', () => {
    expect(encodeVarInt(300n)).toEqual(Buffer.from([0xac, 0x02]))
  })

  it('encodes 840000', () => {
    // 840000: bits 0-6=64 → 0xC0, bits 7-13=34 → 0xA2, bits 14+=51 → 0x33
    expect(encodeVarInt(840000n)).toEqual(Buffer.from([0xc0, 0xa2, 0x33]))
  })
})

describe('encipher / decipher round-trip', () => {
  const cases: bigint[][] = [
    [0n],
    [1n, 2n, 3n],
    [127n, 128n, 255n, 256n],
    [840000n, 1n],
    [0n, 10000000000n, 999999999999999999n],
  ]

  for (const values of cases) {
    it(`round-trips [${values.join(', ')}]`, () => {
      const encoded = encipher(values)
      const decoded = decipher(encoded)
      expect(decoded).toEqual(values)
    })
  }

  it('returns empty array for empty buffer', () => {
    expect(decipher(Buffer.alloc(0))).toEqual([])
  })
})

describe('decodeVarInt', () => {
  it('returns -1n on empty buffer (sentinel for end of input)', () => {
    const buf = new SeekBuffer(new Uint8Array(0))
    expect(decodeVarInt(buf)).toBe(-1n)
  })

  it('returns -1n on malformed overlong sequence', () => {
    const bytes = new Uint8Array(20).fill(0x80)
    const buf = new SeekBuffer(bytes)
    expect(decodeVarInt(buf)).toBe(-1n)
  })
})

describe('tryDecodeVarInt', () => {
  it('throws on unterminated buffer', () => {
    const buf = new SeekBuffer(Uint8Array.from([0x80]))
    expect(() => tryDecodeVarInt(buf)).toThrow('Unterminated')
  })

  it('decodes known value correctly', () => {
    const buf = new SeekBuffer(Uint8Array.from([0xac, 0x02]))
    expect(tryDecodeVarInt(buf)).toBe(300n)
  })
})

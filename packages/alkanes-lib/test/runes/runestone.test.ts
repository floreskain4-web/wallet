import { describe, expect, it } from 'vitest'
import { Cenotaph } from '../../src/runes/cenotaph'
import { Edict } from '../../src/runes/edict'
import { Etching } from '../../src/runes/etching'
import { Rune } from '../../src/runes/rune'
import { RuneId } from '../../src/runes/rune_id'
import { Runestone, pack } from '../../src/runes/runestone'
import { Terms } from '../../src/runes/terms'
import { varint } from '../../src/runes/varint'

// Wrap a raw payload hex into a full OP_RETURN script hex
// Script = OP_RETURN (6a) + OP_13 (5d) + push(payload)
function buildScript(payloadHex: string): string {
  const payload = Buffer.from(payloadHex, 'hex')
  if (payload.length === 0) return '6a5d'
  let push: string
  if (payload.length <= 75) {
    push = payload.length.toString(16).padStart(2, '0')
  } else if (payload.length <= 255) {
    push = '4c' + payload.length.toString(16).padStart(2, '0')
  } else {
    const lo = (payload.length & 0xff).toString(16).padStart(2, '0')
    const hi = (payload.length >> 8).toString(16).padStart(2, '0')
    push = '4d' + lo + hi
  }
  return '6a5d' + push + payloadHex
}

describe('Runestone encipher / fromPayloadScript round-trip', () => {
  it('mint only', () => {
    const rs = new Runestone({
      edicts: [],
      mint: new RuneId({ block: 840000, tx: 1 }),
    })

    const result = Runestone.fromPayloadScript(rs.encipher()) as Runestone
    expect(result).toBeInstanceOf(Runestone)
    expect(result.mint.block).toBe(840000)
    expect(result.mint.tx).toBe(1)
    expect(result.edicts).toHaveLength(0)
  })

  it('pointer only', () => {
    const rs = new Runestone({ edicts: [], pointer: 2 })
    const result = Runestone.fromPayloadScript(rs.encipher()) as Runestone
    expect(result).toBeInstanceOf(Runestone)
    // Tag.Pointer.take() returns raw bigint[] from the field map
    expect(result.pointer).toEqual([2n])
  })

  it('edicts only — sorted by id and delta-encoded', () => {
    const rs = new Runestone({
      edicts: [
        new Edict({ id: new RuneId({ block: 200, tx: 2 }), amount: 500n, output: 1 }),
        new Edict({ id: new RuneId({ block: 100, tx: 1 }), amount: 1000n, output: 0 }),
      ],
    })

    const result = Runestone.fromPayloadScript(rs.encipher()) as Runestone
    expect(result).toBeInstanceOf(Runestone)
    expect(result.edicts).toHaveLength(2)

    const e100 = result.edicts.find(e => e.id.block === 100)!
    expect(e100.amount).toBe(1000n)
    expect(e100.output).toBe(0)

    const e200 = result.edicts.find(e => e.id.block === 200)!
    expect(e200.amount).toBe(500n)
    expect(e200.output).toBe(1)
  })

  it('multiple edicts on same block', () => {
    const rs = new Runestone({
      edicts: [
        new Edict({ id: new RuneId({ block: 100, tx: 1 }), amount: 10n, output: 0 }),
        new Edict({ id: new RuneId({ block: 100, tx: 3 }), amount: 20n, output: 1 }),
      ],
    })

    const result = Runestone.fromPayloadScript(rs.encipher()) as Runestone
    expect(result.edicts).toHaveLength(2)

    const e1 = result.edicts.find(e => e.id.tx === 1)!
    const e3 = result.edicts.find(e => e.id.tx === 3)!
    expect(e1.amount).toBe(10n)
    expect(e3.amount).toBe(20n)
  })

  it('etching with terms', () => {
    const rs = new Runestone({
      edicts: [],
      etching: new Etching({
        divisibility: 2,
        premine: '1000000',
        rune: Rune.fromString('TESTRUNENAME'),
        spacers: 0,
        symbol: '¤',
        terms: new Terms({
          amount: '100',
          cap: '500',
          height: [900000, 1000000],
          offset: [0, 0],
        }),
        turbo: true,
      }),
    })

    const result = Runestone.fromPayloadScript(rs.encipher()) as Runestone
    expect(result).toBeInstanceOf(Runestone)
    const e = result.etching!
    expect(e).toBeDefined()
    expect(e.rune!.toString()).toBe('TESTRUNENAME')
    expect(e.terms).toBeDefined()
    expect(e.turbo).toBe(true)
  })

  it('empty payload yields empty Runestone', () => {
    const result = Runestone.fromPayloadScript('')
    expect(result).toBeInstanceOf(Runestone)
    const rs = result as Runestone
    expect(rs.edicts).toHaveLength(0)
    expect(rs.etching).toBeUndefined()
  })

  it('mint + pointer + edicts together', () => {
    const rs = new Runestone({
      edicts: [new Edict({ id: new RuneId({ block: 50, tx: 0 }), amount: 999n, output: 2 })],
      mint: new RuneId({ block: 840000, tx: 5 }),
      pointer: 0,
    })

    const result = Runestone.fromPayloadScript(rs.encipher()) as Runestone
    expect(result).toBeInstanceOf(Runestone)
    expect(result.mint.block).toBe(840000)
    expect(result.pointer).toEqual([0n])
    expect(result.edicts).toHaveLength(1)
    expect(result.edicts[0].amount).toBe(999n)
  })
})

describe('Runestone.fromOpreturnHex', () => {
  it('returns undefined for non-OP_RETURN script', () => {
    expect(Runestone.fromOpreturnHex('76a914' + 'aa'.repeat(20) + '88ac')).toBeUndefined()
  })

  it('returns undefined for OP_RETURN without magic byte 0x5d', () => {
    // OP_RETURN + push "hello"
    expect(Runestone.fromOpreturnHex('6a0568656c6c6f')).toBeUndefined()
  })

  it('decodes a known mint script (mint 840000:1)', () => {
    // Script verified with bitcoinjs-lib: 6a5d 06 14c0a2331401
    const result = Runestone.fromOpreturnHex('6a5d0614c0a2331401')
    expect(result).toBeInstanceOf(Runestone)
    const rs = result as Runestone
    expect(rs.mint.block).toBe(840000)
    expect(rs.mint.tx).toBe(1)
  })

  it('round-trips encipher output via buildScript helper', () => {
    const rs = new Runestone({
      edicts: [],
      mint: new RuneId({ block: 500000, tx: 10 }),
      pointer: 1,
    })

    const result = Runestone.fromOpreturnHex(buildScript(rs.encipher())) as Runestone
    expect(result).toBeInstanceOf(Runestone)
    expect(result.mint.block).toBe(500000)
    expect(result.mint.tx).toBe(10)
    expect(result.pointer).toEqual([1n])
  })
})

describe('Cenotaph detection', () => {
  it('produces Cenotaph for unrecognized even tag in payload', () => {
    // Tag 100 is even and unknown → Flaw.UnrecognizedEvenTag
    const payload: number[] = []
    varint.encodeToVec(100, payload)
    varint.encodeToVec(1, payload)
    const payloadHex = Buffer.from(new Uint8Array(payload)).toString('hex')

    const result = Runestone.fromPayloadScript(payloadHex)
    expect(result).toBeInstanceOf(Cenotaph)
  })
})

describe('pack', () => {
  it('packs each bigint into a 15-byte chunk', () => {
    expect(pack([1n, 2n]).length).toBe(30)
  })

  it('packs 0n as 15 zero bytes', () => {
    const result = pack([0n])
    expect(result.length).toBe(15)
    expect([...result].every(b => b === 0)).toBe(true)
  })

  it('stores 1n in little-endian order (first byte = 1, rest = 0)', () => {
    const result = pack([1n])
    expect(result[0]).toBe(1)
    expect([...result.slice(1)].every(b => b === 0)).toBe(true)
  })

  it('packs multiple values independently', () => {
    const single = pack([255n])
    const doubled = pack([255n, 255n])
    expect(doubled.slice(0, 15)).toEqual(single)
    expect(doubled.slice(15, 30)).toEqual(single)
  })
})

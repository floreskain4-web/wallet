import { describe, expect, it } from 'vitest'
import {
  encipher,
  encodeRunestoneProtostone,
  ProtoStone,
  ProtoruneEdict,
  ProtoruneRuneId,
  Runestone,
  RunestoneProtostoneUpgrade,
} from '../../src'

function decodeScript(scriptHex: string) {
  return Runestone.fromOpreturnHex(scriptHex)
}

describe('ProtoruneRuneId', () => {
  it('sorts ids in block/tx order', () => {
    const sorted = ProtoruneRuneId.sort([
      new ProtoruneRuneId(2n, 0n),
      new ProtoruneRuneId(1n, 9n),
      new ProtoruneRuneId(1n, 3n),
    ])

    expect(sorted.map(id => id.toString())).toEqual(['1:3', '1:9', '2:0'])
  })

  it('computes delta and next using bigint semantics', () => {
    const base = new ProtoruneRuneId(840000n, 1n)
    expect(base.delta(new ProtoruneRuneId(840000n, 3n))).toEqual([0n, 2n])
    expect(base.next(2n, 7n)?.toString()).toBe('840002:7')
  })

  it('round-trips with strings and rejects invalid zero-block ids via static new', () => {
    expect(ProtoruneRuneId.fromString('100:5').toString()).toBe('100:5')
    expect(ProtoruneRuneId.new(0n, 1n)).toBeUndefined()
  })
})

describe('ProtoruneEdict', () => {
  it('creates a valid edict from integers', () => {
    const edict = ProtoruneEdict.fromIntegers(2, new ProtoruneRuneId(100n, 1n), 50n, 1n)
    expect(edict).toEqual({
      id: new ProtoruneRuneId(100n, 1n),
      amount: 50n,
      output: 1,
    })
  })

  it('rejects invalid rune ids and outputs', () => {
    expect(ProtoruneEdict.fromIntegers(2, new ProtoruneRuneId(0n, 1n), 50n, 1n)).toBeUndefined()
    expect(ProtoruneEdict.fromIntegers(1, new ProtoruneRuneId(100n, 1n), 50n, 2n)).toBeUndefined()
  })
})

describe('protorune compatibility encoding', () => {
  it('ProtoStone accepts ProtoruneEdict payloads', () => {
    const payloads = ProtoStone.edicts({
      protocolTag: 9n,
      edicts: [
        { id: new ProtoruneRuneId(200n, 2n), amount: 100n, output: 1 },
        { id: new ProtoruneRuneId(100n, 1n), amount: 50n, output: 0 },
      ],
    }).encipher_payloads()

    expect(payloads[0]).toBe(9n)
    expect(payloads).toContain(0n)
  })

  it('encodeRunestoneProtostone accepts Protorune ids and edicts', () => {
    const calldata = encipher([1n, 2n, 3n])
    const { encodedRunestone } = encodeRunestoneProtostone({
      mint: new ProtoruneRuneId(840000n, 1n),
      pointer: 2,
      edicts: [{ id: new ProtoruneRuneId(100n, 1n), amount: 500n, output: 0 }],
      protostones: [
        ProtoStone.message({
          protocolTag: 1n,
          calldata,
          pointer: 3,
          refundPointer: 1,
          edicts: [{ id: new ProtoruneRuneId(99n, 1n), amount: 7n, output: 0 }],
        }),
      ],
    })

    const decoded = decodeScript(encodedRunestone.toString('hex')) as Runestone
    expect(decoded.mint.block).toBe(840000)
    expect(decoded.pointer).toEqual([2n])
    expect(decoded.edicts).toHaveLength(1)
    expect(decoded.protocols).toHaveLength(1)
    expect(decoded.protocols[0].protocolTag).toBe(1n)
  })

  it('RunestoneProtostoneUpgrade encodes the same script as encodeRunestoneProtostone', () => {
    const mint = new ProtoruneRuneId(840123n, 2n)
    const edicts = [{ id: new ProtoruneRuneId(120n, 3n), amount: 88n, output: 0 }]
    const protostones = [ProtoStone.burn({ protocolTag: 2n, pointer: 1, edicts })]

    const encodedByFunction = encodeRunestoneProtostone({
      mint,
      pointer: 3,
      edicts,
      protostones,
    }).encodedRunestone

    const encodedByClass = new RunestoneProtostoneUpgrade(
      mint,
      3,
      edicts,
      undefined,
      protostones,
    ).encipher()

    expect(encodedByClass).toEqual(encodedByFunction)
  })
})

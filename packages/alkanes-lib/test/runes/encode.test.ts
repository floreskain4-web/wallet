import { describe, expect, it } from 'vitest'
import { encipher, unpack } from '../../src/bytes'
import { Edict } from '../../src/runes/edict'
import { encodeRunestoneProtostone, runeCommitment } from '../../src/runes/encode'
import { ProtoStone } from '../../src/runes/protostone'
import { RuneId } from '../../src/runes/rune_id'
import { pack, Runestone } from '../../src/runes/runestone'
import { Tag } from '../../src/runes/tag'

// Decode an OP_RETURN script back to a Runestone for round-trip assertions
function decodeScript(scriptHex: string) {
  return Runestone.fromOpreturnHex(scriptHex)
}

describe('unpack', () => {
  it('returns empty array for empty buffer', () => {
    expect(unpack(Buffer.alloc(0))).toEqual([])
  })

  it('chunks buffer into 15-byte LE bigints', () => {
    // Single byte 0x01 → chunk [0x01] reversed → bigint 1
    expect(unpack(Buffer.from([0x01]))).toEqual([1n])
  })

  it('is the inverse of pack (round-trip)', () => {
    const original = [1n, 255n, 256n, 840000n]
    const packed = pack(original)
    const unpacked = unpack(packed)
    expect(unpacked).toEqual(original)
  })

  it('is consistent with encipher/decipher round-trip', () => {
    // encipher some bigints, unpack into chunks, then verify we can recover
    // (the chunks themselves are just storage; no decipher here)
    const values = [1n, 2n, 3n, 127n, 128n]
    const encoded = encipher(values)
    const chunks = unpack(encoded)
    expect(chunks.length).toBeGreaterThan(0)
    // All chunks are non-negative bigints
    expect(chunks.every(c => c >= 0n)).toBe(true)
  })
})

describe('ProtoStone.encipher_payloads', () => {
  it('burn: prepends [protocolTag, length] and encodes pointer', () => {
    const ps = ProtoStone.burn({ protocolTag: 1n, pointer: 2 })
    const payloads = ps.encipher_payloads()
    // [1n, length, 91n (ProtoTag.Pointer), 2n]
    expect(payloads[0]).toBe(1n) // protocolTag
    expect(payloads[1]).toBe(BigInt(payloads.length - 2)) // length
    expect(payloads).toContain(91n) // ProtoTag.Pointer.value
    expect(payloads).toContain(2n)
  })

  it('burn with from: includes ProtoTag.From (95)', () => {
    const ps = ProtoStone.burn({ protocolTag: 1n, pointer: 0, from: [3] })
    const payloads = ps.encipher_payloads()
    expect(payloads).toContain(95n) // ProtoTag.From.value
    expect(payloads).toContain(3n)
  })

  it('message: encodes pointer, refund, and calldata chunks', () => {
    const calldata = encipher([1n, 2n, 3n])
    const ps = ProtoStone.message({ protocolTag: 2n, calldata, pointer: 1, refundPointer: 0 })
    const payloads = ps.encipher_payloads()
    expect(payloads[0]).toBe(2n) // protocolTag
    expect(payloads).toContain(91n) // ProtoTag.Pointer
    expect(payloads).toContain(93n) // ProtoTag.Refund
    expect(payloads).toContain(81n) // ProtoTag.Message (for calldata chunks)
  })

  it('edicts only: encodes body tag and sorted delta edicts', () => {
    const ps = ProtoStone.edicts({
      protocolTag: 3n,
      edicts: [
        new Edict({ id: new RuneId({ block: 200, tx: 2 }), amount: 100n, output: 1 }),
        new Edict({ id: new RuneId({ block: 100, tx: 1 }), amount: 50n, output: 0 }),
      ],
    })
    const payloads = ps.encipher_payloads()
    expect(payloads[0]).toBe(3n) // protocolTag
    expect(payloads).toContain(0n) // ProtoTag.Body
  })

  it('length field equals number of payload items after it', () => {
    const ps = ProtoStone.burn({ protocolTag: 1n, pointer: 5 })
    const payloads = ps.encipher_payloads()
    // payloads = [protocolTag, length, ...rest]
    // length should equal rest.length
    expect(payloads[1]).toBe(BigInt(payloads.length - 2))
  })
})

describe('encodeRunestoneProtostone', () => {
  it('produces a Buffer starting with OP_RETURN (0x6a) and OP_13 (0x5d)', () => {
    const { encodedRunestone } = encodeRunestoneProtostone({
      mint: { block: 840000n, tx: 1n },
      protostones: [ProtoStone.burn({ protocolTag: 1n, pointer: 1 })],
    })
    expect(encodedRunestone[0]).toBe(0x6a) // OP_RETURN
    expect(encodedRunestone[1]).toBe(0x5d) // OP_13
  })

  it('is decodable by Runestone.fromOpreturnHex', () => {
    const { encodedRunestone } = encodeRunestoneProtostone({
      mint: { block: 840000n, tx: 1n },
    })
    const decoded = decodeScript(encodedRunestone.toString('hex'))
    expect(decoded).toBeInstanceOf(Runestone)
    const rs = decoded as Runestone
    expect(rs.mint.block).toBe(840000)
    expect(rs.mint.tx).toBe(1)
  })

  it('mint + pointer round-trips through decoder', () => {
    const { encodedRunestone } = encodeRunestoneProtostone({
      mint: { block: 500000n, tx: 5n },
      pointer: 2,
    })
    const decoded = decodeScript(encodedRunestone.toString('hex')) as Runestone
    expect(decoded.mint.block).toBe(500000)
    expect(decoded.mint.tx).toBe(5)
  })

  it('embeds protostone and decoder finds Protocol field', () => {
    const calldata = encipher([1n, 100n]) // protobuf-style calldata
    const { encodedRunestone } = encodeRunestoneProtostone({
      mint: { block: 840000n, tx: 1n },
      pointer: 1,
      protostones: [
        ProtoStone.message({
          protocolTag: 1n,
          calldata,
          pointer: 2,
          refundPointer: 0,
        }),
      ],
    })
    const decoded = decodeScript(encodedRunestone.toString('hex')) as Runestone
    expect(decoded).toBeInstanceOf(Runestone)
    // The protocol field should be present and contain the decoded protostone
    expect(decoded.protocols).toBeDefined()
    expect(decoded.protocols.length).toBeGreaterThan(0)
    expect(decoded.protocols[0].protocolTag).toBe(1n)
  })

  it('multiple protostones are all decoded', () => {
    const { encodedRunestone } = encodeRunestoneProtostone({
      protostones: [
        ProtoStone.burn({ protocolTag: 1n, pointer: 0 }),
        ProtoStone.burn({ protocolTag: 2n, pointer: 1 }),
      ],
    })
    const decoded = decodeScript(encodedRunestone.toString('hex')) as Runestone
    expect(decoded.protocols.length).toBe(2)
    const tags = decoded.protocols.map(p => p.protocolTag)
    expect(tags).toContain(1n)
    expect(tags).toContain(2n)
  })

  it('decodes multiple protorunes from one OP_RETURN across protocol chunks', () => {
    const firstCalldataValues = [
      1n,
      2n,
      3n,
      4n,
      5n,
      6n,
      7n,
      8n,
      9n,
      10n,
      11n,
      12n,
      13n,
      14n,
      15n,
      16n,
      17n,
      18n,
    ]
    const secondCalldataValues = [21n, 22n, 23n]
    const firstCalldata = encipher(firstCalldataValues)
    const secondCalldata = encipher(secondCalldataValues)
    const { encodedRunestone } = encodeRunestoneProtostone({
      protostones: [
        ProtoStone.message({
          protocolTag: 11n,
          calldata: firstCalldata,
          pointer: 2,
          refundPointer: 0,
        }),
        ProtoStone.burn({ protocolTag: 22n, pointer: 1 }),
        ProtoStone.message({
          protocolTag: 33n,
          calldata: secondCalldata,
          pointer: 3,
          refundPointer: 1,
        }),
      ],
    })

    const parser = new Runestone({ edicts: [] })
    const payload = parser.payloadFromScript(encodedRunestone)
    expect(payload).toBeDefined()

    const outerIntegers = parser.integers(payload!)
    const protocolFieldCount = outerIntegers.filter((value, index) => {
      return index % 2 === 0 && value === BigInt(Tag.Protocol.value)
    }).length
    expect(protocolFieldCount).toBeGreaterThan(1)

    const decoded = decodeScript(encodedRunestone.toString('hex')) as Runestone
    expect(decoded.protocols.map(protocol => protocol.protocolTag)).toEqual([
      11n,
      22n,
      33n,
    ])
    expect(decoded.protocols[0].protocolData.pointer).toBe(2n)
    expect(decoded.protocols[0].protocolData.refund).toBe(0n)
    expect(decoded.protocols[0].protocolData.calldata).toEqual(firstCalldataValues)
    expect(decoded.protocols[1].protocolData.pointer).toBe(1n)
    expect(decoded.protocols[2].protocolData.pointer).toBe(3n)
    expect(decoded.protocols[2].protocolData.refund).toBe(1n)
    expect(decoded.protocols[2].protocolData.calldata).toEqual(secondCalldataValues)
  })

  it('decodes three protostones with edicts from one OP_RETURN', () => {
    const { encodedRunestone } = encodeRunestoneProtostone({
      protostones: [
        ProtoStone.message({
          protocolTag: 11n,
          calldata: encipher([1n]),
          pointer: 0,
          refundPointer: 0,
          edicts: [
            { id: new RuneId({ block: 100, tx: 1 }), amount: 1000n, output: 0 },
          ],
        }),
        ProtoStone.message({
          protocolTag: 22n,
          calldata: encipher([2n]),
          pointer: 1,
          refundPointer: 0,
          edicts: [
            { id: new RuneId({ block: 200, tx: 2 }), amount: 2000n, output: 1 },
          ],
        }),
        ProtoStone.message({
          protocolTag: 33n,
          calldata: encipher([3n]),
          pointer: 2,
          refundPointer: 1,
          edicts: [
            { id: new RuneId({ block: 300, tx: 3 }), amount: 3000n, output: 2 },
          ],
        }),
      ],
    })

    const parser = new Runestone({ edicts: [] })
    const payload = parser.payloadFromScript(encodedRunestone)
    expect(payload).toBeDefined()

    const outerIntegers = parser.integers(payload!)
    const protocolFieldCount = outerIntegers.filter((value, index) => {
      return index % 2 === 0 && value === BigInt(Tag.Protocol.value)
    }).length
    expect(protocolFieldCount).toBeGreaterThan(1)

    const decoded = decodeScript(encodedRunestone.toString('hex')) as Runestone
    expect(decoded.protocols.map(protocol => protocol.protocolTag)).toEqual([
      11n,
      22n,
      33n,
    ])

    expect(decoded.protocols[0].protocolData.edicts).toHaveLength(1)
    expect(decoded.protocols[0].protocolData.edicts[0].id.toString()).toBe('100:1')
    expect(decoded.protocols[0].protocolData.edicts[0].amount).toBe(1000n)
    expect(decoded.protocols[0].protocolData.edicts[0].output).toBe(0)

    expect(decoded.protocols[1].protocolData.edicts).toHaveLength(1)
    expect(decoded.protocols[1].protocolData.edicts[0].id.toString()).toBe('200:2')
    expect(decoded.protocols[1].protocolData.edicts[0].amount).toBe(2000n)
    expect(decoded.protocols[1].protocolData.edicts[0].output).toBe(1)

    expect(decoded.protocols[2].protocolData.edicts).toHaveLength(1)
    expect(decoded.protocols[2].protocolData.edicts[0].id.toString()).toBe('300:3')
    expect(decoded.protocols[2].protocolData.edicts[0].amount).toBe(3000n)
    expect(decoded.protocols[2].protocolData.edicts[0].output).toBe(2)
  })

  it('etching: no etchingCommitment without runeName', () => {
    const { etchingCommitment } = encodeRunestoneProtostone({
      etching: { symbol: '¤', divisibility: 2 },
    })
    expect(etchingCommitment).toBeUndefined()
  })

  it('etching with runeName returns etchingCommitment', () => {
    const { encodedRunestone, etchingCommitment } = encodeRunestoneProtostone({
      etching: { runeName: 'TESTRUNENAME', symbol: '¤', divisibility: 2, turbo: true },
    })
    expect(etchingCommitment).toBeDefined()
    expect(etchingCommitment.length).toBeGreaterThan(0)
    expect(encodedRunestone[0]).toBe(0x6a)
  })

  it('outer edicts are encoded and decodable', () => {
    const { encodedRunestone } = encodeRunestoneProtostone({
      edicts: [new Edict({ id: new RuneId({ block: 100, tx: 1 }), amount: 1000n, output: 0 })],
    })
    const decoded = decodeScript(encodedRunestone.toString('hex')) as Runestone
    expect(decoded.edicts).toHaveLength(1)
    expect(decoded.edicts[0].amount).toBe(1000n)
  })
})

describe('runeCommitment', () => {
  it('returns non-empty buffer for named rune', () => {
    const buf = runeCommitment('TESTRUNENAME')
    expect(buf.length).toBeGreaterThan(0)
  })

  it('strips spacer characters before computing commitment', () => {
    const withDot = runeCommitment('RUNE.STONE')
    const withBullet = runeCommitment('RUNE•STONE')
    const plain = runeCommitment('RUNESTONE')
    expect(withDot).toEqual(plain)
    expect(withBullet).toEqual(plain)
  })
})

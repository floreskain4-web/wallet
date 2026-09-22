import { describe, expect, it } from 'vitest'
import { encipher } from '../../src/bytes'
import { AlkaneUpdater } from '../../src/runes/alkanes_updater'
import { encodeRunestoneProtostone } from '../../src/runes/encode'
import { ProtoStone } from '../../src/runes/protostone'
import { RuneId } from '../../src/runes/rune_id'
import { Runestone } from '../../src/runes/runestone'

describe('AlkaneUpdater.parse_transfer', () => {
  it('parses three protostones with edicts without throwing', () => {
    const { encodedRunestone } = encodeRunestoneProtostone({
      protostones: [
        ProtoStone.message({
          protocolTag: 11n,
          calldata: encipher([1n]),
          pointer: 1,
          refundPointer: 1,
          edicts: [
            { id: new RuneId({ block: 100, tx: 1 }), amount: 1000n, output: 1 },
          ],
        }),
        ProtoStone.message({
          protocolTag: 22n,
          calldata: encipher([2n]),
          pointer: 2,
          refundPointer: 2,
          edicts: [
            { id: new RuneId({ block: 200, tx: 2 }), amount: 2000n, output: 2 },
          ],
        }),
        ProtoStone.message({
          protocolTag: 33n,
          calldata: encipher([3n]),
          pointer: 3,
          refundPointer: 3,
          edicts: [
            { id: new RuneId({ block: 300, tx: 3 }), amount: 3000n, output: 3 },
          ],
        }),
      ],
    })
    const artifact = Runestone.fromOpreturnHex(encodedRunestone.toString('hex'))
    expect(artifact).toBeInstanceOf(Runestone)

    let result: ReturnType<typeof AlkaneUpdater.parse_transfer> | undefined
    expect(() => {
      result = AlkaneUpdater.parse_transfer({
        artifact,
        inputs: [
          {
            index: 0,
            alkanes: [
              { alkaneid: '100:1', amount: '1000' },
              { alkaneid: '200:2', amount: '2000' },
              { alkaneid: '300:3', amount: '3000' },
            ],
          },
        ],
        outputs: [
          { scriptPk: encodedRunestone.toString('hex'), vout: 0 },
          { scriptPk: '00141111111111111111111111111111111111111111', vout: 1 },
          { scriptPk: '00142222222222222222222222222222222222222222', vout: 2 },
          { scriptPk: '00143333333333333333333333333333333333333333', vout: 3 },
        ],
      })
    }).not.toThrow()

    expect(result!.allocated[1]['100:1']).toBe(1000n)
    expect(result!.allocated[2]['200:2']).toBe(2000n)
    expect(result!.allocated[3]['300:3']).toBe(3000n)
    expect(result!.burned).toEqual({})
  })
})

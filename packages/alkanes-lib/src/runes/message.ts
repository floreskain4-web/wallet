import { Edict } from './edict'
import { RuneId } from './rune_id'
import { ProtoTag, Tag } from './tag'
import { bigintToNumber } from './utils'

export class Message {
  flaws: number
  edicts: Edict[]
  field: { [key: string]: bigint[] }

  constructor(flaws: number, edicts: Edict[], fileds: { [key: string]: bigint[] }) {
    this.flaws = flaws
    this.edicts = edicts
    this.field = fileds
  }

  static fromIntegers(payload: bigint[]) {
    const edicts: Edict[] = []
    const fields: { [key: string]: bigint[] } = {}
    const flaws = 0

    for (let i = 0; i < payload.length; i += 2) {
      let tag = bigintToNumber(payload[i])
      if (tag == Tag.Body.value) {
        i++ // skip the tag
        let id = new RuneId({ block: 0, tx: 0 })
        for (;;) {
          const chunk = payload.slice(i, i + 4)
          if (chunk.length !== 4) {
            break
          }

          const block = bigintToNumber(chunk[0])
          const tx = bigintToNumber(chunk[1])
          const amount = chunk[2]
          const output = bigintToNumber(chunk[3])
          const next = id.next(block, tx)
          // TODO: overflow check

          const edict = new Edict({
            id: next,
            amount,
            output,
          })
          id = next
          edicts.push(edict)

          i += 4
        }
      }
      const value = payload[i + 1]
      if (value === undefined) {
        break
      }
      fields[tag] = fields[tag] || []
      fields[tag].push(value)
    }
    return new Message(flaws, edicts, fields)
  }

  static fromProtoIntegers(payload: bigint[]) {
    const edicts: Edict[] = []
    const fields: { [key: string]: bigint[] } = {}
    const flaws = 0

    for (let i = 0; i < payload.length; i += 2) {
      const tag = bigintToNumber(payload[i])
      if (tag == ProtoTag.Body.value) {
        i++ // skip the tag
        let id = new RuneId({ block: 0, tx: 0 })
        for (;;) {
          const chunk = payload.slice(i, i + 4)
          if (chunk.length !== 4) {
            break
          }

          const block = bigintToNumber(chunk[0])
          const tx = bigintToNumber(chunk[1])
          const amount = chunk[2]
          const output = bigintToNumber(chunk[3])
          let next = id.next(block, tx)
          // TODO: overflow check

          let edict = new Edict({
            id: next,
            amount,
            output,
          })
          id = next
          edicts.push(edict)

          i += 4
        }
      }
      let value = payload[i + 1]
      if (value === undefined) {
        break
      }
      fields[tag] = fields[tag] || []
      fields[tag].push(value)
    }
    return new Message(flaws, edicts, fields)
  }
}

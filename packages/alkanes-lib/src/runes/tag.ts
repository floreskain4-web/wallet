import { varint } from './varint'

class RunesTag {
  value: number

  constructor(value: number) {
    this.value = value
  }

  take(fields: { [key: string]: bigint[] }, func?: (val: bigint[]) => any) {
    const field = fields[this.value]
    let value = func ? func(field) : field
    delete fields[this.value]

    return value
    // return set;
  }

  encode(values: any[], payload) {
    for (let i = 0; i < values.length; i++) {
      const value = values[i]
      varint.encodeToVec(this.value, payload)
      varint.encodeToVec(value, payload)
    }
  }

  encode_option(value: any, payload) {
    if (value !== null && value !== undefined) {
      return this.encode([value], payload)
    }
  }
}

export const Tag = {
  Body: new RunesTag(0),
  Flags: new RunesTag(2),
  Rune: new RunesTag(4),
  Premine: new RunesTag(6),
  Cap: new RunesTag(8),
  Amount: new RunesTag(10),
  HeightStart: new RunesTag(12),
  HeightEnd: new RunesTag(14),
  OffsetStart: new RunesTag(16),
  OffsetEnd: new RunesTag(18),
  Mint: new RunesTag(20),
  Pointer: new RunesTag(22),
  Cenotaph: new RunesTag(126),
  Divisibility: new RunesTag(1),
  Spacers: new RunesTag(3),
  Symbol: new RunesTag(5),
  Nop: new RunesTag(127),
  Protocol: new RunesTag(16383),
}

export const ProtoTag = {
  Body: new RunesTag(0),
  Message: new RunesTag(81),
  Burn: new RunesTag(83),
  Pointer: new RunesTag(91),
  Refund: new RunesTag(93),
  From: new RunesTag(95),
  Cenotaph: new RunesTag(126),
  Nop: new RunesTag(127),
}

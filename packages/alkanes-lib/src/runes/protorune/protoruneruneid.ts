import { RuneId } from '../rune_id'

function toSafeNumber(value: bigint, label: string): number {
  if (value < 0n) {
    throw new Error(`${label} must be non-negative`)
  }
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} overflow`)
  }
  return Number(value)
}

export class ProtoruneRuneId {
  block: bigint
  tx: bigint

  constructor(block: bigint, tx: bigint) {
    this.block = BigInt(block)
    this.tx = BigInt(tx)
  }

  static new(block: bigint, tx: bigint): ProtoruneRuneId | undefined {
    const id = new ProtoruneRuneId(block, tx)
    if (id.block === 0n && id.tx > 0n) {
      return undefined
    }
    return id
  }

  static fromRuneId(id: RuneId): ProtoruneRuneId {
    return new ProtoruneRuneId(BigInt(id.block), BigInt(id.tx))
  }

  static sort(runeIds: ProtoruneRuneId[]): ProtoruneRuneId[] {
    return [...runeIds].sort((left, right) => left.compare(right))
  }

  delta(next: ProtoruneRuneId): [bigint, bigint] | undefined {
    const block = next.block - this.block
    if (block < 0n) {
      return undefined
    }

    if (block === 0n) {
      const tx = next.tx - this.tx
      if (tx < 0n) {
        return undefined
      }
      return [block, tx]
    }

    return [block, next.tx]
  }

  next(block: bigint, tx: bigint): ProtoruneRuneId | undefined {
    const blockValue = BigInt(block)
    const txValue = BigInt(tx)
    if (blockValue < 0n || txValue < 0n) {
      return undefined
    }

    const nextBlock = this.block + blockValue
    const nextTx = blockValue === 0n ? this.tx + txValue : txValue
    return ProtoruneRuneId.new(nextBlock, nextTx)
  }

  compare(other: ProtoruneRuneId): number {
    if (this.block > other.block) {
      return 1
    }
    if (this.block < other.block) {
      return -1
    }
    if (this.tx > other.tx) {
      return 1
    }
    if (this.tx < other.tx) {
      return -1
    }
    return 0
  }

  toRuneId(): RuneId {
    return new RuneId({
      block: toSafeNumber(this.block, 'block'),
      tx: toSafeNumber(this.tx, 'tx'),
    })
  }

  toString() {
    return `${this.block}:${this.tx}`
  }

  static fromString(s: string) {
    const parts = s.split(':')
    if (parts.length !== 2) {
      throw new Error(`invalid rune ID: ${s}`)
    }

    const [block, tx] = parts
    if (!/^\d+$/.test(block) || !/^\d+$/.test(tx)) {
      throw new Error(`invalid rune ID: ${s}`)
    }

    return new ProtoruneRuneId(BigInt(block), BigInt(tx))
  }
}

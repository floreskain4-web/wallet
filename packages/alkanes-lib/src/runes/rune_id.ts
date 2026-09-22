export class RuneId {
  block: number
  tx: number

  constructor({ block, tx }: { block: number; tx: number }) {
    this.block = block
    this.tx = tx
  }

  static fromBigInt(n) {
    n = BigInt(n)
    const block = Number(n >> BigInt(16))
    const tx = Number(n & BigInt(0xffff))
    if (block > Number.MAX_SAFE_INTEGER || tx > Number.MAX_SAFE_INTEGER) {
      throw new Error('Integer overflow')
    }
    return new RuneId({ block, tx })
  }

  delta(next: RuneId) {
    let block = next.block - this.block
    let tx = 0
    if (block == 0) {
      tx = next.tx - this.tx
    } else {
      tx = next.tx
    }

    return { block, tx }
  }

  next(block: number, tx: number) {
    if (block == 0) {
      return new RuneId({ block: this.block + block, tx: this.tx + tx })
    } else {
      return new RuneId({ block: this.block + block, tx })
    }
  }

  toBigInt() {
    return (BigInt(this.block) << BigInt(16)) | BigInt(this.tx)
  }

  toInt() {
    return parseInt(this.toBigInt().toString(10))
  }

  toString() {
    return `${this.block}:${this.tx}`
  }

  static fromString(s: string) {
    const [block, tx] = s.split(':').map(Number)
    return new RuneId({ block, tx })
  }

  compare(other: RuneId) {
    if (this.block > other.block) {
      return 1
    } else if (this.block < other.block) {
      return -1
    } else {
      if (this.tx > other.tx) {
        return 1
      } else if (this.tx < other.tx) {
        return -1
      } else {
        return 0
      }
    }
  }

  isDefault() {
    return this.block === 0 && this.tx === 0
  }
}

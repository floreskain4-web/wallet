export class Terms {
  amount: string
  cap: string
  height: number[]
  offset: number[]

  constructor({
    amount,
    cap,
    height,
    offset,
  }: {
    amount: string
    cap: string
    height: number[]
    offset: number[]
  }) {
    this.amount = amount
    this.cap = cap
    this.height = height
    this.offset = offset
  }

  toData() {
    return {
      amount: this.amount.toString(),
      cap: this.cap.toString(),
      heightStart: this.height[0] || 0,
      heightEnd: this.height[1] || 0,
      offsetStart: this.offset[0] || 0,
      offsetEnd: this.offset[1] || 0,
    }
  }
}

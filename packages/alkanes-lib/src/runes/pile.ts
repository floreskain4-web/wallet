export interface Pile {
  amount: number
  divisibility: number
  symbol: string
}

// Format a Pile object as a display string.
export class Display implements Pile {
  amount: number
  divisibility: number // Number of decimal places
  symbol: string

  fmt() {
    let cutoff = Math.pow(10, this.divisibility)
    let whole = Math.floor(this.amount / cutoff)
    let fraction = this.amount % cutoff

    if (fraction === 0) {
      return `${whole} ${this.symbol}`
    } else {
      let width = this.divisibility
      while (fraction % 10 === 0) {
        fraction /= 10
        width--
      }
      return `${whole}.${fraction.toString().padEnd(width, '0')} ${this.symbol}`
    }
  }
}

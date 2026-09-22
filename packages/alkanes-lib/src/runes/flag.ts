export class RunesFlag {
  value: bigint

  constructor(value: bigint) {
    this.value = value || 0n
  }

  mask() {
    return BigInt(1) << BigInt(this.value)
  }

  take(flag: RunesFlag) {
    let mask = this.mask()
    let value = BigInt(flag.value)
    let set = (value & mask) !== BigInt(0)
    value &= ~mask
    flag.value = value
    return set
  }

  set(flag: RunesFlag) {
    flag.value = flag.value | this.mask()
  }
}

export const Flag = {
  Etching: new RunesFlag(0n), // Etching flag
  Terms: new RunesFlag(1n), // Terms flag
  Turbo: new RunesFlag(2n), // Turbo flag
  Cenotaph: new RunesFlag(127n), // Invalid cenotaph marker
}

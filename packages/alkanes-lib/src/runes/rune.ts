import { NetworkType } from '@unisat/wallet-types'
import { bigintToNumber } from './utils'

export const RUNE_STEPS = [
  0n, // 0 A, phase 12, 2028-01 to 2028-05
  26n, // 1 AA, phase 11, 2027-09 to 2028-01
  702n, // 2 AAA, phase 10, 2027-05 to 2027-09
  18278n, // 3 AAAA, phase 9, 2027-01 to 2027-05
  475254n, // 4 AAAAA, phase 8, 2026-09 to 2027-01
  12356630n, // 5 AAAAAA, phase 7, 2026-05 to 2026-09
  321272406n, // 6 AAAAAAA, phase 6, 2026-01 to 2026-05
  8353082582n, // 7 AAAAAAAA, phase 5, 2025-08 to 2025-12
  217180147158n, // 8 AAAAAAAAA, phase 4, 2025-04 to 2025-08
  5646683826134n, // 9 AAAAAAAAAA, phase 3, 2024-12 to 2025-04
  146813779479510n, // 10 AAAAAAAAAAA, phase 2, 2024-08 to 2024-12
  3817158266467286n, // 11 AAAAAAAAAAAA, phase 1, 2024-04 to 2024-08
  99246114928149462n, // 12 AAAAAAAAAAAAA
  2580398988131886038n,
  67090373691429037014n,
  1744349715977154962390n,
  45353092615406029022166n,
  1179180408000556754576342n,
  30658690608014475618984918n,
  797125955808376366093607894n,
  20725274851017785518433805270n,
  538857146126462423479278937046n,
  14010285799288023010461252363222n,
  364267430781488598271992561443798n,
  9470953200318703555071806597538774n,
  246244783208286292431866971536008150n,
  6402364363415443603228541259936211926n, // Reserved 27-character value used for auto-increment when no rune is provided
  166461473448801533683942072758341510102n, // AAAAAAAAAAAAAAAAAAAAAAAAAAAA
]
export const CLAIM_BIT = 281474976710656 // 65536 10000000000000000
const RESERVED = RUNE_STEPS[26] // AAAAAAAAAAAAAAAAAAAAAAAAAAA
export const SUBSIDY_HALVING_INTERVAL = 210000 // Four years
const INTERVAL = SUBSIDY_HALVING_INTERVAL / 12 // Four months
const MAX_DIVISIBILITY = 38
// Rune names are first-come, first-served, but shorter names are reserved.
// Reserved names cannot be duplicated.
// If no rune is provided, increment from the reserved range.
// Names use a base-26 alphabet.

const MAX_LIMIT = 1 << 64 // Limit uses at most 8 bytes

function first_rune_height(networkType: NetworkType) {
  if (networkType === NetworkType.MAINNET) {
    return SUBSIDY_HALVING_INTERVAL * 4
  } else if (networkType === NetworkType.TESTNET) {
    return SUBSIDY_HALVING_INTERVAL * 12
  } else if (networkType === NetworkType.REGTEST) {
    return SUBSIDY_HALVING_INTERVAL * 0
  } else {
    return 0
  }
}

export class Rune {
  value: bigint
  constructor(value: string | bigint | number) {
    this.value = BigInt(value)
  }

  static minimumAtHeight(networkType: NetworkType, height: number) {
    let offset = BigInt(height + 1)
    let start = BigInt(first_rune_height(networkType))
    let end = start + BigInt(SUBSIDY_HALVING_INTERVAL) // First halving window

    if (offset < start) {
      // Before rune activation, only pre-etched long names are valid.
      // The minimum length before activation is AAAAAAAAAAAAA.
      return new Rune(RUNE_STEPS[12])
    }

    if (offset >= end) {
      // After the first halving window, every name length becomes available.
      // In practice, any length is allowed after four years.
      return new Rune(0)
    }

    // During activation, shorter names unlock every four months.

    const progress = offset - start // Blocks elapsed since activation
    const length = bigintToNumber(12n - progress / BigInt(INTERVAL))
    end = RUNE_STEPS[length - 1]
    start = RUNE_STEPS[length]
    let remainder = progress % BigInt(INTERVAL)
    return new Rune(start - ((start - end) * remainder) / BigInt(INTERVAL))
  }

  is_reserved() {
    return BigInt(this.value) >= RESERVED
  }

  reserved(n: number) {
    // return new Rune(RESERVED);
  }

  static fromBigInt(s: string) {
    const rune = new Rune(s)
    return rune
  }

  static fromString(s: string) {
    return Rune.from_str(s)
  }

  toString() {
    let n = this.value
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''

    n = BigInt(n)

    while (n >= 0) {
      const index = Number(n % 26n)
      result = letters[index] + result
      n = n / 26n - 1n
    }
    return result
  }

  static from_str(s: string) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let x = 0n
    for (let i = 0; i < s.length; i++) {
      const c = s[i]
      if (i > 0) {
        x += 1n
      }
      x = x * 26n
      if (letters.indexOf(c) >= 0) {
        x = x + BigInt(c.charCodeAt(0) - 'A'.charCodeAt(0))
      }
    }
    return new Rune(x)
  }

  commitment() {
    let bytes = this.toByteArrayLE()
    let end = bytes.length
    while (end > 0 && bytes[end - 1] === 0) {
      end--
    }
    const v = bytes.slice(0, end)
    return Buffer.from(new Uint8Array(v))
  }

  toByteArrayLE() {
    const result = []
    let temp = this.value
    const bigint_256 = BigInt(256)
    while (temp > 0n) {
      result.push(Number(temp % bigint_256))
      temp /= bigint_256
    }
    return result
  }
}

import { Rune } from './rune'

// Spaced runes render a rune as a string separated by middle dots.
// This improves readability, for example RUNESTONE becomes RUNE•STONE.
export class SpacedRune {
  rune: Rune
  spacers: number

  constructor(rune: Rune, spacers: number) {
    this.rune = rune
    this.spacers = spacers
  }

  static fromString(s: string) {
    let runeString = ''
    let spacers = 0

    for (let i = 0; i < s.length; i++) {
      let c = s[i]
      if (c >= 'A' && c <= 'Z') {
        runeString += c
      } else if (c === '.' || c === '•') {
        let flag = 1 << (runeString.length - 1)

        if ((spacers & flag) !== 0) {
          throw new Error('Double spacer error')
        }
        spacers |= flag
      } else {
        throw new Error(`Invalid character error: ${c}`)
      }
    }

    if (32 - Math.clz32(spacers) >= runeString.length) {
      throw new Error('Trailing spacer error')
    }

    let rune = Rune.fromString(runeString)
    return new SpacedRune(rune, spacers)
  }

  toString() {
    let runeString = this.rune.toString()
    let result = ''
    for (let i = 0; i < runeString.length; i++) {
      result += runeString[i]

      if (i < runeString.length - 1 && this.spacers & (1 << i)) {
        result += '•'
      }
    }

    return result
  }
}

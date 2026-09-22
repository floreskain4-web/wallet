import { Rune } from './rune'
import { SpacedRune } from './spaced_rune'
import { Terms } from './terms'

// Used to deploy a Rune.
// etching block height is the block height where it was deployed
// etching transaction index is the transaction position within that block
// divisibility is the token precision
// mint contains minting metadata
// - mint deadline is the mint cutoff time
// - mint limit is the mint cap
// - mint end is the ending block height
// - mint term is the mint duration
// - mint mints is the number of tokens minted so far
// supply is the total token supply
// burned is the total amount already burned

// SYMBOL must be 26 letters.

export class Etching {
  divisibility?: number
  premine?: string
  rune?: Rune
  spacers?: number
  symbol?: string
  terms?: Terms
  turbo: boolean

  constructor({
    divisibility,
    premine,
    rune,
    spacers,
    symbol,
    terms,
    turbo,
  }: {
    divisibility?: number
    premine?: string
    rune?: Rune
    spacers?: number
    symbol?: string
    terms?: Terms
    turbo?: boolean
  }) {
    this.divisibility = divisibility
    this.premine = premine
    this.rune = rune
    this.spacers = spacers
    // Keep the symbol as the incoming char-code value and decode it in toData().
    this.symbol = symbol
    this.terms = terms
    this.turbo = turbo
  }

  toData() {
    return {
      divisibility: this.divisibility,
      premine: this.premine.toString(),
      spaced_rune: new SpacedRune(this.rune, this.spacers).toString(),
      symbol: this.symbol ? String.fromCodePoint(parseInt(this.symbol)) : '',
      terms: this.terms ? this.terms.toData() : null,
      turbo: this.turbo,
    }
  }

  supply() {
    let premine = this.premine ? BigInt(this.premine) : 0n
    let cap = this.terms && this.terms.cap ? BigInt(this.terms.cap) : 0n
    let amount = this.terms && this.terms.amount ? BigInt(this.terms.amount) : 0n
    return premine + cap * amount
  }
}

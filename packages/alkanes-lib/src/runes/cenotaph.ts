import { Protocol } from './protocol'
import { Rune } from './rune'
import { RuneId } from './rune_id'

export class Cenotaph {
  type = 'Cenotaph'
  etching: Rune
  flaws: number
  mint: RuneId
  protocols?: Protocol[]

  constructor({
    etching,
    flaws,
    mint,
    protocols,
  }: {
    etching: Rune
    flaws: number
    mint: RuneId
    protocols?: Protocol[]
  }) {
    this.etching = etching
    this.flaws = flaws
    this.mint = mint
    this.protocols = protocols
  }

  getFlaws() {
    return this.flaws
  }
}

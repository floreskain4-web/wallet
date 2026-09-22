import { RuneId } from './rune_id'

// Basic Runes unit describing a token amount and target output.
export class Edict {
  id: RuneId
  amount: bigint
  output: number

  constructor({ id, amount, output }: { id: RuneId; amount: bigint; output: number }) {
    this.id = id
    this.amount = amount
    this.output = output
  }
}

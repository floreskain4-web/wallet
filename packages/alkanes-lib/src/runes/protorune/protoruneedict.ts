import { Edict } from '../edict'
import { toBigInt, toNumber, toProtoruneRuneId, toRuneId } from './compat'
import { ProtoruneRuneId } from './protoruneruneid'

export interface ProtoruneEdict {
  id: ProtoruneRuneId
  amount: bigint
  output: number
}

export namespace ProtoruneEdict {
  export function fromIntegers(
    numOutputs: number,
    id: ProtoruneRuneId,
    amount: bigint,
    output: bigint,
  ): ProtoruneEdict | undefined {
    if (id.block === 0n && id.tx > 0n) {
      return undefined
    }

    const outputU32 = toNumber(output, 'output', 0xffffffffn)
    if (outputU32 > numOutputs) {
      return undefined
    }

    return {
      id,
      amount: toBigInt(amount, 'amount'),
      output: outputU32,
    }
  }

  export function fromEdict(edict: Edict): ProtoruneEdict {
    return {
      id: toProtoruneRuneId(edict.id),
      amount: toBigInt(edict.amount, 'amount'),
      output: edict.output,
    }
  }

  export function toEdict(edict: ProtoruneEdict): Edict {
    return new Edict({
      id: toRuneId(edict.id),
      amount: toBigInt(edict.amount, 'amount'),
      output: edict.output,
    })
  }
}

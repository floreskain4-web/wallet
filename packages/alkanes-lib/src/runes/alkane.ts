import { Edict } from './edict'

export class ProtocolData {
  pointer?: number
  refund?: string
  calldata?: bigint[]
  edicts?: Edict[]

  constructor({
    pointer,
    refund,
    calldata,
    edicts,
  }: {
    pointer?: number
    refund?: string
    calldata?: bigint[]
    edicts?: Edict[]
  }) {
    this.pointer = pointer
    this.refund = refund
    this.calldata = calldata
    this.edicts = edicts
  }
}

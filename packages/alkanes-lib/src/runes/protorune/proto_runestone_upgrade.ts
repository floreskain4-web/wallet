import type { EtchingSpec } from '../encode'
import { encodeRunestoneProtostone } from '../encode'
import { ProtoStone } from '../protostone'
import type { CompatibleEdictLike, CompatibleRuneIdLike } from './compat'

export class RunestoneProtostoneUpgrade {
  mint?: CompatibleRuneIdLike
  pointer?: number
  edicts: CompatibleEdictLike[]
  etching?: EtchingSpec
  protostones: ProtoStone[]

  constructor(
    mint?: CompatibleRuneIdLike,
    pointer?: number,
    edicts: CompatibleEdictLike[] = [],
    etching?: EtchingSpec,
    protostones: ProtoStone[] = [],
  ) {
    this.mint = mint
    this.pointer = pointer
    this.edicts = edicts
    this.etching = etching
    this.protostones = protostones
  }

  encipher(): Buffer {
    return encodeRunestoneProtostone({
      mint: this.mint,
      pointer: this.pointer,
      edicts: this.edicts,
      etching: this.etching,
      protostones: this.protostones,
    }).encodedRunestone
  }
}

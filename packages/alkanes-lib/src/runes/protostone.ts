import { unpack } from '../bytes'
import { appendDeltaEncodedEdicts, type CompatibleEdictLike } from './protorune/compat'
import { ProtoTag } from './tag'

export type ProtoBurn = {
  pointer: number
  from?: number[]
}

export type ProtoMessage = {
  /**
   * Raw calldata bytes. For Alkanes this should be encipher(bigint[]) —
   * a varint-encoded sequence of u128 arguments (e.g. function selector + args).
   */
  calldata: Buffer
  pointer: number
  refundPointer: number
}

/**
 * A single Protostone: one protocol's sub-payload embedded inside a Runestone
 * via Tag.Protocol (tag 16383).
 *
 * Wire format produced by encipher_payloads():
 *   [ protocolTag, payloadLength, ...fields, ...edicts ]
 *
 * The combined bigint[] of all protostones is varint-encoded, then chunked
 * into 15-byte LE bigints and stored as repeated Tag.Protocol values in the
 * outer Runestone.
 */
export class ProtoStone {
  protocolTag: bigint
  burn?: ProtoBurn
  message?: ProtoMessage
  edicts?: CompatibleEdictLike[]

  constructor({
    protocolTag,
    burn,
    message,
    edicts,
  }: {
    protocolTag: bigint
    burn?: ProtoBurn
    message?: ProtoMessage
    edicts?: CompatibleEdictLike[]
  }) {
    this.protocolTag = protocolTag
    this.burn = burn
    this.message = message
    this.edicts = edicts
  }

  /**
   * Returns the bigint[] payload for this protostone, prepended with
   * [protocolTag, payloadLength] as required by the spec.
   */
  encipher_payloads(): bigint[] {
    const payloads: bigint[] = []

    if (this.burn) {
      payloads.push(BigInt(ProtoTag.Pointer.value))
      payloads.push(BigInt(this.burn.pointer))
      if (this.burn.from && this.burn.from.length > 0) {
        payloads.push(BigInt(ProtoTag.From.value))
        payloads.push(BigInt(this.burn.from[0]))
      }
    } else if (this.message) {
      payloads.push(BigInt(ProtoTag.Pointer.value))
      payloads.push(BigInt(this.message.pointer))
      payloads.push(BigInt(ProtoTag.Refund.value))
      payloads.push(BigInt(this.message.refundPointer))
      if (this.message.calldata.length > 0) {
        unpack(this.message.calldata).forEach(chunk => {
          payloads.push(BigInt(ProtoTag.Message.value))
          payloads.push(chunk)
        })
      }
    }

    if (this.edicts && this.edicts.length > 0) {
      payloads.push(BigInt(ProtoTag.Body.value))
      appendDeltaEncodedEdicts(payloads, this.edicts)
    }

    // Prepend [protocolTag, payloadLength] as per spec
    payloads.unshift(BigInt(payloads.length))
    payloads.unshift(this.protocolTag)
    return payloads
  }

  static burn(opts: {
    protocolTag: bigint
    pointer: number
    from?: number[]
    edicts?: CompatibleEdictLike[]
  }): ProtoStone {
    const { protocolTag, pointer, from, edicts } = opts
    return new ProtoStone({ protocolTag, burn: { pointer, from }, edicts })
  }

  static message(opts: {
    protocolTag: bigint
    calldata: Buffer
    pointer: number
    refundPointer: number
    edicts?: CompatibleEdictLike[]
  }): ProtoStone {
    const { protocolTag, calldata, pointer, refundPointer, edicts } = opts
    return new ProtoStone({ protocolTag, message: { calldata, pointer, refundPointer }, edicts })
  }

  static edicts(opts: { protocolTag: bigint; edicts?: CompatibleEdictLike[] }): ProtoStone {
    return new ProtoStone({ protocolTag: opts.protocolTag, edicts: opts.edicts })
  }
}

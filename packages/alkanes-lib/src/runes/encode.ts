import { bitcoin } from '@unisat/wallet-bitcoin'
import { encipher, unpack } from '../bytes'
import { ProtoStone } from './protostone'
import {
  appendDeltaEncodedEdicts,
  normalizeRuneIdLike,
  type CompatibleEdictLike,
  type CompatibleRuneIdLike,
} from './protorune/compat'
import { Rune } from './rune'
import { SpacedRune } from './spaced_rune'
import { Tag } from './tag'

const MAX_SCRIPT_ELEMENT_SIZE = 520

export type EtchingTermsSpec = {
  amount?: bigint
  cap?: bigint
  height?: { start?: bigint; end?: bigint }
  offset?: { start?: bigint; end?: bigint }
}

export type EtchingSpec = {
  /** Spaced rune name, e.g. "RUNE•STONE". Required to commit to a rune name. */
  runeName?: string
  symbol?: string
  divisibility?: number
  premine?: bigint
  terms?: EtchingTermsSpec
  turbo?: boolean
}

export type RunestoneProtostoneSpec = {
  mint?: CompatibleRuneIdLike
  pointer?: number
  etching?: EtchingSpec
  edicts?: CompatibleEdictLike[]
  protostones?: ProtoStone[]
}

/**
 * Encodes a Runestone with embedded Protostone(s) into a full OP_RETURN script buffer.
 *
 * Returns:
 *   - encodedRunestone: Buffer — use as the scriptPubKey of one transaction output
 *   - etchingCommitment?: Buffer — if etching a named rune, include this as the
 *     annex/commitment leaf in the preceding commit transaction
 *
 * Protostone wire format:
 *   All protostones' encipher_payloads() are concatenated as bigint[],
 *   varint-encoded into a Buffer, chunked into 15-byte LE bigints,
 *   and stored as repeated Tag.Protocol (16383) values in the outer Runestone.
 */
export function encodeRunestoneProtostone(spec: RunestoneProtostoneSpec): {
  encodedRunestone: Buffer
  etchingCommitment?: Buffer
} {
  const payload: bigint[] = []
  let etchingCommitment: Buffer | undefined

  // Etching
  if (spec.etching) {
    const e = spec.etching

    let flags = 0n
    flags |= 1n // Flag.Etching (bit 0)
    if (e.terms) flags |= 2n // Flag.Terms (bit 1)
    if (e.turbo) flags |= 4n // Flag.Turbo (bit 2)

    payload.push(BigInt(Tag.Flags.value), flags)

    let spacedRune: SpacedRune | undefined
    if (e.runeName) {
      spacedRune = SpacedRune.fromString(e.runeName)
      const rune = spacedRune.rune
      payload.push(BigInt(Tag.Rune.value), rune.value)
      etchingCommitment = rune.commitment()
    }

    if (e.divisibility !== undefined) {
      payload.push(BigInt(Tag.Divisibility.value), BigInt(e.divisibility))
    }

    if (spacedRune && spacedRune.spacers !== 0) {
      payload.push(BigInt(Tag.Spacers.value), BigInt(spacedRune.spacers))
    }

    if (e.symbol) {
      const cp = e.symbol.codePointAt(0)
      if (cp === undefined) throw new Error('Invalid symbol')
      payload.push(BigInt(Tag.Symbol.value), BigInt(cp))
    }

    if (e.premine !== undefined) {
      payload.push(BigInt(Tag.Premine.value), e.premine)
    }

    if (e.terms) {
      const t = e.terms
      if (t.amount !== undefined) payload.push(BigInt(Tag.Amount.value), t.amount)
      if (t.cap !== undefined) payload.push(BigInt(Tag.Cap.value), t.cap)
      if (t.height?.start !== undefined) payload.push(BigInt(Tag.HeightStart.value), t.height.start)
      if (t.height?.end !== undefined) payload.push(BigInt(Tag.HeightEnd.value), t.height.end)
      if (t.offset?.start !== undefined) payload.push(BigInt(Tag.OffsetStart.value), t.offset.start)
      if (t.offset?.end !== undefined) payload.push(BigInt(Tag.OffsetEnd.value), t.offset.end)
    }
  }

  // Mint
  if (spec.mint) {
    const mint = normalizeRuneIdLike(spec.mint)
    payload.push(BigInt(Tag.Mint.value), mint.block)
    payload.push(BigInt(Tag.Mint.value), mint.tx)
  }

  // Pointer
  if (spec.pointer !== undefined) {
    payload.push(BigInt(Tag.Pointer.value), BigInt(spec.pointer))
  }

  // Protostones → Tag.Protocol (16383)
  const protostones = spec.protostones ?? []
  if (protostones.length > 0) {
    const allPayloads: bigint[] = []
    for (const ps of protostones) {
      for (const v of ps.encipher_payloads()) {
        allPayloads.push(v)
      }
    }
    const encoded = encipher(allPayloads)
    for (const chunk of unpack(encoded)) {
      payload.push(BigInt(Tag.Protocol.value), chunk)
    }
  }

  // Edicts (outer runestone edicts, not protostone edicts)
  const edicts = spec.edicts ?? []
  if (edicts.length > 0) {
    payload.push(BigInt(Tag.Body.value))
    appendDeltaEncodedEdicts(payload, edicts)
  }

  // Compile to OP_RETURN script
  const payloadBytes = encipher(payload)
  const stack: (Buffer | number)[] = [bitcoin.opcodes['OP_RETURN'], bitcoin.opcodes['OP_13']]
  for (let i = 0; i < payloadBytes.length; i += MAX_SCRIPT_ELEMENT_SIZE) {
    stack.push(payloadBytes.slice(i, i + MAX_SCRIPT_ELEMENT_SIZE))
  }

  return {
    encodedRunestone: bitcoin.script.compile(stack),
    etchingCommitment,
  }
}

/**
 * Convenience: encode a Rune name string into the Rune commitment buffer
 * needed for the commit transaction tapscript leaf.
 */
export function runeCommitment(runeName: string): Buffer {
  return Rune.fromString(runeName.replace(/[•.]/g, '')).commitment()
}

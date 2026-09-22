import { Edict } from '../edict'
import { RuneId } from '../rune_id'
import { ProtoruneRuneId } from './protoruneruneid'

export type CompatibleRuneIdLike =
  | RuneId
  | ProtoruneRuneId
  | {
      block: number | bigint
      tx: number | bigint
    }

export type CompatibleEdictLike =
  | Edict
  | {
      id: CompatibleRuneIdLike
      amount: number | bigint
      output: number | bigint
    }

export type NormalizedRuneId = {
  block: bigint
  tx: bigint
}

export type NormalizedEdict = {
  id: NormalizedRuneId
  amount: bigint
  output: number
}

const MAX_U32 = 0xffffffffn

function assertInteger(value: number, label: string) {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`)
  }
}

export function toBigInt(value: number | bigint, label: string): bigint {
  if (typeof value === 'bigint') {
    return value
  }

  assertInteger(value, label)
  return BigInt(value)
}

export function toNumber(
  value: number | bigint,
  label: string,
  max: bigint = BigInt(Number.MAX_SAFE_INTEGER),
): number {
  const normalized = toBigInt(value, label)
  if (normalized < 0n) {
    throw new Error(`${label} must be non-negative`)
  }
  if (normalized > max) {
    throw new Error(`${label} overflow`)
  }
  return Number(normalized)
}

export function normalizeRuneIdLike(id: CompatibleRuneIdLike): NormalizedRuneId {
  if (id instanceof RuneId) {
    return {
      block: BigInt(id.block),
      tx: BigInt(id.tx),
    }
  }

  if (id instanceof ProtoruneRuneId) {
    return {
      block: id.block,
      tx: id.tx,
    }
  }

  return {
    block: toBigInt(id.block, 'block'),
    tx: toBigInt(id.tx, 'tx'),
  }
}

export function compareRuneIds(left: NormalizedRuneId, right: NormalizedRuneId): number {
  if (left.block > right.block) {
    return 1
  }
  if (left.block < right.block) {
    return -1
  }
  if (left.tx > right.tx) {
    return 1
  }
  if (left.tx < right.tx) {
    return -1
  }
  return 0
}

export function deltaRuneIds(
  previous: NormalizedRuneId,
  next: NormalizedRuneId,
): NormalizedRuneId | undefined {
  const block = next.block - previous.block
  if (block < 0n) {
    return undefined
  }

  if (block === 0n) {
    const tx = next.tx - previous.tx
    if (tx < 0n) {
      return undefined
    }
    return { block, tx }
  }

  return {
    block,
    tx: next.tx,
  }
}

export function normalizeEdictLike(edict: CompatibleEdictLike): NormalizedEdict {
  return {
    id: normalizeRuneIdLike(edict.id),
    amount: toBigInt(edict.amount, 'amount'),
    output: toNumber(edict.output, 'output', MAX_U32),
  }
}

export function normalizeEdictLikes(edicts: CompatibleEdictLike[]): NormalizedEdict[] {
  return edicts.map(normalizeEdictLike)
}

export function appendDeltaEncodedEdicts(payloads: bigint[], edicts: CompatibleEdictLike[]) {
  const sorted = normalizeEdictLikes(edicts).sort((left, right) => compareRuneIds(left.id, right.id))
  let previous: NormalizedRuneId = { block: 0n, tx: 0n }

  for (const edict of sorted) {
    const delta = deltaRuneIds(previous, edict.id)
    if (!delta) {
      throw new Error('Edicts must be sorted in ascending rune id order')
    }

    payloads.push(delta.block)
    payloads.push(delta.tx)
    payloads.push(edict.amount)
    payloads.push(BigInt(edict.output))
    previous = edict.id
  }
}

export function toRuneId(id: CompatibleRuneIdLike): RuneId {
  const normalized = normalizeRuneIdLike(id)
  return new RuneId({
    block: toNumber(normalized.block, 'block'),
    tx: toNumber(normalized.tx, 'tx'),
  })
}

export function toProtoruneRuneId(id: CompatibleRuneIdLike): ProtoruneRuneId {
  const normalized = normalizeRuneIdLike(id)
  return new ProtoruneRuneId(normalized.block, normalized.tx)
}

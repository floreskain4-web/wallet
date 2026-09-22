import { SeekBuffer } from './seekbuffer'

export function leftPadByte(v: string): string {
  return v.length % 2 ? '0' + v : v
}

export function encodeVarInt(value: bigint): Buffer {
  const out: number[] = []

  while (value >> 7n > 0n) {
    out.push(Number(value & 0xffn) | 0b1000_0000)
    value >>= 7n
  }
  out.push(Number(value & 0xffn))

  return Buffer.from(out)
}

export function encipher(values: readonly bigint[]): Buffer {
  return Buffer.concat(values.map(v => encodeVarInt(v)))
}

export function decipher(values: Buffer): bigint[] {
  const seekBuffer = new SeekBuffer(values)
  const result: bigint[] = []

  let v: bigint
  while ((v = decodeVarInt(seekBuffer)) !== -1n) {
    result.push(v)
  }

  return result
}

export function decodeVarInt(seekBuffer: SeekBuffer): bigint {
  try {
    return tryDecodeVarInt(seekBuffer)
  } catch {
    return -1n
  }
}

/**
 * Inverse of pack() in runestone.ts.
 * Splits a Buffer into 15-byte little-endian chunks and returns each as a bigint.
 * Used to prepare calldata / protostone payloads for storage in Runestone tag fields.
 */
export function unpack(buf: Buffer): bigint[] {
  const result: bigint[] = []
  for (let i = 0; i < buf.length; i += 15) {
    const chunk = Array.from(buf.slice(i, i + 15))
    const hex = Buffer.from(chunk.reverse()).toString('hex')
    result.push(BigInt('0x' + hex))
  }
  return result
}

export function tryDecodeVarInt(seekBuffer: SeekBuffer): bigint {
  let result = 0n

  for (let i = 0; i <= 18; i++) {
    const byte = seekBuffer.readUInt8()
    if (byte === undefined) {
      throw new Error('Unterminated')
    }

    const value = BigInt(byte) & 0b0111_1111n

    if (i === 18 && (value & 0b0111_1100n) !== 0n) {
      throw new Error('Overflow')
    }

    result = result | (value << BigInt(7 * i))

    if ((byte & 0b1000_0000) === 0) {
      return result
    }
  }

  throw new Error('Overlong')
}

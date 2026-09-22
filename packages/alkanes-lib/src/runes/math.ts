type UIntType = 'u32' | 'u64' | 'u128'

function checked_add(a: bigint, b: bigint, c: UIntType): bigint | null {
  const result = a + b
  let max = 0n
  if (c == 'u32') {
    max = BigInt(2n ** 32n - 1n)
  } else if (c == 'u64') {
    max = BigInt(2n ** 64n - 1n)
  } else {
    max = BigInt(2n ** 128n - 1n)
  }
  return result > max ? null : result
}

function checked_sub(a: bigint, b: bigint, c: UIntType): bigint | null {
  const result = a - b
  if (result < 0n) {
    return null
  }
  let max = 0n
  if (c == 'u32') {
    max = BigInt(2n ** 32n - 1n)
  } else if (c == 'u64') {
    max = BigInt(2n ** 64n - 1n)
  } else {
    max = BigInt(2n ** 128n - 1n)
  }
  return result > max ? null : result
}

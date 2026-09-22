function decode(buffer) {
  const ret = try_decode(buffer)
  return { num: ret[0], index: ret[1] }
}

function try_decode(buf) {
  let n = BigInt(0)
  let m = BigInt(1)

  for (let i = 0; ; i++) {
    if (i >= buf.length) {
      throw new Error('Buffer too short')
    }

    let byte = BigInt(buf.readUInt8(i))
    n += (byte & BigInt(0x7f)) * m

    if ((byte & BigInt(0x80)) === BigInt(0)) {
      return [n, i + 1]
    }

    m <<= BigInt(7)
  }
}

// export function encodeToVec(_n, v) {
//   let n = BigInt(_n);
//   let out = new Array(19).fill(0);
//   let i = 18;

//   out[i] = Number(n & BigInt(0x7f));

//   while (n > BigInt(0x7f)) {
//     n = n / BigInt(128) - BigInt(1);
//     i -= 1;
//     out[i] = Number((n & BigInt(0x7f)) | BigInt(0x80));
//   }

//   v.push(...out.slice(i));
// }
function encodeToVec_wrong_function(n, v) {
  const bigint_128 = BigInt(128)
  n = BigInt(n)
  while (n > bigint_128) {
    v.push(Number((n & BigInt(0b01111111)) | BigInt(0b10000000)))
    n = n / bigint_128
  }
  v.push(Number(n))
}

function encodeToVec(n, v) {
  n = BigInt(n)
  while (n >> BigInt(7) > 0) {
    v.push(Number((n & BigInt(0b01111111)) | BigInt(0b10000000)))
    n = n >> BigInt(7)
  }
  v.push(Number(n))
}

function encode(n) {
  let v = []
  encodeToVec(n, v)
  return Buffer.from(new Uint8Array(v))
}

function encodeWrong(n) {
  let v = []
  encodeToVec_wrong_function(n, v)
  return Buffer.from(new Uint8Array(v))
}

export const varint = {
  encode,
  decode,
  try_decode,
  encodeToVec,
  encodeWrong,
}

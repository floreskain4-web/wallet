export function bigintToNumber(n: bigint) {
  return parseInt(n as any)
}

export const encodeSymbol = function (symbol: string) {
  return symbol.codePointAt(0)
}

export const decodeSymbol = function (encodedSymbol: number) {
  return String.fromCodePoint(encodedSymbol)
}

export function isValidSymbol(symbol) {
  return Array.from(symbol).length === 1
}

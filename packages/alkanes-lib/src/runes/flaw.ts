// Reasons a runestone becomes a cenotaph.
export enum Flaw {
  EdictOutput = 0b01,
  EdictRuneId = 0b10,
  InvalidScript = 0b0100,
  Opcode = 0b1000,
  SupplyOverflow = 0b010000,
  TrailingIntegers = 0b100000,
  TruncatedField = 0b01000000,
  UnrecognizedEvenTag = 0b10000000,
  UnrecognizedFlag = 0b0100000000,
  Varint = 0b1000000000,
}

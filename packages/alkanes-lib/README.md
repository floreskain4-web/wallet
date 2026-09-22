# @unisat/alkanes-lib

`@unisat/alkanes-lib` is a minimal TypeScript library for Alkanes protocol utilities, focused on Runes/Runestone encoding and decoding. It is a subset of the original `alkanes` project, extracted for use across UniSat projects.

## Install

```bash
pnpm add @unisat/alkanes-lib
```

## Commands

```bash
# Build (outputs CJS + ESM + types to lib/)
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check without emitting
pnpm typecheck

# Lint
pnpm lint

# Clean output
pnpm clean
```

Build tool is `tsup` (wraps esbuild). Output goes to `lib/` with both `index.js` (CJS) and `index.mjs` (ESM) plus `index.d.ts`.

## Protorune Compatibility

`alkanes-lib` now includes a local `protorune` compatibility layer for the upstream Alkanes encoder flow, without depending on `@magiceden-oss/runestone-lib`.

```ts
import {
  ProtoStone,
  ProtoruneRuneId,
  RunestoneProtostoneUpgrade,
  encodeRunestoneProtostone,
} from '@unisat/alkanes-lib'

const mint = new ProtoruneRuneId(840000n, 1n)
const protostone = ProtoStone.message({
  protocolTag: 1n,
  calldata: Buffer.from('01', 'hex'),
  pointer: 2,
  refundPointer: 1,
})

const script = encodeRunestoneProtostone({
  mint,
  pointer: 3,
  protostones: [protostone],
}).encodedRunestone

const sameScript = new RunestoneProtostoneUpgrade(mint, 3, [], undefined, [protostone]).encipher()
```

Supported compatibility names in this layer are:

- `ProtoruneRuneId`
- `ProtoruneEdict`
- `RunestoneProtostoneUpgrade`
- existing `ProtoStone` and `encodeRunestoneProtostone`

## Architecture

### Entry Points

- `src/index.ts` — re-exports everything from `./bytes` and `./runes`
- `src/bytes.ts` — low-level varint encode/decode primitives using `SeekBuffer`
- `src/seekbuffer.ts` — cursor-based buffer reader used by `bytes.ts`
- `src/runes/` — all Runes/Runestone domain types

### Core Abstractions (`src/runes/`)

| File           | Purpose                                                                       |
| -------------- | ----------------------------------------------------------------------------- |
| `runestone.ts` | Main `Runestone` class — encipher/decipher Runes OP_RETURN scripts            |
| `tag.ts`       | `Tag` and `ProtoTag` enums with encode/take helpers                           |
| `message.ts`   | Parses integer arrays into field maps and edicts                              |
| `varint.ts`    | JS varint codec (`encode`, `decode`, `encodeToVec`) — plain JS, no TypeScript |
| `alkane.ts`    | `ProtocolData` — Alkanes-specific payload (pointer, refund, calldata, edicts) |
| `protocol.ts`  | `Protocol` — wraps a protocolTag + ProtocolData                               |
| `edict.ts`     | `Edict` — transfer instruction (id, amount, output)                           |
| `etching.ts`   | `Etching` — rune creation parameters                                          |
| `rune_id.ts`   | `RuneId` — (block, tx) identifier with delta encoding                         |
| `cenotaph.ts`  | `Cenotaph` — flawed runestone result                                          |
| `flag.ts`      | `Flag` and `RunesFlag` — bitmask flag management                              |
| `flaw.ts`      | `Flaw` — error bitmask constants                                              |

### Key Data Flow

**Decoding (OP_RETURN to structured data):**

```hex script
payloadFromScript() -> strip OP_RETURN + magic byte 0x5d -> decipherBufferPayload()
integers() -> varint.decode loop -> bigint[]
Message.fromIntegers() -> field map + edicts
Tag.X.take() -> extract typed fields -> Runestone | Cenotaph
```

**Encoding (structured data to OP_RETURN payload):**

```text
Runestone.encipher() -> Tag.X.encode() -> push tag/value pairs as varints
varint.encodeToVec() -> LEB128 bigint encoding -> payload hex (without OP_RETURN prefix)
```

### Alkanes (Protocol Extension)

Alkanes extends Runes via `Tag.Protocol` (tag `16383`). The protocol field packs a list of sub-protocols, each with:

- `protocolTag` (`bigint`)
- `ProtocolData`: `pointer`, `refund`, `calldata` (`bigint[]`), `edicts`

The `pack()` function in `runestone.ts` converts bigint arrays to 15-byte little-endian chunks before deciphering.

### Varint Note

`src/runes/varint.ts` is plain JavaScript (not TypeScript). It exports an `encodeWrong` function that is kept for reference but should not be used. The correct encoder is `encodeToVec`.

## Dependencies

- `@unisat/wallet-bitcoin` provides `bitcoin` (the bitcoinjs-lib wrapper) used in `Runestone.payload()` and script parsing.

- `@unisat/wallet-types` provides shared types.

## Testing

Uses Vitest. Tests live in `test/`. Run a single test file:

```bash
pnpm vitest run test/runes/runestone.test.ts
```

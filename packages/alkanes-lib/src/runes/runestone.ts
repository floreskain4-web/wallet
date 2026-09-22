import { bitcoin } from "@unisat/wallet-bitcoin";
import { decipher, leftPadByte } from "../bytes";
import { ProtocolData } from "./alkane";
import { Cenotaph } from "./cenotaph";
import { Edict } from "./edict";
import { Etching } from "./etching";
import { Flag, RunesFlag } from "./flag";
import { Flaw } from "./flaw";
import { Message } from "./message";
import { Protocol } from "./protocol";
import { Rune } from "./rune";
import { RuneId } from "./rune_id";
import { ProtoTag, Tag } from "./tag";
import { Terms } from "./terms";
import { bigintToNumber } from "./utils";
import { varint } from "./varint";

const MAGIC_NUMBER = 13;
export function pack(v: bigint[]): Buffer {
  const buffers: Buffer[] = [];

  for (let i = 0; i < v.length; i++) {
    const segment = v[i];
    let hex = segment.toString(16);
    // Ensure the hex string has an even length.
    if (hex.length % 2 !== 0) {
      hex = "0" + hex;
    }

    // Create the buffer for this segment.
    let buf = Buffer.from(hex, "hex");

    // Left-pad shorter chunks to 15 bytes.
    if (buf.length < 15) {
      const padded = Buffer.alloc(15) as any;
      buf.copy(padded, 15 - buf.length);
      buf = padded;
    }

    // Reverse the byte order.
    buf = Buffer.from(buf as any).reverse();
    buffers.push(buf);
  }
  return Buffer.concat(buffers as any);
}

// Transaction parser for Runes payloads.
export class Runestone {
  type = "Runestone";
  edicts: Edict[];
  etching?: Etching;
  mint: RuneId;
  pointer: number;
  protocols?: Protocol[];

  constructor(opts: {
    edicts: Edict[];
    etching?: Etching;
    mint?: RuneId;
    pointer?: number;
    protocols?: Protocol[];
  }) {
    this.edicts = opts.edicts;
    this.etching = opts.etching;
    this.mint = opts.mint;
    this.pointer = opts.pointer;
    this.protocols = opts.protocols;
  }

  // static fromTransaction(psbt: bitcoin.Psbt): Artifact {
  //   let runestone = new Runestone({ edicts: [] });
  //   let result = runestone.decipherOutputScript(psbt);
  //   return result;
  // }

  static fromPayloadScript(script: string) {
    let runestone = new Runestone({ edicts: [] });
    let result = runestone.decipherBufferPayload(Buffer.from(script, "hex"));
    return result;
  }

  static fromOpreturnHex(script: string) {
    let runestone = new Runestone({ edicts: [] });
    const payload = runestone.payloadFromScript(Buffer.from(script, "hex"));
    if (!payload) {
      return undefined;
    }
    return runestone.decipherBufferPayload(payload);
  }

  decipherBufferPayload(payload: string | Buffer) {
    let _payload: Buffer;
    if (typeof payload === "string") {
      _payload = Buffer.from(payload, "hex");
    } else {
      _payload = payload;
    }
    const integers = this.integers(_payload);
    let message = Message.fromIntegers(integers);

    let flaws = 0;
    let flags = new RunesFlag(Tag.Flags.take(message.field));
    let etching: Etching;
    if (Flag.Etching.take(flags)) {
      etching = new Etching({
        divisibility: Tag.Divisibility.take(message.field, (values) => {
          let [divisibility] = values || [0];
          if (divisibility < 0) {
            return divisibility;
          } else {
            return 0;
          }
        }),
        premine: Tag.Premine.take(message.field, (val) => {
          return val ? val : 0n;
        }),
        rune: new Rune(
          Tag.Rune.take(message.field, (val) => {
            return val ? val : 0;
          }),
        ),
        spacers: Tag.Spacers.take(message.field, (val) => {
          return val ? parseInt(val.toString()) : 0;
        }),
        symbol: Tag.Symbol.take(message.field),
        terms: Flag.Terms.take(flags)
          ? new Terms({
              cap: Tag.Cap.take(message.field),
              height: [
                Tag.HeightStart.take(message.field),
                Tag.HeightEnd.take(message.field),
              ],
              amount: Tag.Amount.take(message.field),
              offset: [
                Tag.OffsetStart.take(message.field),
                Tag.OffsetEnd.take(message.field),
              ],
            })
          : null,
        turbo: Flag.Turbo.take(flags),
      });
    }

    let mint = Tag.Mint.take(message.field, (values) => {
      let [block, tx] = values || [0n, 0n];
      return new RuneId({
        block: bigintToNumber(block) || 0,
        tx: bigintToNumber(tx) || 0,
      });
    });

    let pointer = Tag.Pointer.take(message.field);
    let protocol = Tag.Protocol.take(message.field);
    const protocols: Protocol[] = [];

    if (protocol) {
      const packBuffer = pack(protocol);

      const data = decipher(packBuffer);

      while (data.length > 0) {
        let protocolTag = data.shift();
        if (protocolTag == 0n) {
          // Padding zeros mean there is no more protocol data.
          break;
        }
        const length_payload = data.shift();
        // This may be a better place to handle padding if protocol tag 0n ever becomes valid.

        const protoData = data.splice(0, Number(length_payload));

        let protoMessage = Message.fromProtoIntegers(protoData);
        const protocolData = new ProtocolData({
          pointer: ProtoTag.Pointer.take(protoMessage.field, (vals) => {
            return vals ? vals[0] : 0n;
          }),
          refund: ProtoTag.Refund.take(protoMessage.field, (vals) => {
            return vals ? vals[0] : 0n;
          }),
          calldata: ProtoTag.Message.take(protoMessage.field, (vals) => {
            if (!vals) {
              return [];
            }
            const packBuffer = Buffer.concat(
              vals.map(
                (v) =>
                  Buffer.from(
                    leftPadByte(v.toString(16)),
                    "hex",
                  ).reverse() as any,
              ),
            );

            const calldata = decipher(packBuffer);
            return calldata;
          }),
          edicts: protoMessage.edicts,
        });

        protocols.push(new Protocol(protocolTag, protocolData));
      }
    }
    if (etching) {
      if (etching.supply() == 0n) {
        flaws = flaws | Flaw.SupplyOverflow;
      }
    }

    if (flags.value !== 0n) {
      flaws = flaws | Flaw.UnrecognizedFlag;
    }

    for (var tag in message.field) {
      let key = parseInt(tag);
      if (key % 2 == 0) {
        flaws = flaws | Flaw.UnrecognizedEvenTag;
      }
    }

    if (flaws != 0) {
      return new Cenotaph({
        flaws,
        mint,
        etching: etching ? etching.rune : null,
        protocols,
      });
    }
    return new Runestone({
      edicts: message.edicts,
      etching,
      mint,
      pointer,
      protocols,
    });
  }

  // Extract the payload from a PSBT.
  payload(psbt: bitcoin.Psbt) {
    for (let i = 0; i < psbt.txOutputs.length; i++) {
      let output = psbt.txOutputs[i];

      const p = this.payloadFromScript(output.script);
      if (p) {
        return p;
      }
    }
    return undefined;
  }

  payloadFromScript(script: Buffer): Buffer | undefined {
    const data = bitcoin.script.decompile(script);
    if (!data) {
      return undefined;
    }
    const chunks: Buffer[] = [];
    data.forEach((v) => {
      if (typeof v === "number") {
        chunks.push(Buffer.from([v]));
      } else {
        chunks.push(v);
      }
    });
    let chunk = chunks.splice(0, 1)[0];
    if (chunk.toString("hex") !== "6a") {
      return undefined;
    }

    chunk = chunks.splice(0, 1)[0];
    if (!chunk) {
      return undefined;
    }
    if (chunk.toString("hex") !== "5d") {
      // MAGIC_NUMBER OP_PUSHNUM_13
      return undefined;
    }

    let payload: Buffer[] = [];
    for (let j = 0; j < chunks.length; j++) {
      payload.push(chunks[j]);
    }
    return Buffer.concat(payload as any);
  }

  encipher() {
    let payload = [];
    const etching = this.etching;
    if (etching) {
      let flags = new RunesFlag(0n);
      Flag.Etching.set(flags);

      if (etching.terms) {
        Flag.Terms.set(flags);
      }

      if (etching.turbo) {
        Flag.Turbo.set(flags);
      }

      Tag.Flags.encode([flags.value], payload);

      Tag.Rune.encode_option(etching.rune.value, payload);

      Tag.Divisibility.encode_option(etching.divisibility, payload);

      Tag.Spacers.encode_option(etching.spacers, payload);

      if (etching.symbol) {
        Tag.Symbol.encode_option(etching.symbol.codePointAt(0), payload);
      }

      Tag.Premine.encode_option(etching.premine, payload);

      if (etching.terms) {
        let terms = etching.terms;
        Tag.Amount.encode_option(terms.amount, payload);
        Tag.Cap.encode_option(terms.cap, payload);
        Tag.HeightStart.encode_option(terms.height[0], payload);
        Tag.HeightEnd.encode_option(terms.height[1], payload);
        Tag.OffsetStart.encode_option(terms.offset[0], payload);
        Tag.OffsetEnd.encode_option(terms.offset[1], payload);
      }
    }

    if (this.mint) {
      Tag.Mint.encode([this.mint.block, this.mint.tx], payload);
    }

    Tag.Pointer.encode_option(this.pointer, payload);

    if (this.edicts.length > 0) {
      varint.encodeToVec(Tag.Body.value, payload);
      let _edicts = this.edicts.map((v) => v);
      _edicts.sort((a, b) => a.id.compare(b.id));
      let previous = new RuneId({ block: 0, tx: 0 });
      for (let i = 0; i < _edicts.length; i++) {
        let edict = _edicts[i];
        let { block, tx } = previous.delta(edict.id);
        varint.encodeToVec(block, payload);
        varint.encodeToVec(tx, payload);
        varint.encodeToVec(edict.amount, payload);
        varint.encodeToVec(edict.output, payload);
        previous = edict.id;
      }
    }

    const scriptHex = Buffer.from(new Uint8Array(payload)).toString("hex");
    return scriptHex;
  }

  // Decode the payload buffer into an array of integers.
  integers(buffer: Buffer) {
    let _payload: any = buffer;
    let array: any[] = [];
    while (_payload.length > 0) {
      const data = varint.decode(_payload);
      array.push(data.num);
      _payload = _payload.slice(data.index);
    }
    return array;
  }
}

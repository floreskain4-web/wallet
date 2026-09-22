import { Artifact } from "./artifact";
import { Edict } from "./edict";
import { Rune } from "./rune";
import { Runestone } from "./runestone";

export interface RuneBalance {
  runeid: string;
  amount: string;
  rune?: string;
  spacedRune?: string;
  symbol?: string;
  divisibility?: number;
}

class MintEntry {
  deadline: number;
  end: number;
  limit: number;
}
class Allocation {
  balance: number;
  divisibility: number;
  id: number;
  mint: MintEntry;
  rune: Rune;
  spacers: number;
  symbol: string;
}
class RuneUpdate {
  burned: number;
  mints: number;
  supply: number;
}

const RunesMap = {};
export class RuneUpdater {
  minimum: Rune;

  updates: {
    [runeId: string]: RuneUpdate;
  } = {};

  burned: {
    [key: string]: bigint;
  } = {};

  // When amount=0, distribute evenly across non-OP_RETURN outputs.
  // index_runes(psbt: bitcoin.Psbt, txid: string) {
  //   let artifact = Runestone.fromTransaction(psbt);

  //   let unallocated: { [runeId: string]: number } = {};

  //   // Update runes burned in this transaction.
  //   let burned: { [key: string]: number } = {};

  //   // Whether this transaction burns any tokens.
  //   let burn = runestone.burn;

  //   // Which output receives the default allocation.
  //   let default_output = runestone.default_output;

  //   let allocated: { [key: string]: number }[] = [];

  //   if(artifact){
  //     let mintingRuneId = artifact.mint;
  //     // if token exists and mintable
  //     // rune_entry.mints +=1

  //     if(artifact.type === "Runestone"){
  //       const runestone = artifact as Runestone;
  //       for(let i=0;i<runestone.edicts.length;i++){
  //         const {id,amount,output} = runestone.edicts[i];

  //       }
  //     }
  //   }

  //   if (runestone) {
  //     if (runestone.etching) {
  //       const etching = runestone.etching;
  //       const rune = etching.rune;
  //       if (rune < this.minimum && rune.is_reserved()) {
  //       }
  //     }
  //   }

  //   // Explicit burn.
  //   if (burn) {
  //     // If explicitly burned.
  //     for (const id in unallocated) {
  //       const balance = unallocated[id];
  //       burned[id] = burned[id] || 0;
  //       burned[id] += balance;
  //     }
  //   } else {
  //     // Otherwise the burn is accidental.
  //     let vout = -1;
  //     if (default_output && default_output < allocated.length) {
  //       // Send all unallocated runes to the default output.
  //       vout = default_output;
  //     } else {
  //       // If default_output is too large or missing, use the first non-OP_RETURN output.
  //       vout = psbt.txOutputs.findIndex(
  //         (v) => v.script.slice(0, 1).toString("hex") !== "6a"
  //       );
  //     }

  //     if (vout !== -1) {
  //       for (const id in unallocated) {
  //         const balance = unallocated[id];
  //         allocated[vout][id] += balance;
  //       }
  //     } else {
  //       for (const id in unallocated) {
  //         const balance = unallocated[id];
  //         burned[id] = burned[id] || 0;
  //         burned[id] += balance;
  //       }
  //     }
  //   }

  //   for (const id in burned) {
  //     const amount = burned[id];
  //     const runeUpdate = this.updates[id];
  //     if (runeUpdate) {
  //       runeUpdate.burned += amount;
  //     }
  //   }

  // }

  unallocated() {}

  static parse_transfer({
    inputs,
    artifact,
    outputs,
  }: {
    inputs: {
      index: number;
      runes: RuneBalance[];
    }[];
    outputs: {
      scriptPk: string;
      vout: number;
    }[];
    artifact?: Artifact;
  }) {
    let edicts: Edict[] = [];
    let runestone: Runestone = null;
    if (artifact) {
      if (artifact.type === "Runestone") {
        runestone = artifact as Runestone;
        edicts = runestone.edicts;
      } else {
        runestone = artifact as Runestone;
      }
    }

    const unallocated: {
      [id: string]: {
        amount: bigint;
      };
    } = {};

    inputs.forEach((v) => {
      const { index, runes } = v;
      runes.forEach((rune) => {
        const id = rune.runeid;
        if (!unallocated[id]) {
          unallocated[id] = {
            amount: 0n,
          };
        }
        unallocated[id].amount += BigInt(rune.amount);
      });
    });

    const allocated: { [id: string]: bigint }[] = [];

    let zeroAmountEdict = false;

    for (let i = 0; i < edicts.length; i++) {
      const edict = edicts[i];
      if (edict.output <= outputs.length == false) {
        // Burn the allocation if the output index is out of range.
        break;
      }

      if (edict.id.isDefault()) {
        if (runestone.etching) {
          // The default rune id is valid during etching.
        } else {
          // Ignore the id in all other cases.
          continue;
        }
      }

      const runeBalance = unallocated[edict.id.toString()];
      if (!runeBalance) {
        continue;
      }

      const allocate = (
        runeBalance: {
          amount: bigint;
        },
        amount: bigint,
        output: number,
      ) => {
        if (amount > 0) {
          runeBalance.amount -= amount;
          allocated[output] = allocated[output] || {};
          allocated[output][edict.id.toString()] =
            allocated[output][edict.id.toString()] || 0n;
          allocated[output][edict.id.toString()] += amount;
        }
      };

      if (edict.output === outputs.length) {
        const destinations = outputs.filter((v) => {
          return v.scriptPk.indexOf("6a") === -1;
        });
        if (edict.amount == 0n) {
          zeroAmountEdict = true;

          let amount = runeBalance.amount / BigInt(destinations.length);
          let remainder = runeBalance.amount % BigInt(destinations.length);
          for (let j = 0; j < destinations.length; j++) {
            const destination = destinations[j];

            allocate(
              runeBalance,
              j < remainder ? amount + 1n : amount,
              destination.vout,
            );
          }
        } else {
          for (let j = 0; j < destinations.length; j++) {
            const destination = destinations[j];
            allocate(runeBalance, edict.amount, destination.vout);
          }
        }
      } else {
        let amount = 0n;
        if (edict.amount == 0n) {
          amount = runeBalance.amount;
        } else {
          if (edict.amount < runeBalance.amount) {
            amount = edict.amount;
          } else {
            amount = runeBalance.amount;
          }
        }

        allocate(runeBalance, amount, edict.output);
      }
    }

    const burned: { [key: string]: bigint } = {};

    if (runestone && runestone.type === "Cenotaph") {
      for (const id in unallocated) {
        const runeBalance = unallocated[id];
        burned[id] = runeBalance.amount;
      }
    } else {
      // Use the pointer when it is valid; otherwise fall back.
      let pointer = -1;
      if (
        runestone &&
        runestone.pointer &&
        runestone.pointer < outputs.length
      ) {
        pointer = runestone.pointer;
      } else {
        for (let i = 0; i < outputs.length; i++) {
          const output = outputs[i];
          if (output.scriptPk.indexOf("6a") === 0) {
            // Skip OP_RETURN outputs.
            continue;
          }
          pointer = i; // First non-OP_RETURN output
          break;
        }
      }

      if (pointer !== -1) {
        for (const id in unallocated) {
          const runeBalance = unallocated[id];

          if (runeBalance.amount > 0) {
            allocated[pointer] = allocated[pointer] || {};
            allocated[pointer][id] = allocated[pointer][id] || 0n;
            allocated[pointer][id] += runeBalance.amount;
          }
        }
      } else {
        for (const id in unallocated) {
          const runeBalance = unallocated[id];
          if (runeBalance.amount > 0n) {
            burned[id] = runeBalance.amount;
          }
        }
      }
    }

    for (let vout in allocated) {
      if (outputs[parseInt(vout)].scriptPk.indexOf("6a") === 0) {
        for (let id in allocated[vout]) {
          burned[id] = burned[id] || 0n;
          burned[id] += allocated[vout][id];
        }
        delete allocated[vout];
      }
    }
    return {
      allocated,
      burned,
      zeroAmountEdict,
    };
  }
}

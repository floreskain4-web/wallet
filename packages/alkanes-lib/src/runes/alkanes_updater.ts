import { Artifact } from "./artifact";
import { Rune } from "./rune";
import { Runestone } from "./runestone";
interface AlkaneBalance {
  amount: string;
  alkaneid: string;
  name?: string;
  spaced?: string;
  symbol?: string;
  divisibility?: number;
  available?: string;
  type?: string;
  nftData?: unknown;
}
class RuneUpdate {
  burned: number;
  mints: number;
  supply: number;
}

export class AlkaneUpdater {
  minimum: Rune;

  updates: {
    [runeId: string]: RuneUpdate;
  } = {};

  burned: {
    [key: string]: bigint;
  } = {};

  unallocated() {}

  static parse_transfer({
    inputs,
    artifact,
    outputs,
  }: {
    inputs: {
      index: number;
      alkanes: AlkaneBalance[];
    }[];
    outputs: {
      scriptPk: string;
      vout: number;
    }[];
    artifact?: Artifact;
  }) {
    const unallocated: {
      [id: string]: {
        amount: bigint;
      };
    } = {};

    inputs.forEach((v) => {
      v.alkanes.forEach((alkane) => {
        const id = alkane.alkaneid;
        if (!unallocated[id]) {
          unallocated[id] = {
            amount: 0n,
          };
        }
        unallocated[id].amount += BigInt(alkane.amount);
      });
    });

    const allocated: { [id: string]: bigint }[] = [];

    let runestone: Runestone = null;

    if (artifact) {
      if (artifact.type === "Runestone") {
        runestone = artifact as Runestone;
      } else {
        runestone = artifact as Runestone;
      }
    }

    let pointer = -1;
    if (
      artifact &&
      artifact.type === "Runestone" &&
      artifact.protocols &&
      artifact.protocols.length > 0
    ) {
      artifact.protocols.forEach((protocol) => {
        const edicts = protocol.protocolData.edicts;
        const pointer = protocol.protocolData.pointer;

        for (let i = 0; i < edicts.length; i++) {
          const edict = edicts[i];
          if (edict.output <= outputs.length == false) {
            // 如果超出了输出的数量，就烧毁
            break;
          }

          if (edict.id.isDefault()) {
            if (runestone.etching) {
              // 如果是部署代币的时候，那么这个runeid是可以的
            } else {
              // 如果是其他情况，就忽略掉这个id
              continue;
            }
          }

          const alkaneBalance = unallocated[edict.id.toString()];
          if (!alkaneBalance) {
            continue;
          }

          const allocate = (
            alkaneBalance: {
              amount: bigint;
            },
            amount: bigint,
            output: number,
          ) => {
            if (amount > 0) {
              alkaneBalance.amount -= amount;
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
              let amount = alkaneBalance.amount / BigInt(destinations.length);
              let remainder =
                alkaneBalance.amount % BigInt(destinations.length);
              for (let j = 0; j < destinations.length; j++) {
                const destination = destinations[j];

                allocate(
                  alkaneBalance,
                  j < remainder ? amount + 1n : amount,
                  destination.vout,
                );
              }
            } else {
              for (let j = 0; j < destinations.length; j++) {
                const destination = destinations[j];
                allocate(alkaneBalance, edict.amount, destination.vout);
              }
            }
          } else {
            let amount = 0n;
            if (edict.amount == 0n) {
              amount = alkaneBalance.amount;
            } else {
              if (edict.amount < alkaneBalance.amount) {
                amount = edict.amount;
              } else {
                amount = alkaneBalance.amount;
              }
            }

            allocate(alkaneBalance, amount, edict.output);
          }
        }

        for (const id in unallocated) {
          const runeBalance = unallocated[id];

          if (runeBalance.amount > 0) {
            allocated[pointer] = allocated[pointer] || {};
            allocated[pointer][id] = allocated[pointer][id] || 0n;
            allocated[pointer][id] += runeBalance.amount;
          }
        }
      });
    }

    const burned: { [key: string]: bigint } = {};

    // 如果是废的格式，则烧掉所有的
    if (runestone && runestone.type === "Cenotaph") {
      for (const id in unallocated) {
        const alkaneBalance = unallocated[id];
        burned[id] = alkaneBalance.amount;
      }
    }

    // 如果是合法的格式，但是没有配置Protocols，也烧掉
    if (runestone && runestone.protocols && runestone.protocols.length == 0) {
      for (const id in unallocated) {
        const alkaneBalance = unallocated[id];
        if (alkaneBalance.amount > 0) {
          burned[id] = alkaneBalance.amount;
        }
      }
    }

    // 如果没有OP_REETURN，也要烧掉
    if (!runestone) {
      for (const id in unallocated) {
        const alkaneBalance = unallocated[id];
        if (alkaneBalance.amount > 0) {
          burned[id] = alkaneBalance.amount;
        }
      }
    }

    // 分配给OP_RETURN的也算是被烧掉
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
    };
  }
}

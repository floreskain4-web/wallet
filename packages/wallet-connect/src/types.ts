/**
 * Supported chain types for wallet connections
 */
export enum ChainType {
  BITCOIN_MAINNET = 'BITCOIN_MAINNET',
  BITCOIN_TESTNET = 'BITCOIN_TESTNET',
  FRACTAL_BITCOIN_MAINNET = 'FRACTAL_BITCOIN_MAINNET',
  FRACTAL_BITCOIN_TESTNET = 'FRACTAL_BITCOIN_TESTNET',
}

export const ALL_CHAIN_TYPES = [
  ChainType.BITCOIN_MAINNET,
  ChainType.BITCOIN_TESTNET,
  ChainType.FRACTAL_BITCOIN_MAINNET,
  ChainType.FRACTAL_BITCOIN_TESTNET,
] as const;

/**
 * Wallet type identifiers
 */
export enum WalletType {
  UniSat = 'unisat',
  Okx = 'okx',
  Xverse = 'xverse',
}

/**
 * Input specification for PSBT signing
 */
export interface ToSignInput {
  index: number;
  address: string;
  publicKey?: string;
  useTweakedSigner?: boolean;
}

/**
 * Basic account information from wallet
 */
export interface Account {
  address: string;
  pubKey: string;
  paymentAccount?: {
    address: string;
    pubKey: string;
  };
}

/**
 * Bitcoin balance information
 */
export interface BtcBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

/**
 * Wallet configuration
 */
export interface WalletConfig {
  name: string;
  icon: string;
  type: WalletType;
  supportChain: ChainType[];
  logoPadding?: number;
  downloadUrl?: string;
}

/**
 * Translator function type for i18n support
 */
export type WalletTranslator = (key: string, values?: Record<string, unknown>) => string;

/**
 * Notifier interface for wallet notifications
 * Implement this interface to provide custom notification UI
 */
export interface WalletNotifier {
  warning(options: {
    message: string;
    description?: string;
    key?: string;
    onClick?: () => void;
  }): void;
  destroy(key: string): void;
}

/**
 * Wallet listener callbacks
 */
export interface WalletListenerParams {
  onAccountChange: (...args: unknown[]) => void;
  onNetworkChange: (...args: unknown[]) => void;
}

/**
 * PSBT signing parameters
 */
export interface SignPsbtParams {
  psbt: string;
  toSignInputs?: ToSignInput[];
}

/**
 * Wallet connection options
 */
export interface WalletConnectOptions {
  /** Current chain type to connect */
  chainType: ChainType;
  /** Optional translator for i18n */
  translator?: WalletTranslator;
  /** Optional notifier for UI feedback */
  notifier?: WalletNotifier;
}

/**
 * Chain detection flags based on chain type
 */
export interface ChainFlags {
  isBitcoinMainnet: boolean;
  isBitcoinTestnet: boolean;
  isFractalMainnet: boolean;
  isFractalTestnet: boolean;
}

/**
 * Get chain flags from chain type
 */
export function getChainFlags(chainType: ChainType): ChainFlags {
  return {
    isBitcoinMainnet: chainType === ChainType.BITCOIN_MAINNET,
    isBitcoinTestnet: chainType === ChainType.BITCOIN_TESTNET,
    isFractalMainnet: chainType === ChainType.FRACTAL_BITCOIN_MAINNET,
    isFractalTestnet: chainType === ChainType.FRACTAL_BITCOIN_TESTNET,
  };
}

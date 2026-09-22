import type {
  Account,
  BaseWallet,
  ToSignInput,
  WalletTranslator,
  WalletNotifier,
  ChainType,
} from '@unisat/wallet-connect';

/**
 * Extended account type with optional extra fields
 * Applications can extend this with their own fields
 */
export interface ConnectedAccount extends Account {
  /** Optional application-specific identifier */
  mixAddress?: string;
  /** Any additional application-specific data */
  [key: string]: unknown;
}

/**
 * Wallet context value type
 */
export interface WalletContextType {
  /** Currently connected account */
  account: ConnectedAccount | undefined;
  /** Currently connected wallet instance */
  wallet: BaseWallet | undefined;
  /** Whether a connection is in progress */
  isConnecting: boolean;
  /** Whether wallet initialization is complete */
  isInitialized: boolean;
  /** Open wallet selection modal */
  connect: () => void;
  /** Disconnect current wallet */
  disconnect: () => void;
  /** Sign a single PSBT */
  signPsbt: (psbt: string, opt?: { toSignInputs?: ToSignInput[] }) => Promise<string>;
  /** Sign multiple PSBTs */
  signPsbts: (params: { psbt: string; toSignInputs?: ToSignInput[] }[]) => Promise<string[]>;
  /** Sign a message */
  signMessage: (message: string, type?: 'ecdsa' | 'bip322-simple') => Promise<string>;
  /** List of supported wallets */
  supportedWallets: BaseWallet[];
}

/**
 * Callback for initializing user after connection
 * Return additional account data to merge into ConnectedAccount
 */
export type OnUserInitialize = (account: Account) => Promise<Record<string, unknown>>;

/**
 * Callback when connection fails
 */
export type OnConnectError = (error: unknown) => void;

/**
 * Callback when account changes
 */
export type OnAccountChange = (account: ConnectedAccount | undefined) => void;

/**
 * Callback for validating address type
 * Return true if address is supported
 */
export type ValidateAddress = (address: string) => boolean;

/**
 * WalletProvider configuration options
 */
export interface WalletProviderConfig {
  /** Current chain type */
  chainType: ChainType;
  /** List of wallet instances to support */
  wallets: BaseWallet[];
  /** LocalStorage key for persisting connected wallet */
  storageKey?: string;
  /** Optional translator for i18n */
  translator?: WalletTranslator;
  /** Optional notifier for UI feedback */
  notifier?: WalletNotifier;
  /** Callback to initialize user after connection */
  onUserInitialize?: OnUserInitialize;
  /** Callback when connection fails */
  onConnectError?: OnConnectError;
  /** Callback when account changes */
  onAccountChange?: OnAccountChange;
  /** Whether to disconnect when the wallet network changes. Defaults to false. */
  disconnectOnNetworkChange?: boolean;
  /** Function to validate address type (default: P2WPKH or Taproot) */
  validateAddress?: ValidateAddress;
  /** Whether to disable auto-connect */
  disableAutoConnect?: boolean;
  /** Whether to disable connect (e.g., for jurisdiction restrictions) */
  disableConnect?: boolean;
  /** Children render function receiving context */
  children: React.ReactNode;
  /** Custom modal component for wallet selection */
  renderModal?: (props: WalletModalProps) => React.ReactNode;
}

/**
 * Props passed to custom wallet selection modal
 */
export interface WalletModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Close the modal */
  onClose: () => void;
  /** List of available wallets */
  wallets: BaseWallet[];
  /** Currently connecting wallet */
  connectingWallet: BaseWallet | undefined;
  /** Whether initialization is complete */
  isInitialized: boolean;
  /** Handle wallet selection */
  onSelectWallet: (wallet: BaseWallet) => void;
  /** Cancel current connection */
  onCancel: () => void;
}

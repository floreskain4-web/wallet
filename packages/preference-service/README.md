# @unisat/preference-service

Cross-platform preference management service for UniSat wallet applications.

## Features

- 🔧 Cross-platform preference management (browser extensions, mobile apps)
- 💾 Flexible storage adapters (Chrome storage, React Native AsyncStorage, memory)
- 🌐 Locale management with adapter pattern
- 📦 TypeScript support with strict typing
- 🔄 Automatic data persistence with debounced saves
- 🚀 Migration system for version upgrades
- 📱 Platform-specific extensions (extension vs mobile features)

## Installation

```bash
npm install @unisat/preference-service
```

## Usage

### Basic Usage

```typescript
import { 
  PreferenceService, 
  ExtensionStorageAdapter, 
  ExtensionLocaleAdapter,
  BasePreferenceStore,
  ChainType,
  NetworkType,
  AddressType
} from '@unisat/preference-service';

// Create storage and locale adapters
const storage = new ExtensionStorageAdapter();
const locale = new ExtensionLocaleAdapter(i18nService);

// Define your preference template
const template: BasePreferenceStore = {
  // Account management
  currentKeyringIndex: 0,
  currentAccount: null,
  editingKeyringIndex: 0,
  editingAccount: null,
  
  // User preferences
  locale: 'en',
  currency: 'USD',
  externalLinkAck: false,
  showSafeNotice: true,
  
  // Network configuration
  chainType: ChainType.BITCOIN_MAINNET,
  networkType: NetworkType.MAINNET,
  addressType: AddressType.P2WPKH,
  
  // Data maps
  balanceMap: {},
  historyMap: {},
  watchAddressPreference: {},
  walletSavedList: [],
  alianNames: {},
  keyringAlianNames: {},
  accountAlianNames: {},
  addressFlags: {},
  
  // UI data
  uiCachedData: {},
  appTab: {
    summary: { apps: [] },
    readTabTime: 1,
    readAppTime: {}
  },
  
  // Version management
  initAlianNames: false,
  currentVersion: '1.0.0',
  firstOpen: false,
  skippedVersion: '',
  
  // Extension-specific
  autoLockTimeId: 0,
  openInSidePanel: false,
  developerMode: false
};

// Create service instance (no generic parameter needed!)
const preferenceService = new PreferenceService({
  storage,
  locale,
  logger: console,
  template,
  supportedLocales: ['en', 'zh_TW', 'fr', 'es', 'ru', 'ja'],
  platformDefaults: {
    developerMode: false,
    autoLockTimeId: 0
  }
});

// Initialize
await preferenceService.init();

// Use the service
const currentAccount = preferenceService.getCurrentAccount();
preferenceService.setLocale('zh_TW');
preferenceService.setCurrency('EUR');

// All platform features available
preferenceService.setAutoLockTimeId(30);       // Extension feature
preferenceService.setDeveloperMode(true);      // Extension feature
preferenceService.setOpenInSidePanel(false);   // Extension feature
preferenceService.setGuideReaded(true);        // Mobile feature
preferenceService.setAddressSummary('bc1q...', { // Mobile feature
  totalSatoshis: 100000,
  btcSatoshis: 80000,
  assetSatoshis: 20000
});
```

### Mobile Usage

```typescript
import {
  PreferenceService,
  MobileStorageAdapter,
  MobileLocaleAdapter,
  BasePreferenceStore
} from '@unisat/preference-service';

// Mobile storage (AsyncStorage)
const mobileStorage = {
  getItem: async (key: string) => await AsyncStorage.getItem(key),
  setItem: async (key: string, value: string) => await AsyncStorage.setItem(key, value),
  removeItem: async (key: string) => await AsyncStorage.removeItem(key)
};

const storage = new MobileStorageAdapter(mobileStorage);
const locale = new MobileLocaleAdapter('en');

const template: BasePreferenceStore = {
  // Same template as extension, all fields are optional
  currentKeyringIndex: 0,
  currentAccount: null,
  // ... other base fields
  // Mobile-specific fields
  guideReaded: false,
  addressSummary: {}
};

const preferenceService = new PreferenceService({
  storage,
  locale,
  template,
  supportedLocales: ['en']
});
```

### Event Listening

```typescript
// Listen to preference changes
preferenceService.on('account:changed', (account) => {
  console.log('Account changed:', account);
});

preferenceService.on('locale:changed', (locale) => {
  console.log('Locale changed:', locale);
});

preferenceService.on('currency:changed', (currency) => {
  console.log('Currency changed:', currency);
});

preferenceService.on('chain:changed', (chainType) => {
  console.log('Chain changed:', chainType);
});
```

### Account Management

```typescript
// Get current account
const account = preferenceService.getCurrentAccount();

// Set current account
preferenceService.setCurrentAccount({
  address: 'bc1q...',
  pubkey: '02...',
  type: 'P2WPKH',
  brandName: 'UniSat'
});

// Account aliases
preferenceService.setAccountAlianName('account_key', 'My Wallet');
const alias = preferenceService.getAccountAlianName('account_key');
```

### Address Management

```typescript
// Balance management
preferenceService.updateAddressBalance('bc1q...', {
  confirm_amount: '100000',
  pending_amount: '0',
  amount: '100000',
  // ... other balance fields
});

const balance = preferenceService.getAddressBalance('bc1q...');

// History management
preferenceService.updateAddressHistory('bc1q...', [
  {
    txid: 'abc123...',
    time: Date.now(),
    date: '2024-01-01',
    amount: '0.001',
    symbol: 'BTC',
    address: 'bc1q...'
  }
]);

// Address flags
preferenceService.addAddressFlag('bc1q...', AddressFlagType.Is_Enable_Atomicals);
const flag = preferenceService.getAddressFlag('bc1q...');
```

### Custom Storage Adapter

```typescript
import { BaseStorageAdapter } from '@unisat/preference-service';

class CustomStorageAdapter extends BaseStorageAdapter {
  async get(key: string): Promise<any> {
    // Implement your storage read logic
    return customStorage.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    // Implement your storage write logic
    await customStorage.set(key, value);
  }
}
```

## API Reference

### PreferenceService

**Simplified API**: No generic parameters required! All platform-specific methods are available in a single service class.

#### Core Methods
- `init(reset?: boolean): Promise<void>` - Initialize the service
- `getCurrentAccount(): Account | null` - Get current account
- `setCurrentAccount(account: Account | null): void` - Set current account

#### Locale & Currency
- `getLocale(): string` - Get current locale
- `setLocale(locale: string): void` - Set locale
- `getCurrency(): string` - Get currency
- `setCurrency(currency: string): void` - Set currency

#### Address Management
- `updateAddressBalance(address: string, balance: BitcoinBalance): void`
- `getAddressBalance(address: string): BitcoinBalance | null`
- `updateAddressHistory(address: string, history: TxHistoryItem[]): void`
- `getAddressHistory(address: string): TxHistoryItem[]`

#### Address Flags
- `getAddressFlag(address: string): number`
- `setAddressFlag(address: string, flag: number): void`
- `addAddressFlag(address: string, flag: AddressFlagType): number`
- `removeAddressFlag(address: string, flag: AddressFlagType): number`

#### Wallet Management
- `getWalletSavedList(): any[]`
- `updateWalletSavedList(list: any[]): void`
- `getInitAlianNameStatus(): boolean`
- `changeInitAlianNameStatus(): void`
- `getIsFirstOpen(): boolean`
- `updateIsFirstOpen(): void`

#### Network & Address Types
- `getAddressType(): any` (deprecated)
- `getNetworkType(): any`
- `setNetworkType(networkType: any): void`

#### Platform-specific Methods

**Note**: All methods are available on the same service instance. Platform-specific fields are optional in the store.

Extension features:
- `getAutoLockTimeId(): number`
- `setAutoLockTimeId(id: number): void`
- `getOpenInSidePanel(): boolean`
- `setOpenInSidePanel(openInSidePanel: boolean): void`
- `getDeveloperMode(): boolean`
- `setDeveloperMode(developerMode: boolean): void`

Mobile features:
- `getGuideReaded(): boolean`
- `setGuideReaded(guideReaded: boolean): void`
- `getAddressSummary(address: string): any`
- `setAddressSummary(address: string, summary: any): void`

### Storage Adapters

#### ExtensionStorageAdapter
Chrome extension storage implementation.

#### MobileStorageAdapter
React Native AsyncStorage implementation.

#### MemoryStorageAdapter
In-memory storage for testing.

### Locale Adapters

#### ExtensionLocaleAdapter
Chrome extension i18n API integration.

#### MobileLocaleAdapter
Mobile locale management.

## Types

The package exports comprehensive TypeScript types:

- `BasePreferenceStore` - Core preference structure
- `ExtensionPreferenceStore` - Extension-specific preferences
- `MobilePreferenceStore` - Mobile-specific preferences
- `StorageAdapter` - Storage interface
- `LocaleAdapter` - Locale interface
- `PreferenceServiceConfig` - Service configuration
- And many more...

## Migration

The service includes a built-in migration system for handling version upgrades:

```typescript
import { MigrationManager } from '@unisat/preference-service';

const migrationManager = new MigrationManager();
migrationManager.addMigration({
  fromVersion: '1.0.0',
  toVersion: '1.1.0',
  migrate: (data) => {
    // Transform data for new version
    return { ...data, newField: 'defaultValue' };
  }
});
```

## License

MIT

import { ErrorCodes, WalletError } from '@unisat/wallet-shared'
import { ChainType } from '@unisat/wallet-types'

export const chainTypeToCanonicalNetwork = (chainType: ChainType): string => {
  switch (chainType) {
    case ChainType.BITCOIN_MAINNET:
      return 'bitcoin-mainnet'
    case ChainType.BITCOIN_TESTNET:
    case ChainType.BITCOIN_TESTNET4:
      return 'bitcoin-testnet'
    case ChainType.BITCOIN_SIGNET:
      return 'bitcoin-signet'
    default:
      throw new WalletError(
        ErrorCodes.UNSUPPORTED_NETWORK,
        `wallet chain "${chainType}" is not supported by deriveContextHash`,
      )
  }
}

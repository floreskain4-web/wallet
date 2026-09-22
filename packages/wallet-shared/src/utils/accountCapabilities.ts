import { KeyringType } from '../constants'
import { Account } from '../types'

export enum AccountSignMethod {
  Local = 'local',
  Keystone = 'keystone',
  ColdWallet = 'coldWallet',
  External = 'external',
  None = 'none',
}

export type AccountCapabilities = {
  canCreateSigningRequest: boolean
  signMethod: AccountSignMethod
  canChangeAddressType: boolean
}

export function getAccountCapabilities(
  account: Pick<Account, 'type'> | { type?: string } | null | undefined
): AccountCapabilities {
  const type = account?.type
  const hasAccountType = Boolean(type)
  const isWatchOnly = type === KeyringType.WatchAddressKeyring
  const isReadonly = type === KeyringType.ReadonlyKeyring
  let signMethod = AccountSignMethod.None

  if (type === KeyringType.KeystoneKeyring) {
    signMethod = AccountSignMethod.Keystone
  } else if (type === KeyringType.ColdWalletKeyring) {
    signMethod = AccountSignMethod.ColdWallet
  } else if (isReadonly) {
    signMethod = AccountSignMethod.External
  } else if (hasAccountType && !isWatchOnly) {
    signMethod = AccountSignMethod.Local
  }

  return {
    canCreateSigningRequest: hasAccountType && !isWatchOnly,
    signMethod,
    canChangeAddressType:
      hasAccountType && !isWatchOnly && signMethod !== AccountSignMethod.ColdWallet,
  }
}

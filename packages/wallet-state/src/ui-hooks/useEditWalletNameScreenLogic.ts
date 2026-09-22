import { useMemo, useState } from 'react'

import { MAX_ALIAS_NAME_LENGTH } from '@unisat/wallet-shared'

import { keyringsActions, useAppDispatch, useI18n, useNavigation, useWallet } from '..'
export function useEditWalletNameScreenLogic() {
  const nav = useNavigation()
  const { keyring } = nav.getRouteState<'EditWalletNameScreen'>()
  const { t } = useI18n()
  const wallet = useWallet()
  const [alianName, setAlianName] = useState(keyring.alianName || '')
  const dispatch = useAppDispatch()
  const handleOnClick = async () => {
    try {
      const newKeyring = await wallet.setKeyringAlianName(keyring, alianName || keyring.alianName)
      //@ts-ignore SAFE
      dispatch(keyringsActions.updateKeyringName(newKeyring))
      nav.goBack()
    } catch (e) {
      console.log(e)
    }
  }

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if ('Enter' == e.key && e.ctrlKey) {
      handleOnClick()
    }
  }

  const isValidName = useMemo(() => {
    if (alianName.length == 0) {
      return false
    }
    return true
  }, [alianName])

  const truncatedTitle = useMemo(() => {
    if (keyring.alianName && keyring.alianName.length > MAX_ALIAS_NAME_LENGTH) {
      return keyring.alianName.slice(0, MAX_ALIAS_NAME_LENGTH) + '...'
    }
    return keyring.alianName || ''
  }, [keyring.alianName])

  const onInputChange = (e: { target: { value: string } } | string) => {
    const value = typeof e === 'string' ? e : e.target.value
    if (value.length <= MAX_ALIAS_NAME_LENGTH) {
      setAlianName(value)
    }
  }

  return {
    t,
    keyring,
    isValidName,
    truncatedTitle,
    handleOnClick,
    handleOnKeyUp,
    onInputChange,
  }
}

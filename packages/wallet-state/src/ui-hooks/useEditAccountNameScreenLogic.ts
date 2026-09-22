import { Account, MAX_ALIAS_NAME_LENGTH } from '@unisat/wallet-shared'
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n, useNavigation, useWallet } from 'src/context'
import { useAppDispatch } from 'src/hooks'
import { accountActions, keyringsActions } from 'src/reducers'

export function useEditAccountNameScreenLogic() {
  const nav = useNavigation()
  const { t } = useI18n()

  const { state } = useLocation()
  const { account } = state as {
    account: Account
  }

  const wallet = useWallet()
  const [alianName, setAlianName] = useState(account.alianName || '')
  const dispatch = useAppDispatch()
  const handleOnClick = async () => {
    const newAccount = await wallet.setAccountAlianName(account, alianName)
    // @ts-ignore SAFE
    dispatch(keyringsActions.updateAccountName(newAccount))
    // @ts-ignore SAFE
    dispatch(accountActions.updateAccountName(newAccount))
    nav.goBack()
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
    const name = account.alianName || ''
    if (name.length > MAX_ALIAS_NAME_LENGTH) {
      return name.slice(0, MAX_ALIAS_NAME_LENGTH) + '...'
    }
    return name
  }, [account.alianName])

  const onInputChange = (e: { target: { value: string } } | string) => {
    const value = typeof e === 'string' ? e : e.target.value
    if (value.length <= MAX_ALIAS_NAME_LENGTH) {
      setAlianName(value)
    }
  }

  const onClickBack = () => {
    nav.goBack()
  }
  return {
    alianName,
    handleOnClick,
    handleOnKeyUp,
    isValidName,
    truncatedTitle,
    t,
    account,
    onInputChange,
    onClickBack,
  }
}

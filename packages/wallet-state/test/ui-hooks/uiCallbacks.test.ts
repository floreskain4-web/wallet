import { describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import {
  useResetAddressInput,
  useResetAmountInput,
  useResetFeeRateBar,
  useResetTxState,
  useResetUiTxCreateScreen,
  useUpdateAddressInput,
  useUpdateAmountInput,
  useUpdateFeeRateBar,
  useUpdateUiTxCreateScreen,
} from '../../src/hooks/ui'
import { createHookTestHarness } from './testHelpers'

describe('ui update callbacks', () => {
  it.each([
    {
      name: 'useUpdateUiTxCreateScreen',
      useHook: useUpdateUiTxCreateScreen,
      trigger: callback => callback({ inputAmount: '1' }),
    },
    {
      name: 'useUpdateFeeRateBar',
      useHook: useUpdateFeeRateBar,
      trigger: callback => callback({ feeRate: 12 }),
    },
    {
      name: 'useUpdateAddressInput',
      useHook: useUpdateAddressInput,
      trigger: callback => callback({ address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' }),
    },
    {
      name: 'useUpdateAmountInput',
      useHook: useUpdateAmountInput,
      trigger: callback => callback({ amount: '0.1' }),
    },
    {
      name: 'useResetFeeRateBar',
      useHook: useResetFeeRateBar,
      trigger: callback => callback(),
    },
    {
      name: 'useResetAddressInput',
      useHook: useResetAddressInput,
      trigger: callback => callback(),
    },
    {
      name: 'useResetAmountInput',
      useHook: useResetAmountInput,
      trigger: callback => callback(),
    },
    {
      name: 'useResetTxState',
      useHook: useResetTxState,
      trigger: callback => callback(),
    },
    {
      name: 'useResetUiTxCreateScreen',
      useHook: useResetUiTxCreateScreen,
      trigger: callback => callback(),
    },
  ])('keeps $name stable across redux updates', async ({ useHook, trigger }) => {
    const { wrapper } = createHookTestHarness()
    const { result, rerender } = renderHook(() => useHook(), { wrapper })
    const initialCallback = result.current

    act(() => {
      trigger(result.current as any)
    })
    rerender()

    await waitFor(() => {
      expect(result.current).toBe(initialCallback)
    })
  })
})

import { describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useTxCreateScreenLogic } from '../../src/ui-hooks/useTxCreateScreenLogic'
import { createHookTestHarness } from './testHelpers'

describe('TxCreateScreen state hooks', () => {
  it('loads the persisted RBF setting once instead of on every state update', async () => {
    const { wrapper, wallet } = createHookTestHarness()
    const { result } = renderHook(() => useTxCreateScreenLogic(), { wrapper })

    await waitFor(() => {
      expect(wallet.getEnableRBF).toHaveBeenCalledTimes(1)
    })

    act(() => {
      result.current.onAmountInputChange('0.0001')
    })

    await waitFor(() => {
      expect(result.current.inputAmount).toBe('0.0001')
    })

    expect(wallet.getEnableRBF).toHaveBeenCalledTimes(1)
  })
})

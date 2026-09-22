import { describe, expect, it } from 'vitest'
import { bnUtils } from '../src/bn'

describe('bnUtils', () => {
  it('plus', async () => {
    // 0.00000000000001 + 0.00000000000002 = 0.00000000000003
    const num1 = '0.00000000000001'
    const num2 = '0.00000000000002'
    const num3 = bnUtils.toBigNumber(num1).plus(bnUtils.toBigNumber(num2)).toString()
    expect(num3).toBe('0.00000000000003')
  })

  it('toDisplayAmount', async () => {
    expect(bnUtils.toDisplayAmount('0.00000001')).toBe('0.00000001')
    expect(bnUtils.toDisplayAmount('0.000000001')).toBe('<0.00000001')

    expect(bnUtils.toDisplayAmount('1')).toBe('1')
    expect(bnUtils.toDisplayAmount('1.001')).toBe('1.001')
    expect(bnUtils.toDisplayAmount('1.000000001')).toBe('1.00000000')
    expect(bnUtils.toDisplayAmount('1.111111101')).toBe('1.11111110')

    expect(bnUtils.toDisplayAmount('1.9999')).toBe('1.9999')
    expect(bnUtils.toDisplayAmount('3.1111111111000000001')).toBe('3.11111111')
    expect(bnUtils.toDisplayAmount('1000000')).toBe('1,000,000')
    expect(bnUtils.toDisplayAmount('1000000.666777888555')).toBe('1,000,000.66677788')
  })

  it('toDisplayUSD', async () => {
    expect(bnUtils.toDisplayUSD('0.000000001')).toBe('<0.01')
    expect(bnUtils.toDisplayUSD('0.01')).toBe('0.01')
    expect(bnUtils.toDisplayUSD('1.000000001')).toBe('1')
    expect(bnUtils.toDisplayUSD('3.1111111111000000001')).toBe('3.11')
    expect(bnUtils.toDisplayUSD('1000000')).toBe('1,000,000')
    expect(bnUtils.toDisplayUSD('1000000.666777888555')).toBe('1,000,000.67')
  })
})

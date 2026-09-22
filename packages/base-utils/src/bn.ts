import { BigNumber } from 'bignumber.js'

BigNumber.config({ EXPONENTIAL_AT: [-38, 40] })

// Max 38 decimal places
function toDecimalAmount(amount: string, divisibility: number) {
  const decimalAmount = new BigNumber(amount).dividedBy(new BigNumber(10).pow(divisibility))
  return decimalAmount.toString()
}

function toDecimalNumber(amount: string, divisibility: number) {
  const decimalAmount = new BigNumber(amount).dividedBy(new BigNumber(10).pow(divisibility))
  return decimalAmount
}

function fromDecimalAmount(decimalAmount: string, divisibility: number) {
  decimalAmount = decimalAmount.replace(/\.$/, '')
  if (divisibility === 0) {
    return decimalAmount
  }
  const amount = new BigNumber(decimalAmount).multipliedBy(new BigNumber(10).pow(divisibility))
  return amount.toString()
}

function compareAmount(a: string, b: string) {
  return new BigNumber(a).comparedTo(new BigNumber(b))
}

function toBigNumber(a: string) {
  return new BigNumber(a)
}

function formatWithCommas(amount: string) {
  const [integerPart, decimalPart] = amount.split('.')
  const integerPartWithCommas = integerPart!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decimalPart ? `${integerPartWithCommas}.${decimalPart}` : integerPartWithCommas
}

function toDisplayAmount(amount: string) {
  // 0.00000001 ->  0.00000001
  // 0.000000001 ->  <0.00000001
  // 1.000000001 -> 1.00000000
  const decimalAmount = new BigNumber(amount)
  if (decimalAmount.isZero()) {
    return '0'
  }
  if (decimalAmount.isLessThan(new BigNumber(0.00000001))) {
    return '<0.00000001'
  }
  const [, decimalPart = ''] = decimalAmount.toString().split('.')
  const displayAmount = decimalAmount.toFixed(Math.min(decimalPart.length, 8), BigNumber.ROUND_DOWN)
  return formatWithCommas(displayAmount)
}

function toDisplayUSD(amount: string) {
  const decimalAmount = new BigNumber(amount)
  if (decimalAmount.isZero()) {
    return '0'
  }
  if (decimalAmount.isLessThan(new BigNumber('0.01'))) {
    return '<0.01'
  }
  const displayAmount = decimalAmount.toFixed(2, BigNumber.ROUND_HALF_UP).replace(/\.?0+$/, '')
  return formatWithCommas(displayAmount)
}

export const bnUtils = {
  toDecimalAmount,
  toDecimalNumber,
  fromDecimalAmount,
  compareAmount,
  toBigNumber,
  toDisplayAmount,
  toDisplayUSD,
}

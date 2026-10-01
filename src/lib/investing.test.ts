import { describe, expect, it } from 'vitest'
import { compareOverpayingWithInvesting, netMonthlyReturn } from './investing'
import type { LoanParams, OverpaymentPlan } from './types'

// Same round-number loan as in schedule.test.ts: 12% per year, 1000 principal part.
const decreasing: LoanParams = {
  principal: 120_000,
  annualRatePercent: 12,
  termMonths: 120,
  installmentType: 'decreasing',
}
const oneTime: OverpaymentPlan = {
  oneTime: [{ month: 10, amount: 10_000 }],
  recurring: null,
  effect: 'shortenTerm',
}

describe('netMonthlyReturn', () => {
  it('divides the yearly return by 12', () => {
    expect(netMonthlyReturn(12, false)).toBeCloseTo(0.01, 12)
  })

  it('takes 19% tax off the gain', () => {
    expect(netMonthlyReturn(12, true)).toBeCloseTo(0.0081, 12)
  })
})

describe('compareOverpayingWithInvesting', () => {
  it('ends at the original loan term', () => {
    expect(compareOverpayingWithInvesting(decreasing, oneTime, 5, true).horizonMonths).toBe(120)
  })

  it('at 0% return, overpaying wins by exactly the interest saved', () => {
    const result = compareOverpayingWithInvesting(decreasing, oneTime, 0, false)
    expect(result.difference).toBeCloseTo(10_550, 6)
  })

  it('at a return equal to the loan rate (no tax) both scenarios end equal', () => {
    // Paying off debt at 12% is the same as earning 12%: present values match.
    expect(compareOverpayingWithInvesting(decreasing, oneTime, 12, false).difference).toBeCloseTo(0, 4)
    expect(
      compareOverpayingWithInvesting(decreasing, { ...oneTime, effect: 'lowerInstallment' }, 12, false).difference,
    ).toBeCloseTo(0, 4)
  })

  it('investing wins above the loan rate, overpaying below it', () => {
    expect(compareOverpayingWithInvesting(decreasing, oneTime, 15, false).difference).toBeLessThan(0)
    expect(compareOverpayingWithInvesting(decreasing, oneTime, 8, false).difference).toBeGreaterThan(0)
  })

  it('break-even is the loan rate without tax and loan rate / 0.81 with tax', () => {
    expect(compareOverpayingWithInvesting(decreasing, oneTime, 5, false).breakEvenGrossRatePercent).toBeCloseTo(12, 6)
    expect(compareOverpayingWithInvesting(decreasing, oneTime, 5, true).breakEvenGrossRatePercent).toBeCloseTo(
      12 / 0.81,
      6,
    )
  })

  it('reports wealth for both scenarios; at 0% it is the sum of money not paid to the bank', () => {
    const result = compareOverpayingWithInvesting(decreasing, oneTime, 0, false)
    // Investing scenario simply keeps the 10 000 overpayment.
    expect(result.investWealth).toBeCloseTo(10_000, 6)
    expect(result.overpayWealth).toBeCloseTo(20_550, 6)
  })

  it('has nothing to compare without overpayments', () => {
    const result = compareOverpayingWithInvesting(decreasing, { ...oneTime, oneTime: [] }, 5, true)
    expect(result.difference).toBe(0)
    expect(result.breakEvenGrossRatePercent).toBeNull()
  })

  it('names the winner and by how much', () => {
    const low = compareOverpayingWithInvesting(decreasing, oneTime, 8, false)
    expect(low.winner).toBe('overpay')
    expect(low.advantage).toBeCloseTo(low.difference, 8)

    const high = compareOverpayingWithInvesting(decreasing, oneTime, 15, false)
    expect(high.winner).toBe('invest')
    expect(high.advantage).toBeCloseTo(-high.difference, 8)

    expect(compareOverpayingWithInvesting(decreasing, oneTime, 12, false).winner).toBe('tie')
  })
})

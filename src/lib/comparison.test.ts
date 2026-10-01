import { describe, expect, it } from 'vitest'
import { compareEffects, describeReferenceInstallment, referenceMonth } from './comparison'
import type { LoanParams, OverpaymentPlan } from './types'

// Same round-number loan as in schedule.test.ts: 1% per month, 1000 principal part.
const decreasing: LoanParams = {
  principal: 120_000,
  annualRatePercent: 12,
  termMonths: 120,
  installmentType: 'decreasing',
}

const plan = (overrides: Partial<OverpaymentPlan>): OverpaymentPlan => ({
  oneTime: [],
  recurring: null,
  effect: 'shortenTerm',
  ...overrides,
})

describe('referenceMonth', () => {
  it('is the last one-time overpayment month', () => {
    expect(referenceMonth(plan({ oneTime: [{ month: 24, amount: 1 }, { month: 10, amount: 1 }] }))).toBe(24)
  })

  it('is the first recurring overpayment when there are no one-time ones', () => {
    expect(referenceMonth(plan({ recurring: { startMonth: 1, amount: 100 } }))).toBe(1)
    expect(referenceMonth(plan({ recurring: { startMonth: 25, amount: 100 } }))).toBe(25)
  })

  it('is null without overpayments', () => {
    expect(referenceMonth(plan({}))).toBeNull()
  })
})

describe('compareEffects', () => {
  it('computes both variants regardless of the effect chosen in the plan', () => {
    const oneTime = [{ month: 10, amount: 10_000 }]
    const fromShorten = compareEffects(decreasing, plan({ oneTime, effect: 'shortenTerm' }))
    const fromLower = compareEffects(decreasing, plan({ oneTime, effect: 'lowerInstallment' }))
    expect(fromShorten).toEqual(fromLower)
  })

  it('one-time overpayment: shortening saves more; installment read in the month after it', () => {
    const result = compareEffects(decreasing, plan({ oneTime: [{ month: 10, amount: 10_000 }] }))

    expect(result.shortenTerm.interestSaved).toBeCloseTo(10_550, 6)
    expect(result.shortenTerm.totals.months).toBe(110)
    // Month 11: principal part 1000 + 1% of 100k
    expect(result.shortenTerm.installmentAfterOverpayments).toBeCloseTo(2000, 6)

    expect(result.lowerInstallment.interestSaved).toBeCloseTo(5550, 6)
    expect(result.lowerInstallment.totals.months).toBe(120)
    // Month 11: principal part 100k / 110 + 1% of 100k
    expect(result.lowerInstallment.installmentAfterOverpayments).toBeCloseTo(100_000 / 110 + 1000, 6)

    expect(result.better).toBe('shortenTerm')
  })

  it('recurring only: installment read in the month right after the first overpayment', () => {
    const result = compareEffects(decreasing, plan({ recurring: { startMonth: 1, amount: 1000 } }))
    // After month 1: 120k - 1000 - 1000 = 118k -> month 2: 1000 + 1180
    expect(result.shortenTerm.installmentAfterOverpayments).toBeCloseTo(2180, 6)
  })

  it('without overpayments: nothing saved, no winner, first installment shown', () => {
    const result = compareEffects(decreasing, plan({}))
    expect(result.shortenTerm.interestSaved).toBe(0)
    expect(result.lowerInstallment.interestSaved).toBe(0)
    expect(result.better).toBeNull()
    expect(result.shortenTerm.installmentAfterOverpayments).toBeCloseTo(2200, 6)
  })

  it('installment is NaN when the overpayment repays the whole loan', () => {
    const result = compareEffects(decreasing, plan({ oneTime: [{ month: 3, amount: 1_000_000 }] }))
    expect(result.shortenTerm.installmentAfterOverpayments).toBeNaN()
  })
})

describe('describeReferenceInstallment', () => {
  it('names the installment right after the last one-time overpayment', () => {
    expect(describeReferenceInstallment(plan({ oneTime: [{ month: 12, amount: 1 }] }))).toBe(
      'Rata nr 13 (po nadpłacie w racie nr 12)',
    )
  })

  it('names the installment right after the first recurring overpayment', () => {
    expect(describeReferenceInstallment(plan({ recurring: { startMonth: 1, amount: 500 } }))).toBe(
      'Rata nr 2 (po 1. nadpłacie cyklicznej)',
    )
  })

  it('falls back to the first installment without overpayments', () => {
    expect(describeReferenceInstallment(plan({}))).toBe('Pierwsza rata')
  })
})

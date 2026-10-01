import { describe, expect, it } from 'vitest'
import { scheduleTotals, summarizeOverpayments } from './summary'
import type { LoanParams } from './types'

// Same round-number loan as in schedule.test.ts: 1% per month, 1000 principal part.
const decreasing: LoanParams = {
  principal: 120_000,
  annualRatePercent: 12,
  termMonths: 120,
  installmentType: 'decreasing',
}

describe('scheduleTotals', () => {
  it('returns zeros for an empty schedule', () => {
    expect(scheduleTotals([])).toEqual({ months: 0, totalInterest: 0, totalOverpayment: 0, totalPaid: 0 })
  })

  it('totalPaid = principal + interest', () => {
    const summary = summarizeOverpayments(decreasing, { oneTime: [], recurring: null, effect: 'shortenTerm' })
    const totals = summary.withoutOverpayments
    expect(totals.totalPaid).toBeCloseTo(120_000 + totals.totalInterest, 6)
  })
})

describe('summarizeOverpayments', () => {
  it('shortenTerm: saves interest and months', () => {
    const summary = summarizeOverpayments(decreasing, {
      oneTime: [{ month: 10, amount: 10_000 }],
      recurring: null,
      effect: 'shortenTerm',
    })
    expect(summary.withoutOverpayments.totalInterest).toBeCloseTo(72_600, 6)
    expect(summary.withOverpayments.totalInterest).toBeCloseTo(62_050, 6)
    expect(summary.interestSaved).toBeCloseTo(10_550, 6)
    expect(summary.monthsSaved).toBe(10)
    expect(summary.withOverpayments.totalOverpayment).toBe(10_000)
  })

  it('lowerInstallment: saves interest but not months', () => {
    const summary = summarizeOverpayments(decreasing, {
      oneTime: [{ month: 10, amount: 10_000 }],
      recurring: null,
      effect: 'lowerInstallment',
    })
    expect(summary.interestSaved).toBeCloseTo(72_600 - 67_050, 6)
    expect(summary.monthsSaved).toBe(0)
  })

  it('shortening the term saves more interest than lowering the installment', () => {
    const oneTime = [{ month: 10, amount: 10_000 }]
    const shorten = summarizeOverpayments(decreasing, { oneTime, recurring: null, effect: 'shortenTerm' })
    const lower = summarizeOverpayments(decreasing, { oneTime, recurring: null, effect: 'lowerInstallment' })
    expect(shorten.interestSaved).toBeGreaterThan(lower.interestSaved)
  })

  it('saves nothing without overpayments', () => {
    const summary = summarizeOverpayments(decreasing, { oneTime: [], recurring: null, effect: 'shortenTerm' })
    expect(summary.interestSaved).toBe(0)
    expect(summary.monthsSaved).toBe(0)
  })

  it('reports the first installment of the schedule without overpayments', () => {
    const summary = summarizeOverpayments(decreasing, { oneTime: [], recurring: null, effect: 'shortenTerm' })
    // 1000 principal part + 1% of 120k
    expect(summary.firstInstallment).toBeCloseTo(2200, 6)
  })

  it('has NaN as the first installment for an empty schedule', () => {
    const summary = summarizeOverpayments(
      { ...decreasing, principal: NaN },
      { oneTime: [], recurring: null, effect: 'shortenTerm' },
    )
    expect(summary.firstInstallment).toBeNaN()
  })
})

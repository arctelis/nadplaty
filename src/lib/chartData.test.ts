import { describe, expect, it } from 'vitest'
import { balanceSeries, cumulativeInterestSeries, yearlyBreakdown, yearTicks } from './chartData'
import { buildSchedule } from './schedule'
import type { LoanParams, ScheduleRow } from './types'

// Same round-number loan as in schedule.test.ts: 1% per month, 1000 principal part.
const decreasing: LoanParams = {
  principal: 120_000,
  annualRatePercent: 12,
  termMonths: 120,
  installmentType: 'decreasing',
}
const without = buildSchedule(decreasing)
const withOverpayment = buildSchedule(decreasing, {
  oneTime: [{ month: 10, amount: 10_000 }],
  recurring: null,
  effect: 'shortenTerm',
})

describe('balanceSeries', () => {
  const points = balanceSeries(120_000, without, withOverpayment)

  it('starts at the full principal in month 0 for both lines', () => {
    expect(points[0]).toEqual({ month: 0, withoutOverpayments: 120_000, withOverpayments: 120_000 })
  })

  it('has one point per month of the longer schedule', () => {
    expect(points).toHaveLength(121)
    expect(points[120].month).toBe(120)
  })

  it('follows each schedule balance', () => {
    expect(points[10].withoutOverpayments).toBeCloseTo(110_000, 6)
    expect(points[10].withOverpayments).toBeCloseTo(100_000, 6)
  })

  it('ends the shorter line at zero, then null', () => {
    expect(points[110].withOverpayments).toBeCloseTo(0, 6)
    expect(points[111].withOverpayments).toBeNull()
    expect(points[111].withoutOverpayments).toBeCloseTo(9000, 6)
  })

  it('handles an empty schedule', () => {
    expect(balanceSeries(0, [], [])).toEqual([{ month: 0, withoutOverpayments: 0, withOverpayments: 0 }])
  })
})

describe('yearlyBreakdown', () => {
  it('groups months 1–12 into year 1, 13–24 into year 2, and so on', () => {
    const years = yearlyBreakdown(without)
    expect(years).toHaveLength(10)
    expect(years.map((year) => year.year)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('sums principal, interest and overpayments per year', () => {
    const years = yearlyBreakdown(withOverpayment)
    expect(years[0].principal).toBeCloseTo(12_000, 6)
    // Months 1–10: 1% * (120k + ... + 111k); after the overpayment in month 10: 1% * (100k + 99k)
    expect(years[0].interest).toBeCloseTo(11_550 + 1_990, 6)
    expect(years[0].overpayment).toBe(10_000)
    expect(years[1].overpayment).toBe(0)
  })

  it('has a shorter last year when the loan ends mid-year', () => {
    const years = yearlyBreakdown(withOverpayment)
    // 110 months = 9 full years + 2 months
    expect(years).toHaveLength(10)
    expect(years[9].principal).toBeCloseTo(2000, 6)
  })

  it('totals match the whole schedule', () => {
    const years = yearlyBreakdown(withOverpayment)
    const total = (pick: (row: ScheduleRow) => number) => withOverpayment.reduce((sum, row) => sum + pick(row), 0)
    expect(years.reduce((sum, year) => sum + year.interest, 0)).toBeCloseTo(total((row) => row.interestPart), 6)
    expect(years.reduce((sum, year) => sum + year.principal, 0)).toBeCloseTo(total((row) => row.principalPart), 6)
  })

  it('returns no years for an empty schedule', () => {
    expect(yearlyBreakdown([])).toEqual([])
  })
})

describe('yearTicks', () => {
  it('ticks every 5 years for a 30-year loan', () => {
    expect(yearTicks(360)).toEqual([0, 60, 120, 180, 240, 300, 360])
  })

  it('ticks every year for a loan up to 10 years', () => {
    expect(yearTicks(36)).toEqual([0, 12, 24, 36])
  })
})

describe('cumulativeInterestSeries', () => {
  const points = cumulativeInterestSeries(without, withOverpayment)

  it('starts at zero and has one point per month of the longer schedule', () => {
    expect(points[0]).toEqual({ month: 0, withoutOverpayments: 0, withOverpayments: 0 })
    expect(points).toHaveLength(121)
  })

  it('adds up interest month by month', () => {
    // Month 1: 1% of 120k for both
    expect(points[1].withoutOverpayments).toBeCloseTo(1200, 6)
    expect(points[1].withOverpayments).toBeCloseTo(1200, 6)
  })

  it('ends at the total interest of each schedule', () => {
    expect(points[120].withoutOverpayments).toBeCloseTo(72_600, 6)
    expect(points[120].withOverpayments).toBeCloseTo(62_050, 6)
  })

  it('stays flat after the shorter schedule ends', () => {
    expect(points[111].withOverpayments).toBeCloseTo(points[110].withOverpayments, 6)
    expect(points[120].withOverpayments).toBeCloseTo(points[110].withOverpayments, 6)
  })
})

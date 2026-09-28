import type { ScheduleRow } from './types'

export interface BalancePoint {
  month: number
  withoutOverpayments: number | null
  // null after the loan with overpayments is repaid, so the line stops at zero.
  withOverpayments: number | null
}

export interface YearlyBreakdown {
  year: number
  interest: number
  principal: number
  overpayment: number
}

const balanceAt = (principal: number, rows: ScheduleRow[], month: number): number | null => {
  if (month === 0) {
    return principal
  }
  return month <= rows.length ? rows[month - 1].balance : null
}

// One point per month (month 0 = full principal), for both schedules side by side.
export function balanceSeries(
  principal: number,
  withoutOverpayments: ScheduleRow[],
  withOverpayments: ScheduleRow[],
): BalancePoint[] {
  const lastMonth = Math.max(withoutOverpayments.length, withOverpayments.length)
  const points: BalancePoint[] = []

  for (let month = 0; month <= lastMonth; month++) {
    points.push({
      month,
      withoutOverpayments: balanceAt(principal, withoutOverpayments, month),
      withOverpayments: balanceAt(principal, withOverpayments, month),
    })
  }

  return points
}

// Sums of interest, principal and overpayments per loan year (months 1–12 = year 1).
export function yearlyBreakdown(rows: ScheduleRow[]): YearlyBreakdown[] {
  const years: YearlyBreakdown[] = []

  for (const row of rows) {
    const year = Math.ceil(row.month / 12)
    if (years.length < year) {
      years.push({ year, interest: 0, principal: 0, overpayment: 0 })
    }
    const current = years[year - 1]
    current.interest += row.interestPart
    current.principal += row.principalPart
    current.overpayment += row.overpayment
  }

  return years
}

// X-axis ticks on whole years: every 5 years for long loans, every year for short ones.
export function yearTicks(lastMonth: number): number[] {
  const step = lastMonth > 10 * 12 ? 60 : 12
  const ticks: number[] = []
  for (let month = 0; month <= lastMonth; month += step) {
    ticks.push(month)
  }
  return ticks
}

export interface CumulativeInterestPoint {
  month: number
  withoutOverpayments: number
  withOverpayments: number
}

// Interest paid up to and including each month (month 0 = nothing paid yet).
// After a schedule ends, its total stays flat, so the gap between the lines is the saving.
export function cumulativeInterestSeries(
  withoutOverpayments: ScheduleRow[],
  withOverpayments: ScheduleRow[],
): CumulativeInterestPoint[] {
  const lastMonth = Math.max(withoutOverpayments.length, withOverpayments.length)
  const points: CumulativeInterestPoint[] = [{ month: 0, withoutOverpayments: 0, withOverpayments: 0 }]

  for (let month = 1; month <= lastMonth; month++) {
    const previous = points[month - 1]
    points.push({
      month,
      withoutOverpayments: previous.withoutOverpayments + (withoutOverpayments[month - 1]?.interestPart ?? 0),
      withOverpayments: previous.withOverpayments + (withOverpayments[month - 1]?.interestPart ?? 0),
    })
  }

  return points
}

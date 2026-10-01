import { buildSchedule } from './schedule'
import type { LoanParams, OverpaymentPlan, OverpaymentSummary, ScheduleRow, ScheduleTotals } from './types'

export function scheduleTotals(rows: ScheduleRow[]): ScheduleTotals {
  let totalInterest = 0
  let totalOverpayment = 0
  let totalInstallments = 0

  for (const row of rows) {
    totalInterest += row.interestPart
    totalOverpayment += row.overpayment
    totalInstallments += row.installment
  }

  return {
    months: rows.length,
    totalInterest,
    totalOverpayment,
    totalPaid: totalInstallments + totalOverpayment,
  }
}

export function summarizeOverpayments(loan: LoanParams, plan: OverpaymentPlan): OverpaymentSummary {
  const baseRows = buildSchedule(loan)
  const withoutOverpayments = scheduleTotals(baseRows)
  const withOverpayments = scheduleTotals(buildSchedule(loan, plan))

  return {
    withoutOverpayments,
    withOverpayments,
    interestSaved: withoutOverpayments.totalInterest - withOverpayments.totalInterest,
    monthsSaved: withoutOverpayments.months - withOverpayments.months,
    firstInstallment: baseRows.length > 0 ? baseRows[0].installment : NaN,
  }
}

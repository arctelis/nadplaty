import { buildSchedule } from './schedule'
import { scheduleTotals } from './summary'
import type { LoanParams, OverpaymentEffect, OverpaymentPlan, ScheduleRow, ScheduleTotals } from './types'

export interface EffectResult {
  totals: ScheduleTotals
  interestSaved: number
  // NaN when the loan is already repaid at that point.
  installmentAfterOverpayments: number
}

export interface EffectComparison {
  shortenTerm: EffectResult
  lowerInstallment: EffectResult
  // The variant that saves more interest; null when both save the same (e.g. no overpayments).
  better: OverpaymentEffect | null
}

// The month after which we read the "installment after overpayments":
// the last one-time overpayment, or 12 months of recurring overpayments.
// null = no overpayments, so the first installment is shown.
export function referenceMonth(plan: OverpaymentPlan): number | null {
  if (plan.oneTime.length > 0) {
    return Math.max(...plan.oneTime.map((overpayment) => overpayment.month))
  }
  if (plan.recurring !== null) {
    return plan.recurring.startMonth + 11
  }
  return null
}

function installmentAfter(rows: ScheduleRow[], month: number | null): number {
  // rows[month] is the row of the NEXT month (rows are numbered from 1, arrays from 0).
  const row = month === null ? rows[0] : rows[month]
  return row === undefined ? NaN : row.installment
}

export function compareEffects(loan: LoanParams, plan: OverpaymentPlan): EffectComparison {
  const baselineInterest = scheduleTotals(buildSchedule(loan)).totalInterest
  const month = referenceMonth(plan)

  const resultFor = (effect: OverpaymentEffect): EffectResult => {
    const rows = buildSchedule(loan, { ...plan, effect })
    const totals = scheduleTotals(rows)
    return {
      totals,
      interestSaved: baselineInterest - totals.totalInterest,
      installmentAfterOverpayments: installmentAfter(rows, month),
    }
  }

  const shortenTerm = resultFor('shortenTerm')
  const lowerInstallment = resultFor('lowerInstallment')

  let better: OverpaymentEffect | null = null
  if (shortenTerm.interestSaved > lowerInstallment.interestSaved) {
    better = 'shortenTerm'
  } else if (lowerInstallment.interestSaved > shortenTerm.interestSaved) {
    better = 'lowerInstallment'
  }

  return { shortenTerm, lowerInstallment, better }
}

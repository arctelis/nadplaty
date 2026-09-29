import { buildSchedule } from './schedule'
import type { LoanParams, OverpaymentPlan, ScheduleRow } from './types'

// Polish capital gains tax ("podatek Belki").
export const BELKA_TAX_RATE = 0.19
const TIE_THRESHOLD = 1

export interface InvestmentComparison {
  // End of the original loan term: both loans are repaid by then in both scenarios.
  horizonMonths: number
  // Scenario "overpay": overpay the loan, then invest the installment freed after payoff.
  overpayWealth: number
  // Scenario "invest": pay the loan without overpayments, invest the overpayment amounts instead.
  investWealth: number
  // overpayWealth - investWealth: positive = overpaying wins.
  difference: number
  // Differences under 1 zł are treated as a tie.
  winner: 'overpay' | 'invest' | 'tie'
  // How much more the winner has (always >= 0).
  advantage: number
  // Gross yearly return (in %) above which investing wins; null when there is nothing to compare.
  breakEvenGrossRatePercent: number | null
}

// Net monthly return: gross yearly % / 12, reduced by the tax on gains if applied.
// Simplification: tax is taken from each month's gain (like a deposit capitalised monthly).
export function netMonthlyReturn(grossAnnualPercent: number, applyTax: boolean): number {
  return (grossAnnualPercent / 100 / 12) * (applyTax ? 1 - BELKA_TAX_RATE : 1)
}

const paidInMonth = (rows: ScheduleRow[], month: number): number => {
  const row = rows[month - 1]
  return row === undefined ? 0 : row.installment + row.overpayment
}

interface Contributions {
  overpay: number[]
  invest: number[]
}

// Each month both scenarios spend the same budget (the larger of the two loan payments);
// whatever is not paid to the bank goes to the investment.
function monthlyContributions(withoutOverpayments: ScheduleRow[], withOverpayments: ScheduleRow[]): Contributions {
  const horizon = Math.max(withoutOverpayments.length, withOverpayments.length)
  const overpay: number[] = []
  const invest: number[] = []

  for (let month = 1; month <= horizon; month++) {
    const paidOverpaying = paidInMonth(withOverpayments, month)
    const paidInvesting = paidInMonth(withoutOverpayments, month)
    const budget = Math.max(paidOverpaying, paidInvesting)
    overpay.push(budget - paidOverpaying)
    invest.push(budget - paidInvesting)
  }

  return { overpay, invest }
}

// Value at the end of the horizon of monthly contributions (paid at the end of each month).
function futureValue(contributions: number[], monthlyReturn: number): number {
  let value = 0
  for (const contribution of contributions) {
    value = value * (1 + monthlyReturn) + contribution
  }
  return value
}

function differenceAt(contributions: Contributions, monthlyReturn: number): number {
  return futureValue(contributions.overpay, monthlyReturn) - futureValue(contributions.invest, monthlyReturn)
}

// Net monthly return at which both scenarios end equal (bisection; the difference falls as the return grows).
function breakEvenMonthlyReturn(contributions: Contributions): number | null {
  let low = 0
  let high = 1 // 100% per month — far above any realistic return
  if (differenceAt(contributions, low) <= 0 || differenceAt(contributions, high) >= 0) {
    return null
  }
  for (let i = 0; i < 100; i++) {
    const middle = (low + high) / 2
    if (differenceAt(contributions, middle) > 0) {
      low = middle
    } else {
      high = middle
    }
  }
  return (low + high) / 2
}

export function compareOverpayingWithInvesting(
  loan: LoanParams,
  plan: OverpaymentPlan,
  grossAnnualReturnPercent: number,
  applyTax: boolean,
): InvestmentComparison {
  const withoutOverpayments = buildSchedule(loan)
  const withOverpayments = buildSchedule(loan, plan)
  const contributions = monthlyContributions(withoutOverpayments, withOverpayments)
  const monthlyReturn = netMonthlyReturn(grossAnnualReturnPercent, applyTax)

  const overpayWealth = futureValue(contributions.overpay, monthlyReturn)
  const investWealth = futureValue(contributions.invest, monthlyReturn)
  const breakEven = breakEvenMonthlyReturn(contributions)

  const difference = overpayWealth - investWealth
  let winner: InvestmentComparison['winner'] = 'tie'
  if (difference >= TIE_THRESHOLD) {
    winner = 'overpay'
  } else if (difference <= -TIE_THRESHOLD) {
    winner = 'invest'
  }

  return {
    horizonMonths: contributions.overpay.length,
    overpayWealth,
    investWealth,
    difference,
    winner,
    advantage: Math.abs(difference),
    breakEvenGrossRatePercent:
      breakEven === null ? null : (breakEven * 12 * 100) / (applyTax ? 1 - BELKA_TAX_RATE : 1),
  }
}

// Raw text from the "invest instead" inputs, like LoanFormValues.
export interface InvestFormValues {
  grossAnnualReturnPercent: string
  applyTax: boolean
}

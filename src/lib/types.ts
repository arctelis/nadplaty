export type InstallmentType = 'equal' | 'decreasing'

// What the bank does after an overpayment: keep the installment and end the loan
// earlier, or keep the end date and lower the installment.
export type OverpaymentEffect = 'shortenTerm' | 'lowerInstallment'

export interface LoanParams {
  principal: number
  annualRatePercent: number
  termMonths: number
  installmentType: InstallmentType
}

// Paid in the given month, right after that month's regular installment.
export interface OneTimeOverpayment {
  month: number
  amount: number
}

// Paid every month, starting from startMonth, right after the regular installment.
export interface RecurringOverpayment {
  startMonth: number
  amount: number
}

export interface OverpaymentPlan {
  oneTime: OneTimeOverpayment[]
  recurring: RecurringOverpayment | null
  effect: OverpaymentEffect
}

export interface ScheduleRow {
  month: number
  // Regular installment = principalPart + interestPart (without the overpayment).
  installment: number
  principalPart: number
  interestPart: number
  overpayment: number
  // Balance left after the installment and the overpayment.
  balance: number
}

export interface ScheduleTotals {
  months: number
  totalInterest: number
  totalOverpayment: number
  // Everything paid to the bank: installments + overpayments.
  totalPaid: number
}

export interface OverpaymentSummary {
  withoutOverpayments: ScheduleTotals
  withOverpayments: ScheduleTotals
  interestSaved: number
  monthsSaved: number
  // NaN when the schedule is empty (e.g. invalid input).
  firstInstallment: number
}

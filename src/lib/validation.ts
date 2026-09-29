import { formatInstallmentCount } from './format'
import { parseDecimal, type LoanFormValues } from './loanForm'
import type { OverpaymentFormValues } from './overpaymentForm'

// Error messages keyed by field. A missing key means the field is fine.
export interface LoanFormErrors {
  principal?: string
  annualRatePercent?: string
  // Years and months are one question for the user, so they share one message.
  term?: string
}

export interface OneTimeRowErrors {
  month?: string
  amount?: string
}

export interface OverpaymentFormErrors {
  recurringAmount?: string
  recurringStartMonth?: string
  // Keyed by row id, so errors stay with their row after another one is removed.
  oneTime: Record<number, OneTimeRowErrors>
}

const MAX_PRINCIPAL = 100_000_000
const MAX_RATE_PERCENT = 30
const MAX_TERM_MONTHS = 50 * 12

const isBlank = (text: string): boolean => text.trim() === ''
const isWholeNumber = (value: number): boolean => Number.isInteger(value) && value >= 0

function principalError(text: string): string | undefined {
  if (isBlank(text)) return 'Podaj kwotę kredytu.'
  const value = parseDecimal(text)
  if (Number.isNaN(value)) return 'Wpisz liczbę, np. 300 000.'
  if (value <= 0) return 'Kwota musi być większa od zera.'
  if (value > MAX_PRINCIPAL) return 'Maksymalnie 100 mln zł.'
  return undefined
}

function rateError(text: string): string | undefined {
  if (isBlank(text)) return 'Podaj oprocentowanie.'
  const value = parseDecimal(text)
  if (Number.isNaN(value)) return 'Wpisz liczbę, np. 7,5.'
  if (value < 0) return 'Oprocentowanie nie może być ujemne.'
  if (value > MAX_RATE_PERCENT) return `Maksymalnie ${MAX_RATE_PERCENT}% — sprawdź, czy to nie pomyłka.`
  return undefined
}

function termError(yearsText: string, monthsText: string): string | undefined {
  const years = isBlank(yearsText) ? 0 : parseDecimal(yearsText)
  const months = isBlank(monthsText) ? 0 : parseDecimal(monthsText)
  if (!isWholeNumber(years)) return 'Wpisz pełne lata, np. 25.'
  if (!isWholeNumber(months) || months > 11) return 'Wpisz 0–11 miesięcy, resztę podaj w latach.'
  const total = years * 12 + months
  if (total < 1) return 'Okres musi mieć co najmniej 1 miesiąc.'
  if (total > MAX_TERM_MONTHS) return 'Maksymalnie 50 lat.'
  return undefined
}

export function validateLoanForm(values: LoanFormValues): LoanFormErrors {
  const errors: LoanFormErrors = {}
  const principal = principalError(values.principal)
  const rate = rateError(values.annualRatePercent)
  const term = termError(values.termYears, values.termMonths)
  if (principal) errors.principal = principal
  if (rate) errors.annualRatePercent = rate
  if (term) errors.term = term
  return errors
}

function amountError(text: string): string | undefined {
  const value = parseDecimal(text)
  if (Number.isNaN(value)) return 'Wpisz liczbę.'
  if (value <= 0) return 'Kwota musi być większa od zera.'
  return undefined
}

// termMonths is NaN when the loan term itself is invalid; then the range check is skipped.
function installmentNumberError(text: string, termMonths: number): string | undefined {
  const value = parseDecimal(text)
  if (!Number.isInteger(value) || value < 1) return 'Wpisz numer raty (1 lub więcej).'
  if (Number.isFinite(termMonths) && value > termMonths) return `Kredyt ma ${formatInstallmentCount(termMonths)}.`
  return undefined
}

export function validateOverpaymentForm(values: OverpaymentFormValues, termMonths: number): OverpaymentFormErrors {
  const errors: OverpaymentFormErrors = { oneTime: {} }

  // Recurring: an empty amount simply means "no recurring overpayment".
  if (!isBlank(values.recurringAmount)) {
    const amount = amountError(values.recurringAmount)
    if (amount) errors.recurringAmount = amount
  }
  if (!isBlank(values.recurringStartMonth)) {
    const start = installmentNumberError(values.recurringStartMonth, termMonths)
    if (start) errors.recurringStartMonth = start
  }

  for (const row of values.oneTime) {
    // A completely empty row is just not filled in yet — no error.
    if (isBlank(row.month) && isBlank(row.amount)) continue
    const rowErrors: OneTimeRowErrors = {}
    const month = isBlank(row.month) ? 'Podaj numer raty.' : installmentNumberError(row.month, termMonths)
    const amount = isBlank(row.amount) ? 'Podaj kwotę.' : amountError(row.amount)
    if (month) rowErrors.month = month
    if (amount) rowErrors.amount = amount
    if (month || amount) errors.oneTime[row.id] = rowErrors
  }

  return errors
}

export function hasLoanErrors(errors: LoanFormErrors): boolean {
  return Object.keys(errors).length > 0
}

export function hasOverpaymentErrors(errors: OverpaymentFormErrors): boolean {
  return (
    errors.recurringAmount !== undefined ||
    errors.recurringStartMonth !== undefined ||
    Object.keys(errors.oneTime).length > 0
  )
}

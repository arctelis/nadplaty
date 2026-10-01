// Formatters are created once and reused — building an Intl formatter is relatively slow.
const plnFormatter = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })
const percentFormatter = new Intl.NumberFormat('pl-PL', { style: 'percent', maximumFractionDigits: 2 })
const pluralRules = new Intl.PluralRules('pl-PL')

export function formatPLN(amount: number): string {
  return plnFormatter.format(amount)
}

// Takes percent as used in LoanParams (7.5 means 7.5%).
export function formatPercent(percent: number): string {
  return percentFormatter.format(percent / 100)
}

// Polish has three plural forms: 1 miesiąc, 2 miesiące, 5 miesięcy.
const MONTH_FORMS: Record<Intl.LDMLPluralRule, string> = {
  zero: 'miesięcy',
  one: 'miesiąc',
  two: 'miesiące',
  few: 'miesiące',
  many: 'miesięcy',
  other: 'miesiąca',
}

export function formatMonths(months: number): string {
  return `${months} ${MONTH_FORMS[pluralRules.select(months)]}`
}

const compactFormatter = new Intl.NumberFormat('pl-PL', { notation: 'compact', maximumFractionDigits: 1 })

// Short amounts for chart axes: 300 tys. zł, 1,3 mln zł.
export function formatCompactPLN(amount: number): string {
  return `${compactFormatter.format(amount)} zł`
}

const YEAR_FORMS: Record<Intl.LDMLPluralRule, string> = {
  zero: 'lat',
  one: 'rok',
  two: 'lata',
  few: 'lata',
  many: 'lat',
  other: 'roku',
}

// 68 -> "5 lat 8 miesięcy", 12 -> "1 rok", 7 -> "7 miesięcy".
export function formatDuration(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  const parts: string[] = []

  if (years > 0) {
    parts.push(`${years} ${YEAR_FORMS[pluralRules.select(years)]}`)
  }
  if (months > 0 || years === 0) {
    parts.push(formatMonths(months))
  }
  return parts.join(' ')
}

// Month 27 -> "Rok 3, rata nr 27" (for chart tooltips).
export function formatLoanMonth(month: number): string {
  return month === 0 ? 'Start kredytu' : `Rok ${Math.ceil(month / 12)}, rata nr ${month}`
}

// X-axis tick for a month on a whole year: 60 -> "5 r.".
export function formatYearTick(month: number): string {
  return `${month / 12} r.`
}

const INSTALLMENT_FORMS: Record<Intl.LDMLPluralRule, string> = {
  zero: 'rat',
  one: 'rata',
  two: 'raty',
  few: 'raty',
  many: 'rat',
  other: 'raty',
}

// 1 rata, 22 raty, 360 rat.
export function formatInstallmentCount(count: number): string {
  return `${count} ${INSTALLMENT_FORMS[pluralRules.select(count)]}`
}

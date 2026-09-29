import { describe, expect, it } from 'vitest'
import {
  formatCompactPLN,
  formatDuration,
  formatInstallmentCount,
  formatLoanMonth,
  formatMonths,
  formatPercent,
  formatPLN,
  formatYearTick,
} from './format'

// Intl uses a non-breaking space (U+00A0) as the thousands separator and before "zł".
const NBSP = ' '

describe('formatPLN', () => {
  it('rounds to grosze and adds the currency', () => {
    expect(formatPLN(12_345.678)).toBe(`12${NBSP}345,68${NBSP}zł`)
  })

  it('does not group 4-digit amounts (Polish typography rule)', () => {
    expect(formatPLN(1234.5)).toBe(`1234,50${NBSP}zł`)
  })

  it('formats zero', () => {
    expect(formatPLN(0)).toBe(`0,00${NBSP}zł`)
  })
})

describe('formatPercent', () => {
  it('uses a decimal comma', () => {
    expect(formatPercent(7.5)).toBe('7,5%')
  })

  it('keeps at most two decimals', () => {
    expect(formatPercent(6.789)).toBe('6,79%')
  })
})

describe('formatMonths', () => {
  it.each([
    [1, '1 miesiąc'],
    [2, '2 miesiące'],
    [4, '4 miesiące'],
    [5, '5 miesięcy'],
    [12, '12 miesięcy'],
    [22, '22 miesiące'],
    [25, '25 miesięcy'],
    [0, '0 miesięcy'],
  ])('%i -> %s', (months, expected) => {
    expect(formatMonths(months)).toBe(expected)
  })
})

describe('formatCompactPLN', () => {
  it.each([
    [0, '0 zł'],
    [950, '950 zł'],
    [20_000, '20 tys. zł'],
    [300_000, '300 tys. zł'],
    [1_250_000, '1,3 mln zł'],
  ])('%d -> %s', (amount, expected) => {
    expect(formatCompactPLN(amount).replace(/ /g, ' ')).toBe(expected)
  })
})

describe('formatDuration', () => {
  it.each([
    [0, '0 miesięcy'],
    [7, '7 miesięcy'],
    [12, '1 rok'],
    [14, '1 rok 2 miesiące'],
    [24, '2 lata'],
    [68, '5 lat 8 miesięcy'],
    [265, '22 lata 1 miesiąc'],
  ])('%i -> %s', (months, expected) => {
    expect(formatDuration(months)).toBe(expected)
  })
})

describe('formatLoanMonth', () => {
  it.each([
    [0, 'Start kredytu'],
    [1, 'Rok 1, rata nr 1'],
    [12, 'Rok 1, rata nr 12'],
    [13, 'Rok 2, rata nr 13'],
  ])('%i -> %s', (month, expected) => {
    expect(formatLoanMonth(month)).toBe(expected)
  })
})

describe('formatYearTick', () => {
  it('shows whole years', () => {
    expect(formatYearTick(0)).toBe('0 r.')
    expect(formatYearTick(60)).toBe('5 r.')
  })
})

describe('formatInstallmentCount', () => {
  it.each([
    [1, '1 rata'],
    [2, '2 raty'],
    [22, '22 raty'],
    [25, '25 rat'],
    [360, '360 rat'],
  ])('%i -> %s', (count, expected) => {
    expect(formatInstallmentCount(count)).toBe(expected)
  })
})

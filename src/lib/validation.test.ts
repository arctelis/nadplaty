import { describe, expect, it } from 'vitest'
import type { LoanFormValues } from './loanForm'
import type { OverpaymentFormValues } from './overpaymentForm'
import {
  hasLoanErrors,
  hasOverpaymentErrors,
  validateLoanForm,
  validateOverpaymentForm,
  validateReturnRate,
} from './validation'

const validLoan: LoanFormValues = {
  principal: '300 000',
  annualRatePercent: '7,5',
  termYears: '30',
  termMonths: '0',
  installmentType: 'equal',
}

describe('validateLoanForm', () => {
  it('accepts a valid loan', () => {
    const errors = validateLoanForm(validLoan)
    expect(errors).toEqual({})
    expect(hasLoanErrors(errors)).toBe(false)
  })

  it.each([
    ['', 'Podaj kwotę kredytu.'],
    ['abc', 'Wpisz liczbę, np. 300 000.'],
    ['-5000', 'Kwota musi być większa od zera.'],
    ['0', 'Kwota musi być większa od zera.'],
    ['200 000 000', 'Maksymalnie 100 mln zł.'],
  ])('principal "%s" -> %s', (principal, message) => {
    expect(validateLoanForm({ ...validLoan, principal }).principal).toBe(message)
  })

  it.each([
    ['', 'Podaj oprocentowanie.'],
    ['x', 'Wpisz liczbę, np. 7,5.'],
    ['-1', 'Oprocentowanie nie może być ujemne.'],
    ['500', 'Maksymalnie 30% — sprawdź, czy to nie pomyłka.'],
  ])('rate "%s" -> %s', (annualRatePercent, message) => {
    expect(validateLoanForm({ ...validLoan, annualRatePercent }).annualRatePercent).toBe(message)
  })

  it('accepts a 0% and a 30% rate', () => {
    expect(validateLoanForm({ ...validLoan, annualRatePercent: '0' })).toEqual({})
    expect(validateLoanForm({ ...validLoan, annualRatePercent: '30' })).toEqual({})
  })

  it.each([
    ['1', '15', 'Wpisz 0–11 miesięcy, resztę podaj w latach.'],
    ['1', '-1', 'Wpisz 0–11 miesięcy, resztę podaj w latach.'],
    ['2,5', '0', 'Wpisz pełne lata, np. 25.'],
    ['abc', '0', 'Wpisz pełne lata, np. 25.'],
    ['0', '0', 'Okres musi mieć co najmniej 1 miesiąc.'],
    ['', '', 'Okres musi mieć co najmniej 1 miesiąc.'],
    ['51', '0', 'Maksymalnie 50 lat.'],
  ])('term %s years %s months -> %s', (termYears, termMonths, message) => {
    expect(validateLoanForm({ ...validLoan, termYears, termMonths }).term).toBe(message)
  })

  it('accepts an empty years or months field as 0', () => {
    expect(validateLoanForm({ ...validLoan, termYears: '', termMonths: '6' })).toEqual({})
    expect(validateLoanForm({ ...validLoan, termYears: '25', termMonths: '' })).toEqual({})
  })
})

const emptyOverpayments: OverpaymentFormValues = {
  effect: 'shortenTerm',
  recurringAmount: '',
  recurringStartMonth: '',
  oneTime: [],
}

describe('validateOverpaymentForm', () => {
  it('accepts an empty form', () => {
    const errors = validateOverpaymentForm(emptyOverpayments, 360)
    expect(errors).toEqual({ oneTime: {} })
    expect(hasOverpaymentErrors(errors)).toBe(false)
  })

  it('checks the recurring amount and start month', () => {
    const errors = validateOverpaymentForm(
      { ...emptyOverpayments, recurringAmount: '-500', recurringStartMonth: '400' },
      360,
    )
    expect(errors.recurringAmount).toBe('Kwota musi być większa od zera.')
    expect(errors.recurringStartMonth).toBe('Kredyt ma 360 rat.')
    expect(hasOverpaymentErrors(errors)).toBe(true)
  })

  it('ignores completely empty one-time rows', () => {
    const errors = validateOverpaymentForm(
      { ...emptyOverpayments, oneTime: [{ id: 1, month: '', amount: '' }] },
      360,
    )
    expect(hasOverpaymentErrors(errors)).toBe(false)
  })

  it('reports errors per one-time row, keyed by row id', () => {
    const errors = validateOverpaymentForm(
      {
        ...emptyOverpayments,
        oneTime: [
          { id: 1, month: '12', amount: '20 000' },
          { id: 5, month: '', amount: '1000' },
          { id: 7, month: '0', amount: 'abc' },
          { id: 9, month: '500', amount: '100' },
        ],
      },
      360,
    )
    expect(errors.oneTime).toEqual({
      5: { month: 'Podaj numer raty.' },
      7: { month: 'Wpisz numer raty (1 lub więcej).', amount: 'Wpisz liczbę.' },
      9: { month: 'Kredyt ma 360 rat.' },
    })
  })

  it('skips the range check when the loan term is invalid', () => {
    const errors = validateOverpaymentForm(
      { ...emptyOverpayments, oneTime: [{ id: 1, month: '500', amount: '100' }] },
      NaN,
    )
    expect(hasOverpaymentErrors(errors)).toBe(false)
  })
})

it('uses the right Polish form of "rata" for the loan length', () => {
  const errors = validateOverpaymentForm({ ...emptyOverpayments, recurringStartMonth: '30' }, 22)
  expect(errors.recurringStartMonth).toBe('Kredyt ma 22 raty.')
})

describe('validateReturnRate', () => {
  it.each([
    ['5', undefined],
    ['0', undefined],
    ['', 'Podaj oprocentowanie lokaty lub obligacji.'],
    ['abc', 'Wpisz liczbę, np. 5.'],
    ['-2', 'Stopa nie może być ujemna.'],
    ['40', 'Maksymalnie 30%.'],
  ])('"%s" -> %s', (text, expected) => {
    expect(validateReturnRate(text)).toBe(expected)
  })
})

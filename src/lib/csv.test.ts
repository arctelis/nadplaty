import { describe, expect, it } from 'vitest'
import { csvNumber, schedulesToCsv } from './csv'
import { buildSchedule } from './schedule'
import type { LoanParams } from './types'

describe('csvNumber', () => {
  it.each([
    [2097.6435, '2097,64'],
    [300_000, '300000,00'],
    [0.005, '0,01'],
    [-0.0000001, '0,00'],
    [0, '0,00'],
  ])('%d -> %s', (value, expected) => {
    expect(csvNumber(value)).toBe(expected)
  })
})

describe('schedulesToCsv', () => {
  // 1% per month, 1000 principal part; overpayment of 1000 in month 1 ends the loan a month early.
  const loan: LoanParams = { principal: 3000, annualRatePercent: 12, termMonths: 3, installmentType: 'decreasing' }
  const csv = schedulesToCsv(
    buildSchedule(loan),
    buildSchedule(loan, { oneTime: [{ month: 1, amount: 1000 }], recurring: null, effect: 'shortenTerm' }),
  )
  const lines = csv.replace('﻿', '').split('\r\n')

  it('starts with a BOM so Excel reads Polish characters', () => {
    expect(csv.startsWith('﻿')).toBe(true)
  })

  it('has a header with both variants, separated by semicolons', () => {
    expect(lines[0].split(';')).toHaveLength(11)
    expect(lines[0]).toContain('Z nadpłatami: nadpłata')
  })

  it('writes one line per installment with decimal commas', () => {
    expect(lines[1]).toBe('1;1;1030,00;1000,00;30,00;2000,00;1030,00;1000,00;30,00;1000,00;1000,00')
    expect(lines[2]).toBe('2;1;1020,00;1000,00;20,00;1000,00;1010,00;1000,00;10,00;0,00;0,00')
  })

  it('leaves the cells of an already repaid schedule empty', () => {
    expect(lines[3]).toBe('3;1;1010,00;1000,00;10,00;0,00;;;;;')
  })

  it('ends with a line break and has no extra lines', () => {
    expect(csv.endsWith('\r\n')).toBe(true)
    expect(lines).toHaveLength(5) // header + 3 months + empty string after the last line break
  })
})

import type { ScheduleRow } from './types'

// Byte order mark: tells Excel the file is UTF-8, so "ł", "ę" etc. display correctly.
const BOM = '﻿'
// Polish Excel expects a semicolon between columns (the comma is the decimal separator).
const SEPARATOR = ';'
const LINE_BREAK = '\r\n'

const HEADER = [
  'Nr raty',
  'Rok',
  'Bez nadpłat: rata',
  'Bez nadpłat: kapitał',
  'Bez nadpłat: odsetki',
  'Bez nadpłat: saldo',
  'Z nadpłatami: rata',
  'Z nadpłatami: kapitał',
  'Z nadpłatami: odsetki',
  'Z nadpłatami: nadpłata',
  'Z nadpłatami: saldo',
]

// 2097.6435 -> "2097,64". No thousands separator, so Excel reads it as a number.
export function csvNumber(value: number): string {
  // Avoid "-0,00" for floating-point dust like -0.0000001.
  const rounded = Math.abs(value) < 0.005 ? 0 : value
  return rounded.toFixed(2).replace('.', ',')
}

function rowCells(row: ScheduleRow | undefined, withOverpayment: boolean): string[] {
  if (row === undefined) {
    // This schedule has already ended: leave its cells empty.
    return withOverpayment ? ['', '', '', '', ''] : ['', '', '', '']
  }
  const cells = [csvNumber(row.installment), csvNumber(row.principalPart), csvNumber(row.interestPart)]
  if (withOverpayment) {
    cells.push(csvNumber(row.overpayment))
  }
  cells.push(csvNumber(row.balance))
  return cells
}

// Both schedules side by side, one line per installment number.
export function schedulesToCsv(withoutOverpayments: ScheduleRow[], withOverpayments: ScheduleRow[]): string {
  const lastMonth = Math.max(withoutOverpayments.length, withOverpayments.length)
  const lines = [HEADER.join(SEPARATOR)]

  for (let month = 1; month <= lastMonth; month++) {
    const cells = [
      String(month),
      String(Math.ceil(month / 12)),
      ...rowCells(withoutOverpayments[month - 1], false),
      ...rowCells(withOverpayments[month - 1], true),
    ]
    lines.push(cells.join(SEPARATOR))
  }

  return BOM + lines.join(LINE_BREAK) + LINE_BREAK
}

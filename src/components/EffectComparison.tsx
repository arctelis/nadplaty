import type { EffectComparison as Comparison, EffectResult } from '../lib/comparison'
import { formatDuration, formatPLN } from '../lib/format'
import type { OverpaymentEffect } from '../lib/types'

interface EffectComparisonProps {
  comparison: Comparison
  selected: OverpaymentEffect
}

const COLUMNS: { effect: OverpaymentEffect; label: string }[] = [
  { effect: 'shortenTerm', label: 'Skrócić okres' },
  { effect: 'lowerInstallment', label: 'Obniżyć ratę' },
]

const ROWS: { label: string; value: (result: EffectResult) => string; markBetter?: boolean }[] = [
  { label: 'Odsetki łącznie', value: (result) => formatPLN(result.totals.totalInterest) },
  { label: 'Oszczędność', value: (result) => formatPLN(result.interestSaved), markBetter: true },
  { label: 'Spłata po', value: (result) => formatDuration(result.totals.months) },
  {
    label: 'Rata po nadpłatach',
    value: (result) =>
      Number.isFinite(result.installmentAfterOverpayments) ? formatPLN(result.installmentAfterOverpayments) : 'spłacony',
  },
]

function EffectComparison({ comparison, selected }: EffectComparisonProps) {
  return (
    <section className="card comparison-card">
      <p className="eyebrow">Porównanie wariantów</p>
      <h2 className="card-title">Skrócić okres czy obniżyć ratę?</h2>

      <table className="comparison-table">
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">Wynik</span>
            </th>
            {COLUMNS.map((column) => (
              <th key={column.effect} scope="col" className={column.effect === selected ? 'is-selected' : undefined}>
                {column.label}
                {column.effect === selected && <span className="selected-tag">wybrany</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {COLUMNS.map((column) => (
                <td key={column.effect} className={column.effect === selected ? 'is-selected' : undefined}>
                  {row.value(comparison[column.effect])}
                  {row.markBetter && comparison.better === column.effect && (
                    <span className="better-mark" aria-label="większa oszczędność">
                      {' '}
                      ✓
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default EffectComparison

import { formatDuration, formatPercent, formatPLN } from '../lib/format'
import type { InvestFormValues, InvestmentComparison } from '../lib/investing'
import FieldError from './FieldError'

interface InvestComparisonProps {
  values: InvestFormValues
  error: string | undefined
  // null when the rate is invalid, so there is no result to show.
  result: InvestmentComparison | null
  hasOverpayments: boolean
  onChange: (values: InvestFormValues) => void
}

function headline(result: InvestmentComparison | null, hasOverpayments: boolean): string {
  if (!hasOverpayments) return 'Dodaj nadpłatę, żeby porównać'
  if (result === null) return 'Popraw stopę zwrotu'
  if (result.winner === 'overpay') return `Nadpłata wygrywa o ${formatPLN(result.advantage)}`
  if (result.winner === 'invest') return `Inwestowanie wygrywa o ${formatPLN(result.advantage)}`
  return 'Remis — oba warianty wychodzą tak samo'
}

function InvestComparison({ values, error, result, hasOverpayments, onChange }: InvestComparisonProps) {
  const showNumbers = hasOverpayments && result !== null

  return (
    <section className="card invest-card">
      <p className="eyebrow">Nadpłacać czy inwestować?</p>
      <h2 className="card-title">{headline(result, hasOverpayments)}</h2>

      <div className="invest-inputs">
        <label className="field">
          <span className="field-label">Lokata lub obligacje, oprocentowanie brutto</span>
          <span className={error ? 'input-wrap has-error' : 'input-wrap'}>
            <input
              inputMode="decimal"
              aria-invalid={error !== undefined}
              value={values.grossAnnualReturnPercent}
              onChange={(event) => onChange({ ...values, grossAnnualReturnPercent: event.target.value })}
            />
            <span className="suffix">% rocznie</span>
          </span>
          <FieldError message={error} />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={values.applyTax}
            onChange={(event) => onChange({ ...values, applyTax: event.target.checked })}
          />
          <span>Odlicz podatek Belki (19%)</span>
        </label>
      </div>

      {showNumbers && (
        <>
          <dl className="result-stats">
            <div>
              <dt>Nadpłacam, potem odkładam ratę</dt>
              <dd>{formatPLN(result.overpayWealth)}</dd>
            </div>
            <div>
              <dt>Odkładam kwoty nadpłat</dt>
              <dd>{formatPLN(result.investWealth)}</dd>
            </div>
          </dl>
          <p className="invest-note">
            Majątek po {formatDuration(result.horizonMonths)}, przy tym samym miesięcznym budżecie w obu wariantach.
            {result.breakEvenGrossRatePercent !== null &&
              ` Inwestowanie wygrywa dopiero powyżej ${formatPercent(result.breakEvenGrossRatePercent)} brutto rocznie.`}
          </p>
        </>
      )}
    </section>
  )
}

export default InvestComparison

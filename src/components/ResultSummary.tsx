import { formatDuration, formatMonths, formatPercent, formatPLN } from '../lib/format'
import type { LoanParams, OverpaymentSummary } from '../lib/types'

interface ResultSummaryProps {
  loan: LoanParams
  summary: OverpaymentSummary
}

// Shows a formatted amount, or a dash when the value cannot be computed (invalid input).
const amountOrDash = (amount: number): string => (Number.isFinite(amount) ? formatPLN(amount) : '—')

function ResultSummary({ loan, summary }: ResultSummaryProps) {
  return (
    <aside className="card result-panel">
      <p className="eyebrow">Pierwsza rata</p>
      <p className="result-amount">{amountOrDash(summary.firstInstallment)}</p>
      <p className="result-meta">
        {loan.installmentType === 'equal' ? 'Raty równe' : 'Raty malejące'}
        {Number.isFinite(loan.termMonths) && ` · ${formatMonths(loan.termMonths)}`}
        {Number.isFinite(loan.annualRatePercent) && ` · ${formatPercent(loan.annualRatePercent)}`}
      </p>

      <hr className="divider" />

      <p className="eyebrow">Oszczędność na odsetkach</p>
      <p className="result-amount">{amountOrDash(summary.interestSaved)}</p>

      <dl className="result-stats">
        <div>
          <dt>Kredyt krótszy o</dt>
          <dd>{summary.monthsSaved > 0 ? formatDuration(summary.monthsSaved) : '—'}</dd>
        </div>
        <div>
          <dt>Suma nadpłat</dt>
          <dd>{amountOrDash(summary.withOverpayments.totalOverpayment)}</dd>
        </div>
        <div>
          <dt>Łącznie zapłacisz bankowi</dt>
          <dd>{amountOrDash(summary.withOverpayments.totalPaid)}</dd>
        </div>
      </dl>
    </aside>
  )
}

export default ResultSummary

import { useState } from 'react'
import BalanceChart from './components/BalanceChart'
import CumulativeInterestChart from './components/CumulativeInterestChart'
import EffectComparison from './components/EffectComparison'
import LoanForm from './components/LoanForm'
import OverpaymentForm from './components/OverpaymentForm'
import PaymentStructureChart from './components/PaymentStructureChart'
import ScheduleExport from './components/ScheduleExport'
import { balanceSeries, cumulativeInterestSeries, yearlyBreakdown } from './lib/chartData'
import { compareEffects } from './lib/comparison'
import { formatMonths, formatPercent, formatPLN } from './lib/format'
import { toLoanParams, type LoanFormValues } from './lib/loanForm'
import { toOverpaymentPlan, type OverpaymentFormValues } from './lib/overpaymentForm'
import { buildSchedule } from './lib/schedule'
import { summarizeOverpayments } from './lib/summary'

const DEFAULT_VALUES: LoanFormValues = {
  principal: '300 000',
  annualRatePercent: '7,5',
  termYears: '30',
  termMonths: '0',
  installmentType: 'equal',
}

const DEFAULT_OVERPAYMENTS: OverpaymentFormValues = {
  effect: 'shortenTerm',
  recurringAmount: '',
  recurringStartMonth: '',
  oneTime: [{ id: 1, month: '12', amount: '20 000' }],
}

function App() {
  const [values, setValues] = useState<LoanFormValues>(DEFAULT_VALUES)
  const [overpayments, setOverpayments] = useState<OverpaymentFormValues>(DEFAULT_OVERPAYMENTS)

  const loan = toLoanParams(values)
  const plan = toOverpaymentPlan(overpayments)
  const schedule = buildSchedule(loan)
  const scheduleWithOverpayments = buildSchedule(loan, plan)
  const firstInstallment = schedule.length > 0 ? schedule[0].installment : NaN
  const summary = summarizeOverpayments(loan, plan)
  const canShowCharts = schedule.length > 0 && Number.isFinite(summary.withOverpayments.totalPaid)

  return (
    <>
      <header className="site-header">
        <div className="container">
          <span className="brand">Nadpłata</span>
        </div>
      </header>

      <main className="container hero">
        <section className="hero-intro">
          <p className="eyebrow">Kalkulator nadpłaty kredytu</p>
          <h1>Ile zaoszczędzisz, nadpłacając kredyt?</h1>
          <p className="lead">
            Wpisz parametry kredytu i planowane nadpłaty. Zobaczysz, ile odsetek nie oddasz bankowi.
          </p>
          <div className="stack">
            <LoanForm values={values} onChange={setValues} />
            <OverpaymentForm values={overpayments} onChange={setOverpayments} />
          </div>
        </section>

        <div className="results-column">
          <aside className="card result-panel">
            <p className="eyebrow">Pierwsza rata</p>
            <p className="result-amount">
              {Number.isFinite(firstInstallment) ? formatPLN(firstInstallment) : '—'}
            </p>
            <p className="result-meta">
              {values.installmentType === 'equal' ? 'Raty równe' : 'Raty malejące'}
              {Number.isFinite(loan.termMonths) && ` · ${formatMonths(loan.termMonths)}`}
              {Number.isFinite(loan.annualRatePercent) && ` · ${formatPercent(loan.annualRatePercent)}`}
            </p>

            <hr className="divider" />

            <p className="eyebrow">Oszczędność na odsetkach</p>
            <p className="result-amount">
              {Number.isFinite(summary.interestSaved) ? formatPLN(summary.interestSaved) : '—'}
            </p>
          </aside>

          {canShowCharts && (
            <>
              <EffectComparison comparison={compareEffects(loan, plan)} selected={plan.effect} />
              <BalanceChart
                points={balanceSeries(loan.principal, schedule, scheduleWithOverpayments)}
                payoffMonth={scheduleWithOverpayments.length}
                monthsSaved={summary.monthsSaved}
              />
              <CumulativeInterestChart
                points={cumulativeInterestSeries(schedule, scheduleWithOverpayments)}
                interestSaved={summary.interestSaved}
              />
              <PaymentStructureChart years={yearlyBreakdown(scheduleWithOverpayments)} />
              <ScheduleExport withoutOverpayments={schedule} withOverpayments={scheduleWithOverpayments} />
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default App

import type { LoanFormValues } from '../lib/loanForm'
import type { LoanFormErrors } from '../lib/validation'
import FieldError from './FieldError'

interface LoanFormProps {
  values: LoanFormValues
  errors: LoanFormErrors
  onChange: (values: LoanFormValues) => void
}

function LoanForm({ values, errors, onChange }: LoanFormProps) {
  return (
    <form className="card form-card" onSubmit={(event) => event.preventDefault()}>
      <h2 className="card-title">Kredyt</h2>

      <label className="field">
        <span className="field-label">Kwota kredytu</span>
        <span className={errors.principal ? 'input-wrap has-error' : 'input-wrap'}>
          <input
            inputMode="decimal"
            aria-invalid={errors.principal !== undefined}
            value={values.principal}
            onChange={(event) => onChange({ ...values, principal: event.target.value })}
          />
          <span className="suffix">zł</span>
        </span>
        <FieldError message={errors.principal} />
      </label>

      <label className="field">
        <span className="field-label">Oprocentowanie roczne</span>
        <span className={errors.annualRatePercent ? 'input-wrap has-error' : 'input-wrap'}>
          <input
            inputMode="decimal"
            aria-invalid={errors.annualRatePercent !== undefined}
            value={values.annualRatePercent}
            onChange={(event) => onChange({ ...values, annualRatePercent: event.target.value })}
          />
          <span className="suffix">%</span>
        </span>
        <FieldError message={errors.annualRatePercent} />
      </label>

      <fieldset className="field">
        <legend className="field-label">Okres kredytu</legend>
        <div className="field-row">
          <span className={errors.term ? 'input-wrap has-error' : 'input-wrap'}>
            <input
              inputMode="numeric"
              aria-label="Lata"
              aria-invalid={errors.term !== undefined}
              value={values.termYears}
              onChange={(event) => onChange({ ...values, termYears: event.target.value })}
            />
            <span className="suffix">lat</span>
          </span>
          <span className={errors.term ? 'input-wrap has-error' : 'input-wrap'}>
            <input
              inputMode="numeric"
              aria-label="Miesiące"
              aria-invalid={errors.term !== undefined}
              value={values.termMonths}
              onChange={(event) => onChange({ ...values, termMonths: event.target.value })}
            />
            <span className="suffix">mies.</span>
          </span>
        </div>
        <FieldError message={errors.term} />
      </fieldset>

      <fieldset className="field">
        <legend className="field-label">Rodzaj rat</legend>
        <div className="segmented">
          <label>
            <input
              type="radio"
              name="installmentType"
              checked={values.installmentType === 'equal'}
              onChange={() => onChange({ ...values, installmentType: 'equal' })}
            />
            <span>Równe</span>
          </label>
          <label>
            <input
              type="radio"
              name="installmentType"
              checked={values.installmentType === 'decreasing'}
              onChange={() => onChange({ ...values, installmentType: 'decreasing' })}
            />
            <span>Malejące</span>
          </label>
        </div>
      </fieldset>
    </form>
  )
}

export default LoanForm

import {
  addOneTimeRow,
  removeOneTimeRow,
  updateOneTimeRow,
  type OverpaymentFormValues,
} from '../lib/overpaymentForm'
import type { OverpaymentFormErrors } from '../lib/validation'
import FieldError from './FieldError'

interface OverpaymentFormProps {
  values: OverpaymentFormValues
  errors: OverpaymentFormErrors
  onChange: (values: OverpaymentFormValues) => void
}

const wrapClass = (error: string | undefined): string => (error ? 'input-wrap has-error' : 'input-wrap')

function OverpaymentForm({ values, errors, onChange }: OverpaymentFormProps) {
  return (
    <form className="card form-card" onSubmit={(event) => event.preventDefault()}>
      <h2 className="card-title">Nadpłaty</h2>

      <fieldset className="field">
        <legend className="field-label">Po nadpłacie bank ma</legend>
        <div className="segmented">
          <label>
            <input
              type="radio"
              name="overpaymentEffect"
              checked={values.effect === 'shortenTerm'}
              onChange={() => onChange({ ...values, effect: 'shortenTerm' })}
            />
            <span>Skrócić okres</span>
          </label>
          <label>
            <input
              type="radio"
              name="overpaymentEffect"
              checked={values.effect === 'lowerInstallment'}
              onChange={() => onChange({ ...values, effect: 'lowerInstallment' })}
            />
            <span>Obniżyć ratę</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field-label">Nadpłata co miesiąc</legend>
        <div className="field-row">
          <span className={wrapClass(errors.recurringAmount)}>
            <input
              inputMode="decimal"
              aria-label="Kwota nadpłaty co miesiąc"
              aria-invalid={errors.recurringAmount !== undefined}
              placeholder="0"
              value={values.recurringAmount}
              onChange={(event) => onChange({ ...values, recurringAmount: event.target.value })}
            />
            <span className="suffix">zł</span>
          </span>
          <span className={wrapClass(errors.recurringStartMonth)}>
            <span className="prefix">od raty nr</span>
            <input
              inputMode="numeric"
              aria-label="Od której raty"
              aria-invalid={errors.recurringStartMonth !== undefined}
              placeholder="1"
              value={values.recurringStartMonth}
              onChange={(event) => onChange({ ...values, recurringStartMonth: event.target.value })}
            />
          </span>
        </div>
        <FieldError message={errors.recurringAmount} />
        <FieldError message={errors.recurringStartMonth} />
      </fieldset>

      <fieldset className="field">
        <legend className="field-label">Nadpłaty jednorazowe</legend>

        {values.oneTime.length === 0 && <p className="field-hint">Brak nadpłat jednorazowych.</p>}

        {values.oneTime.map((row) => {
          const rowErrors = errors.oneTime[row.id] ?? {}
          return (
            <div className="one-time-row" key={row.id}>
              <div className="field-row with-action">
                <span className={wrapClass(rowErrors.month)}>
                  <span className="prefix">rata nr</span>
                  <input
                    inputMode="numeric"
                    aria-label="Numer raty"
                    aria-invalid={rowErrors.month !== undefined}
                    value={row.month}
                    onChange={(event) => onChange(updateOneTimeRow(values, row.id, { month: event.target.value }))}
                  />
                </span>
                <span className={wrapClass(rowErrors.amount)}>
                  <input
                    inputMode="decimal"
                    aria-label="Kwota nadpłaty"
                    aria-invalid={rowErrors.amount !== undefined}
                    value={row.amount}
                    onChange={(event) => onChange(updateOneTimeRow(values, row.id, { amount: event.target.value }))}
                  />
                  <span className="suffix">zł</span>
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Usuń nadpłatę"
                  onClick={() => onChange(removeOneTimeRow(values, row.id))}
                >
                  ×
                </button>
              </div>
              <FieldError message={rowErrors.month} />
              <FieldError message={rowErrors.amount} />
            </div>
          )
        })}

        <button type="button" className="ghost-button" onClick={() => onChange(addOneTimeRow(values))}>
          + Dodaj nadpłatę
        </button>
      </fieldset>
    </form>
  )
}

export default OverpaymentForm

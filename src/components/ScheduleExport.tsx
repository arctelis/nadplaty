import { schedulesToCsv } from '../lib/csv'
import type { ScheduleRow } from '../lib/types'

interface ScheduleExportProps {
  withoutOverpayments: ScheduleRow[]
  withOverpayments: ScheduleRow[]
}

// Browser trick for "save a file": wrap the text in a Blob, give it a temporary URL,
// click an invisible link pointing to it, then release the URL.
function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function ScheduleExport({ withoutOverpayments, withOverpayments }: ScheduleExportProps) {
  return (
    <section className="card export-card">
      <div>
        <p className="eyebrow">Harmonogram</p>
        <p className="export-text">Oba harmonogramy rata po racie, gotowe do otwarcia w Excelu.</p>
      </div>
      <button
        type="button"
        className="primary-button"
        onClick={() =>
          downloadTextFile('harmonogram-nadplaty.csv', schedulesToCsv(withoutOverpayments, withOverpayments))
        }
      >
        Pobierz CSV
      </button>
    </section>
  )
}

export default ScheduleExport

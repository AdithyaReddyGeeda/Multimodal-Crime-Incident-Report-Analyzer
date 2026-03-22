import { sceneBadgeClasses } from '../utils/sceneColors.js'

function truncate(str, max = 30) {
  if (!str || str.length <= max) return str
  return `${str.slice(0, max)}…`
}

function ConfidenceCell({ score }) {
  const n = Number(score)
  const pct = Math.min(100, Math.max(0, n * 100))
  const isZero = n === 0

  return (
    <div className="min-w-[120px]">
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        {!isZero && (
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {isZero ? 'No detections' : `${pct.toFixed(0)}%`}
      </p>
    </div>
  )
}

function isOcrUnavailableMessage(text) {
  return typeof text === 'string' && text.startsWith('OCR unavailable')
}

function TextExtractedCell({ text }) {
  if (isOcrUnavailableMessage(text)) {
    const display =
      text.length > 48 ? `${text.slice(0, 45)}…` : text
    return (
      <span
        className="inline-flex max-w-full items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium italic text-gray-500"
        title={text}
      >
        {display}
      </span>
    )
  }
  return <span className="text-gray-700">{truncate(text)}</span>
}

export default function ImageTable({ rows, onView }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden my-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                'Incident ID',
                'Image',
                'Scene Type',
                'Objects Detected',
                'Text Extracted',
                'Confidence',
                'Details',
              ].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.incident_id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {row.incident_id}
                </td>
                <td className="px-4 py-3 text-gray-700">{row.image_id}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sceneBadgeClasses(row.scene_type)}`}
                  >
                    {row.scene_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {row.objects_detected === 'none' ? (
                    <span className="text-gray-400 italic">—</span>
                  ) : (
                    row.objects_detected
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-[220px]">
                  <TextExtractedCell text={row.text_extracted} />
                </td>
                <td className="px-4 py-3">
                  <ConfidenceCell score={row.confidence_score} />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onView(row)}
                    className="rounded-lg bg-gray-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-gray-800 transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

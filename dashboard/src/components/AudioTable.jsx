function eventBadgeClasses(event) {
  switch (event) {
    case 'Fire':
      return 'bg-red-100 text-red-800 border border-red-200'
    case 'Road Accident':
      return 'bg-amber-100 text-amber-900 border border-amber-200'
    case 'Assault':
      return 'bg-purple-100 text-purple-800 border border-purple-200'
    case 'Theft':
      return 'bg-orange-100 text-orange-900 border border-orange-200'
    case 'Public Disturbance':
      return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'Suspicious Activity':
      return 'bg-yellow-100 text-yellow-900 border border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200'
  }
}

function truncate(str, max = 64) {
  if (!str || str.length <= max) return str
  return `${str.slice(0, max)}…`
}

function UrgencyBar({ score }) {
  const n = Number(score)
  const pct = Math.min(100, Math.max(0, n * 100))
  const isZero = n === 0

  return (
    <div className="min-w-[100px]">
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        {!isZero && (
          <div
            className="h-full rounded-full bg-sky-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">{isZero ? '—' : `${pct.toFixed(0)}%`}</p>
    </div>
  )
}

export default function AudioTable({ rows }) {
  if (!rows.length) {
    return (
      <div className="bg-white rounded-xl shadow p-6 my-6 text-sm text-gray-500">
        No audio transcript data. Run{' '}
        <code className="text-xs bg-gray-100 px-1 rounded">python modules/audio_analyst.py</code>{' '}
        and{' '}
        <code className="text-xs bg-gray-100 px-1 rounded">python sync_dashboard_data.py</code>
        .
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden my-6">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Module 1 — 911 transcripts</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          NER, event type, sentiment, and urgency from transcribed calls
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                'Incident ID',
                'Call ID',
                'Event',
                'Location',
                'Sentiment',
                'Urgency',
                'Transcript (preview)',
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
                <td className="px-4 py-3 text-gray-700">{row.call_id}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${eventBadgeClasses(row.extracted_event)}`}
                  >
                    {row.extracted_event}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-[180px]">{row.location}</td>
                <td className="px-4 py-3 text-gray-700">{row.sentiment}</td>
                <td className="px-4 py-3">
                  <UrgencyBar score={row.urgency_score} />
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-md">{truncate(row.transcript)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

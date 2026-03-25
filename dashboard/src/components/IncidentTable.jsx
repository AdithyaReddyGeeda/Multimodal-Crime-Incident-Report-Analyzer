function truncate(str, max = 55) {
  if (!str || str.length <= max) return str
  return `${str.slice(0, max)}...`
}

const SOURCE_STYLE = {
  Image: {
    badge: 'bg-[#10b981]/15 text-[#047857] border border-[#10b981]/40',
    row: 'bg-[#10b981]/10 hover:bg-[#10b981]/15',
  },
  Audio: {
    badge: 'bg-[#3b82f6]/15 text-[#1d4ed8] border border-[#3b82f6]/40',
    row: 'bg-[#3b82f6]/10 hover:bg-[#3b82f6]/15',
  },
  Video: {
    badge: 'bg-[#a855f7]/15 text-[#6b21a8] border border-[#a855f7]/40',
    row: 'bg-[#a855f7]/10 hover:bg-[#a855f7]/15',
  },
  Text: {
    badge: 'bg-[#f97316]/15 text-[#c2410c] border border-[#f97316]/40',
    row: 'bg-[#f97316]/10 hover:bg-[#f97316]/15',
  },
}

function rowKey(row) {
  if (row.frame_id) return `${row.source}-${row.incident_id}-${row.frame_id}`
  if (row.text_id) return `${row.source}-${row.incident_id}-${row.text_id}`
  if (row.call_id) return `${row.source}-${row.incident_id}-${row.call_id}`
  if (row.image_id) return `${row.source}-${row.incident_id}-${row.image_id}`
  return `${row.source}-${row.incident_id}`
}

function severityBadge(level) {
  if (level === 'High') return 'bg-red-100 text-red-800 border border-red-200'
  if (level === 'Medium') return 'bg-amber-100 text-amber-900 border border-amber-200'
  return 'bg-emerald-100 text-emerald-900 border border-emerald-200'
}

export default function IncidentTable({ rows, onView }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden my-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                'Incident ID',
                'Source',
                'Type',
                'Location / Topic',
                'Details',
                'Confidence',
                'Severity',
                'Action',
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
            {rows.map((row) => {
              const st = SOURCE_STYLE[row.source] || SOURCE_STYLE.Image
              return (
                <tr key={rowKey(row)} className={st.row}>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {row.incident_id}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${st.badge}`}
                    >
                      {row.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{row.type}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[200px]">
                    {row.locationOrTopic}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[280px]">
                    {truncate(row.detailText || '—')}
                  </td>
                  <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                    {(Number(row.confidenceOrUrgency) * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${severityBadge(row.severityLevel)}`}
                    >
                      {row.severityLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onView(row)}
                      className="rounded-lg bg-gray-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-gray-800 transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

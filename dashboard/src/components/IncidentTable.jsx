function truncate(str, max = 55) {
  if (!str || str.length <= max) return str
  return `${str.slice(0, max)}...`
}

function sourceBadge(source) {
  if (source === 'Audio') {
    return 'bg-blue-100 text-blue-800 border border-blue-200'
  }
  if (source === 'Video') {
    return 'bg-purple-100 text-purple-800 border border-purple-200'
  }
  if (source === 'Text') {
    return 'bg-orange-100 text-orange-900 border border-orange-200'
  }
  return 'bg-green-100 text-green-800 border border-green-200'
}

function rowTint(source) {
  if (source === 'Audio') return 'hover:bg-blue-50/70'
  if (source === 'Video') return 'hover:bg-purple-50/70'
  if (source === 'Text') return 'hover:bg-orange-50/70'
  return 'hover:bg-green-50/60'
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
                'Location',
                'Details',
                'Confidence/Urgency',
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
            {rows.map((row) => (
              <tr key={`${row.source}-${row.incident_id}`} className={rowTint(row.source)}>
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {row.incident_id}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${sourceBadge(row.source)}`}
                  >
                    {row.source}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-800">{row.type}</td>
                <td className="px-4 py-3 text-gray-700">{row.location || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[340px]">
                  {truncate(row.detailText || '—')}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {(Number(row.confidenceOrUrgency) * 100).toFixed(0)}%
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

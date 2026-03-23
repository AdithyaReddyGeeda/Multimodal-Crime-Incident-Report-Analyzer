import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function aggregateByType(rows) {
  const map = {}
  rows.forEach((r) => {
    map[r.type] = (map[r.type] || 0) + 1
  })
  return Object.entries(map).map(([name, count]) => ({ name, count }))
}

function aggregateBySource(rows) {
  const map = {}
  rows.forEach((r) => {
    map[r.source] = (map[r.source] || 0) + 1
  })
  const fillForSource = { Audio: '#3b82f6', Image: '#22c55e', Video: '#a855f7' }
  return Object.entries(map).map(([name, value]) => ({
    name,
    value,
    fill: fillForSource[name] || '#9ca3af',
  }))
}

function averageBySource(rows) {
  const map = {}
  rows.forEach((r) => {
    if (!map[r.source]) map[r.source] = { sum: 0, count: 0 }
    map[r.source].sum += Number(r.confidenceOrUrgency || 0)
    map[r.source].count += 1
  })
  return Object.entries(map).map(([source, v]) => ({
    source,
    avg: Number((v.sum / v.count).toFixed(2)),
  }))
}

export default function SceneChart({ rows }) {
  const byType = aggregateByType(rows)
  const bySource = aggregateBySource(rows)
  const avgBySource = averageBySource(rows)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 my-6">
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Incidents by Type</h2>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byType} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-10} textAnchor="end" height={56} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Incidents by Source</h2>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={bySource} dataKey="value" nameKey="name" outerRadius={95} />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Avg Confidence/Urgency by Source</h2>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={avgBySource} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="source" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="avg" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

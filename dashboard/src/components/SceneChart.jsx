import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const SOURCE_COLORS = {
  Image: '#10b981',
  Audio: '#3b82f6',
  Video: '#a855f7',
  Text: '#f97316',
}

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
  return Object.entries(map).map(([name, value]) => ({
    name,
    value,
    fill: SOURCE_COLORS[name] || '#9ca3af',
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
    fill: SOURCE_COLORS[source] || '#0ea5e9',
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
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={64} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Incidents by Source</h2>
        <div className="w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={bySource}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                outerRadius={88}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#9ca3af' }}
              >
                {bySource.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-700">
          {bySource.map((d) => (
            <li key={d.name} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: d.fill }}
                aria-hidden
              />
              <span className="font-medium text-gray-900">{d.name}</span>
              <span className="text-gray-500">({d.value})</span>
            </li>
          ))}
        </ul>
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
              <Bar dataKey="avg" name="Avg" radius={[4, 4, 0, 0]}>
                {avgBySource.map((entry) => (
                  <Cell key={entry.source} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

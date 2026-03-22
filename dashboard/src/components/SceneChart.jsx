import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function SceneChart({ chartData }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 my-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Incidents by Scene Type
      </h2>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-12}
              textAnchor="end"
              height={56}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Count">
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

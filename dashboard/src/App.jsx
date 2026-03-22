import { useMemo, useState } from 'react'
import { imageResults } from './data/imageResults.js'
import Header from './components/Header.jsx'
import StatsBar from './components/StatsBar.jsx'
import SceneChart from './components/SceneChart.jsx'
import { sceneFill } from './utils/sceneColors.js'
import ImageTable from './components/ImageTable.jsx'
import IncidentModal from './components/IncidentModal.jsx'

const FILTER_OPTIONS = [
  'All',
  'Fire',
  'Accident',
  'Public Disturbance',
  'Assault or Theft',
]

function buildStats(rows) {
  const total = rows.length
  const fires = rows.filter((r) => r.scene_type === 'Fire').length
  const accidents = rows.filter((r) => r.scene_type === 'Accident').length
  const other = rows.filter(
    (r) => r.scene_type !== 'Fire' && r.scene_type !== 'Accident',
  ).length
  return { total, fires, accidents, other }
}

function buildChartData(rows) {
  const counts = {}
  rows.forEach((r) => {
    const k = r.scene_type
    counts[k] = (counts[k] || 0) + 1
  })
  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    fill: sceneFill(name),
  }))
}

export default function App() {
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [filterScene, setFilterScene] = useState('All')

  const filteredRows = useMemo(() => {
    if (filterScene === 'All') return imageResults
    return imageResults.filter((r) => r.scene_type === filterScene)
  }, [filterScene])

  const stats = useMemo(() => buildStats(imageResults), [])
  const chartData = useMemo(() => buildChartData(imageResults), [])

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="my-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm font-medium text-center">
          ⚠️ More modules coming soon
        </div>

        <StatsBar stats={stats} />
        <SceneChart chartData={chartData} />

        <div className="my-6 flex flex-wrap items-center gap-3">
          <label htmlFor="scene-filter" className="text-sm font-medium text-gray-700">
            Filter by scene
          </label>
          <select
            id="scene-filter"
            value={filterScene}
            onChange={(e) => setFilterScene(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <ImageTable
          rows={filteredRows}
          onView={(row) => setSelectedIncident(row)}
        />
      </div>

      {selectedIncident && (
        <IncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  )
}

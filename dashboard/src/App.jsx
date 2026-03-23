import { useMemo, useState } from 'react'
import { audioResults } from './data/audioResults.js'
import { imageResults } from './data/imageResults.js'
import { videoResults } from './data/videoResults.js'
import Header from './components/Header.jsx'
import StatsBar from './components/StatsBar.jsx'
import SceneChart from './components/SceneChart.jsx'
import IncidentTable from './components/IncidentTable.jsx'
import IncidentModal from './components/IncidentModal.jsx'

const SOURCE_OPTIONS = ['All', 'Audio', 'Image', 'Video']

function getSeverityLevel(score) {
  if (score <= 0.3) return 'Low'
  if (score <= 0.7) return 'Medium'
  return 'High'
}

function toIncident(row, source) {
  const confidenceOrUrgency = source === 'Audio'
    ? Number(row.urgency_score || 0)
    : source === 'Image'
      ? Number(row.confidence_score || 0)
      : Number(row.confidence || 0)

  const type = source === 'Audio'
    ? row.extracted_event
    : source === 'Image'
      ? row.scene_type
      : row.event_detected

  const detailText = source === 'Audio'
    ? row.transcript
    : source === 'Image'
      ? row.objects_detected
      : row.objects

  const location = source === 'Audio' ? row.location : 'N/A'
  return {
    ...row,
    source,
    type,
    location,
    confidenceOrUrgency,
    severityScore: confidenceOrUrgency,
    severityLevel: getSeverityLevel(confidenceOrUrgency),
    detailText,
  }
}

function sortByIncidentId(rows) {
  return [...rows].sort((a, b) => {
    const aNum = Number((a.incident_id || '').replace('INC-', ''))
    const bNum = Number((b.incident_id || '').replace('INC-', ''))
    return aNum - bNum
  })
}

function buildStats(rows) {
  const total = rows.length
  const imageCount = rows.filter((r) => r.source === 'Image').length
  const audioCount = rows.filter((r) => r.source === 'Audio').length
  const videoCount = rows.filter((r) => r.source === 'Video').length
  return { total, imageCount, audioCount, videoCount }
}

export default function App() {
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [sourceFilter, setSourceFilter] = useState('All')

  const mergedRows = useMemo(
    () =>
      sortByIncidentId([
        ...imageResults.map((r) => toIncident(r, 'Image')),
        ...audioResults.map((r) => toIncident(r, 'Audio')),
        ...videoResults.map((r) => toIncident(r, 'Video')),
      ]),
    [],
  )

  const filteredRows = useMemo(() => {
    if (sourceFilter === 'All') return mergedRows
    return mergedRows.filter((r) => r.source === sourceFilter)
  }, [mergedRows, sourceFilter])

  const stats = useMemo(() => buildStats(filteredRows), [filteredRows])

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="my-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm font-medium text-center">
          Unified dashboard for audio (Module 1), image (Module 3), and video (Module 4). Run{' '}
          <code className="text-xs bg-amber-100/80 px-1 rounded">sync_dashboard_data.py</code> after
          pipelines
        </div>

        <StatsBar stats={stats} />
        <SceneChart rows={filteredRows} />

        <div className="my-6 flex flex-wrap items-center gap-3">
          <label htmlFor="source-filter" className="text-sm font-medium text-gray-700">
            Filter by source
          </label>
          <select
            id="source-filter"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <IncidentTable
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

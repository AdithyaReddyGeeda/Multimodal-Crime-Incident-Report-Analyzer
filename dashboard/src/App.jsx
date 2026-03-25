import { useMemo, useState } from 'react'
import { audioResults } from './data/audioResults.js'
import { imageResults } from './data/imageResults.js'
import { textResults } from './data/textResults.js'
import { videoResults } from './data/videoResults.js'
import Header from './components/Header.jsx'
import StatsBar from './components/StatsBar.jsx'
import SceneChart from './components/SceneChart.jsx'
import IncidentTable from './components/IncidentTable.jsx'
import IncidentModal from './components/IncidentModal.jsx'

const SOURCE_OPTIONS = ['All', 'Image', 'Audio', 'Video', 'Text']

function locationFromEntities(entities) {
  if (!entities || typeof entities !== 'string') return 'N/A'
  const m = entities.match(/Locations:\s*([^;]+)/)
  const s = m ? m[1].trim() : ''
  if (!s || s === 'N/A') return 'N/A'
  return s
}

function titleCaseTopic(s) {
  return String(s || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** 0–1: higher = more negative / alarming (for Audio & Text); 0 for Image/Video. */
function sentimentNegativity(row, source) {
  if (source === 'Audio') {
    const neg = String(row.sentiment || '').toUpperCase().includes('NEG')
    return neg ? Number(row.urgency_score ?? 0.75) : 0.25
  }
  if (source === 'Text') {
    const neg = String(row.sentiment || '').toUpperCase().includes('NEG')
    const sc = Number(row.sentiment_score ?? 0.5)
    return neg ? sc : 1 - sc
  }
  return 0
}

function combinedSeverity(row, source, confidence) {
  const neg = sentimentNegativity(row, source)
  const c = Math.min(1, Math.max(0, Number(confidence) || 0))
  return Math.min(1, Math.max(0, c * 0.7 + neg * 0.3))
}

function getSeverityLevel(score) {
  if (score <= 0.33) return 'Low'
  if (score <= 0.67) return 'Medium'
  return 'High'
}

function toIncident(row, source) {
  let confidenceOrUrgency = 0
  let type = ''
  let detailText = ''
  let location = 'N/A'

  if (source === 'Audio') {
    confidenceOrUrgency = Number(row.urgency_score || 0)
    type = row.extracted_event
    detailText = row.transcript
    location = row.location || 'N/A'
  } else if (source === 'Image') {
    confidenceOrUrgency = Number(row.confidence_score || 0)
    type = row.scene_type
    detailText = row.objects_detected
    location = 'N/A'
  } else if (source === 'Video') {
    confidenceOrUrgency = Number(row.confidence || 0)
    type = row.event_detected
    detailText = row.objects
    location = 'N/A'
  } else if (source === 'Text') {
    confidenceOrUrgency = Number(row.sentiment_score ?? 0.5)
    type = titleCaseTopic(row.topic)
    detailText = row.raw_text || row.entities
    location = locationFromEntities(row.entities)
  }

  const severityScore = combinedSeverity(row, source, confidenceOrUrgency)
  const severityLevel = getSeverityLevel(severityScore)

  const locationOrTopic =
    location !== 'N/A' ? location : source === 'Text' ? type : '—'

  return {
    ...row,
    source,
    type,
    location,
    locationOrTopic,
    detailText,
    confidenceOrUrgency,
    severityScore,
    severityLevel,
  }
}

/** Sort by module prefix (IMG, AUD, VID, TXT) then numeric suffix; legacy INC- sorts with IMG. */
const PREFIX_ORDER = { IMG: 0, INC: 0, AUD: 1, VID: 2, TXT: 3 }

function sortByIncidentId(rows) {
  return [...rows].sort((a, b) => {
    const ma = String(a.incident_id || '').match(/^([A-Z]+)-(\d+)$/)
    const mb = String(b.incident_id || '').match(/^([A-Z]+)-(\d+)$/)
    const oa = ma ? (PREFIX_ORDER[ma[1]] ?? 50) : 99
    const ob = mb ? (PREFIX_ORDER[mb[1]] ?? 50) : 99
    if (oa !== ob) return oa - ob
    const na = ma ? parseInt(ma[2], 10) : 0
    const nb = mb ? parseInt(mb[2], 10) : 0
    return na - nb
  })
}

function buildStats(rows) {
  const total = rows.length
  const imageCount = rows.filter((r) => r.source === 'Image').length
  const audioCount = rows.filter((r) => r.source === 'Audio').length
  const videoCount = rows.filter((r) => r.source === 'Video').length
  const textCount = rows.filter((r) => r.source === 'Text').length
  const highSeverity = rows.filter((r) => r.severityLevel === 'High').length
  const mediumSeverity = rows.filter((r) => r.severityLevel === 'Medium').length
  const lowSeverity = rows.filter((r) => r.severityLevel === 'Low').length
  return {
    total,
    imageCount,
    audioCount,
    videoCount,
    textCount,
    highSeverity,
    mediumSeverity,
    lowSeverity,
  }
}

function uniqueTypes(rows) {
  const set = new Set(rows.map((r) => String(r.type || '').trim()).filter(Boolean))
  return ['All', ...Array.from(set).sort()]
}

export default function App() {
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [sourceFilter, setSourceFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')

  const mergedRows = useMemo(
    () =>
      sortByIncidentId([
        ...imageResults.map((r) => toIncident(r, 'Image')),
        ...audioResults.map((r) => toIncident(r, 'Audio')),
        ...videoResults.map((r) => toIncident(r, 'Video')),
        ...textResults.map((r) => toIncident(r, 'Text')),
      ]),
    [],
  )

  const typeOptions = useMemo(() => uniqueTypes(mergedRows), [mergedRows])

  const filteredRows = useMemo(() => {
    let out = mergedRows
    if (sourceFilter !== 'All') {
      out = out.filter((r) => r.source === sourceFilter)
    }
    if (typeFilter !== 'All') {
      out = out.filter((r) => String(r.type) === typeFilter)
    }
    return out
  }, [mergedRows, sourceFilter, typeFilter])

  const stats = useMemo(() => buildStats(filteredRows), [filteredRows])

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="my-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm font-medium text-center">
          Unified dashboard (Audio · Image · Video · Text). Run{' '}
          <code className="text-xs bg-amber-100/80 px-1 rounded">sync_dashboard_data.py</code> after
          pipelines
        </div>

        <StatsBar stats={stats} />
        <SceneChart rows={filteredRows} />

        <div className="my-6 flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="source-filter" className="text-sm font-medium text-gray-700">
              Source
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
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent min-w-[180px]"
            >
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
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

import { X } from 'lucide-react'
import { sceneBadgeClasses } from '../utils/sceneColors.js'

function ConfidenceBar({ score }) {
  const pct = Math.min(100, Math.max(0, Number(score) * 100))
  const isZero = !score || score === 0

  return (
    <div>
      <div className="h-3 w-full max-w-md rounded-full bg-gray-200 overflow-hidden">
        {!isZero && (
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {isZero ? 'No detections' : `${pct.toFixed(1)}% confidence`}
      </p>
    </div>
  )
}

export default function IncidentModal({ incident, onClose }) {
  if (!incident) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/50 transition-opacity duration-200"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-xl p-6 animate-modal-in transition-opacity duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2
          id="incident-modal-title"
          className="text-2xl font-bold text-gray-900 pr-10"
        >
          {incident.incident_id}
        </h2>
        <p className="text-gray-500 mt-1">{incident.image_id}</p>

        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">
            🖼️ Image Analysis
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2 justify-between">
              <dt className="text-gray-500">Scene type</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${sceneBadgeClasses(incident.scene_type)}`}
                >
                  {incident.scene_type}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Objects detected</dt>
              <dd className="text-gray-900 mt-0.5">
                {incident.objects_detected === 'none' ? (
                  <span className="text-gray-400 italic">—</span>
                ) : (
                  incident.objects_detected
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Text extracted</dt>
              <dd className="text-gray-900 mt-0.5 break-words">
                {incident.text_extracted}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-2">Confidence</dt>
              <dd>
                <ConfidenceBar score={incident.confidence_score} />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

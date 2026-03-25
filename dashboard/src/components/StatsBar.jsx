export default function StatsBar({ stats }) {
  const {
    total,
    imageCount,
    audioCount,
    videoCount,
    textCount,
    highSeverity,
    mediumSeverity,
    lowSeverity,
  } = stats

  const sourceCards = [
    {
      label: 'Total Incidents',
      value: total,
      borderClass: 'border-l-4 border-gray-400',
    },
    {
      label: 'Image',
      value: imageCount,
      borderClass: 'border-l-4 border-[#10b981]',
    },
    {
      label: 'Audio',
      value: audioCount,
      borderClass: 'border-l-4 border-[#3b82f6]',
    },
    {
      label: 'Video',
      value: videoCount,
      borderClass: 'border-l-4 border-[#a855f7]',
    },
    {
      label: 'Text',
      value: textCount,
      borderClass: 'border-l-4 border-[#f97316]',
    },
  ]

  const severityCards = [
    {
      label: 'High',
      value: highSeverity,
      borderClass: 'border-l-4 border-red-500',
      sub: 'score > 0.67',
    },
    {
      label: 'Medium',
      value: mediumSeverity,
      borderClass: 'border-l-4 border-amber-400',
      sub: '0.33 – 0.67',
    },
    {
      label: 'Low',
      value: lowSeverity,
      borderClass: 'border-l-4 border-emerald-500',
      sub: 'score ≤ 0.33',
    },
  ]

  return (
    <div className="space-y-4 my-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {sourceCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-xl shadow p-4 ${card.borderClass}`}
          >
            <div className="text-3xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-600 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Severity distribution</h3>
        <p className="text-xs text-gray-500 mb-3">
          Score = 0.7 × confidence + 0.3 × sentiment negativity (Audio/Text only for negativity)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {severityCards.map((card) => (
            <div
              key={card.label}
              className={`bg-white rounded-xl shadow p-4 ${card.borderClass}`}
            >
              <div className="text-3xl font-bold text-gray-900">{card.value}</div>
              <div className="text-sm text-gray-600 mt-1">{card.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function StatsBar({ stats }) {
  const { total, imageCount, audioCount, videoCount } = stats

  const cards = [
    {
      label: 'Total Incidents',
      value: total,
      borderClass: 'border-l-4 border-gray-300',
    },
    {
      label: 'Image Incidents',
      value: imageCount,
      borderClass: 'border-l-4 border-green-500',
    },
    {
      label: 'Audio Incidents',
      value: audioCount,
      borderClass: 'border-l-4 border-blue-500',
    },
    {
      label: 'Video Incidents',
      value: videoCount,
      borderClass: 'border-l-4 border-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white rounded-xl shadow p-4 ${card.borderClass}`}
        >
          <div className="text-3xl font-bold text-gray-900">{card.value}</div>
          <div className="text-sm text-gray-600 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  )
}

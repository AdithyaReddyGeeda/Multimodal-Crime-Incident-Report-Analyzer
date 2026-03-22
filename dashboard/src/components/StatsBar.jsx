export default function StatsBar({ stats }) {
  const { total, fires, accidents, other } = stats

  const cards = [
    {
      label: 'Total Images Processed',
      value: total,
      borderClass: 'border-l-4 border-gray-300',
    },
    {
      label: 'Fires Detected',
      value: fires,
      borderClass: 'border-l-4 border-red-500',
    },
    {
      label: 'Accidents',
      value: accidents,
      borderClass: 'border-l-4 border-yellow-400',
    },
    {
      label: 'Other Scenes',
      value: other,
      borderClass: 'border-l-4 border-blue-500',
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

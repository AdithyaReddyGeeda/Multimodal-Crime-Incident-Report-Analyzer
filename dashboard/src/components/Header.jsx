export default function Header() {
  return (
    <header className="w-full bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">🚨 Incident Analyzer</h1>
          <p className="text-sm text-gray-400 mt-0.5">Module 3 — Image Analyst</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1.5">
          🖼️ Image Module Active
        </span>
      </div>
    </header>
  )
}

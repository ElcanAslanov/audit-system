'use client'

export default function CriticalAlerts({ alerts }: { alerts: any[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow mb-6">
      <h3 className="text-red-700 font-bold">⚠️ Təcili Diqqət!</h3>
      <ul className="mt-2 text-sm text-red-600">
        {alerts.map((audit) => (
          <li key={audit.id}>
            {audit.title} - Bal: {audit.score}%
          </li>
        ))}
      </ul>
    </div>
  )
}
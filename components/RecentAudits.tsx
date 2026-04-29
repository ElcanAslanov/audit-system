import Link from 'next/link'

function statusLabel(value?: string | null) {
  if (value === 'tamamlandi') return 'Tamamlandı'
  if (value === 'needs_attention') return 'Diqqət tələb edir'
  if (value === 'planlanan') return 'Planlanan'
  return value || '-'
}

function statusClass(value?: string | null) {
  if (value === 'tamamlandi') return 'bg-green-50 text-green-700 border-green-200'
  if (value === 'needs_attention') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

export default function RecentAudits({ audits }: { audits: any[] }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Son auditlər</h2>
          <p className="text-sm text-slate-500">
            Sistemdə yaradılmış son audit planları
          </p>
        </div>

        <Link
          href="/dashboard/plans"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          Hamısına bax
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {audits.length === 0 && (
          <p className="text-sm text-slate-500">Hələ audit yoxdur.</p>
        )}

        {audits.map((audit) => (
          <Link
            key={audit.id}
            href={`/dashboard/plans/${audit.id}`}
            className="block rounded-lg border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{audit.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {audit.companies?.name || '-'} • {audit.department || '-'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                    audit.status
                  )}`}
                >
                  {statusLabel(audit.status)}
                </span>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {audit.score ?? 0}%
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
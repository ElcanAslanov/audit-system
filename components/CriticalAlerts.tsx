'use client';

import Link from 'next/link';

function alertReason(audit: any) {
  const score = Number(audit.score || 0);

  if (audit.status === 'needs_attention' && score < 50) {
    return 'Status kritikdir və score 50%-dən aşağıdır';
  }

  if (audit.status === 'needs_attention') {
    return 'Status diqqət tələb edir';
  }

  if (score < 50) {
    return 'Score 50%-dən aşağıdır';
  }

  return 'Diqqət tələb edir';
}

export default function CriticalAlerts({ alerts }: { alerts: any[] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
        <h3 className="font-bold text-emerald-800">
          Kritik xəbərdarlıq yoxdur
        </h3>
        <p className="mt-1 text-sm text-emerald-700">
          Hazırda diqqət tələb edən audit görünmür.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
      <div className="border-b border-red-100 pb-3">
        <h3 className="font-bold text-red-800">Təcili Diqqət!</h3>
        <p className="mt-1 text-sm text-red-700">
          Aşağıdakı auditlər kritik göstəriciyə malikdir.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {alerts.map((audit) => (
          <Link
            key={audit.id}
            href={`/dashboard/plans/${audit.id}`}
            className="block rounded-lg border border-red-100 bg-white/80 p-3 transition hover:bg-white"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-red-900">
                  {audit.title || 'Adsız audit'}
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {alertReason(audit)}
                </p>

                <p className="mt-1 text-xs text-red-600">
                  {audit.department || '-'} • Son tarix: {audit.due_date || '-'}
                </p>
              </div>

              <span className="w-fit rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                {audit.score ?? 0}%
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
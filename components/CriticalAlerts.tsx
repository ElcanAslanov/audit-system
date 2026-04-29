'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'

function alertReason(audit: any) {
  const score = Number(audit.score || 0)

  if (audit.status === 'needs_attention' && score < 50) {
    return 'Status kritikdir və score 50%-dən aşağıdır'
  }

  if (audit.status === 'needs_attention') {
    return 'Status diqqət tələb edir'
  }

  if (score < 50) {
    return 'Score 50%-dən aşağıdır'
  }

  return 'Diqqət tələb edir'
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('az-AZ')
}

export default function CriticalAlerts({ alerts }: { alerts: any[] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm">
            <ShieldCheck size={22} />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
              <CheckCircle2 size={14} />
              Stabil
            </div>

            <h3 className="mt-3 text-xl font-black text-emerald-900">
              Kritik xəbərdarlıq yoxdur
            </h3>

            <p className="mt-1 text-sm leading-6 text-emerald-700">
              Hazırda diqqət tələb edən və ya score-u aşağı olan audit görünmür.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-red-100 bg-red-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-red-100 pb-5">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-700">
          <AlertTriangle size={14} />
          Təcili diqqət
        </div>

        <div>
          <h3 className="text-xl font-black text-red-950">
            Kritik auditlər
          </h3>
          <p className="mt-1 text-sm leading-6 text-red-700">
            Aşağıdakı auditlər kritik göstəriciyə malikdir və prioritet
            izlənməlidir.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {alerts.map((audit) => {
          const score = Number(audit.score || 0)

          return (
            <Link
              key={audit.id}
              href={`/dashboard/plans/${audit.id}`}
              className="group block rounded-3xl border border-red-100 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-700">
                      <AlertTriangle size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-black text-red-950">
                        {audit.title || 'Adsız audit'}
                      </p>

                      <p className="mt-1 text-sm leading-5 text-red-700">
                        {alertReason(audit)}
                      </p>

                      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-red-600">
                        <span>{audit.department || '-'}</span>
                        <span>•</span>
                        <CalendarDays size={13} />
                        <span>Son tarix: {formatDate(audit.due_date)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <span className="w-fit rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700">
                    {score}%
                  </span>

                  <span className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-400 transition group-hover:bg-red-600 group-hover:text-white">
                    <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
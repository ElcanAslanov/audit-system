import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
} from 'lucide-react'

function statusLabel(value?: string | null) {
  if (value === 'tamamlandi') return 'Tamamlandı'
  if (value === 'needs_attention') return 'Diqqət tələb edir'
  if (value === 'planlanan') return 'Planlanan'
  return value || '-'
}

function statusTone(value?: string | null) {
  if (value === 'tamamlandi') {
    return {
      icon: CheckCircle2,
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBox: 'bg-emerald-50 text-emerald-700',
    }
  }

  if (value === 'needs_attention') {
    return {
      icon: AlertTriangle,
      badge: 'bg-red-50 text-red-700 border-red-200',
      iconBox: 'bg-red-50 text-red-700',
    }
  }

  return {
    icon: Clock3,
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    iconBox: 'bg-slate-100 text-slate-700',
  }
}

function scoreTone(score: number) {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700'
  if (score >= 50) return 'bg-yellow-50 text-yellow-700'
  return 'bg-red-50 text-red-700'
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('az-AZ')
}

export default function RecentAudits({ audits }: { audits: any[] }) {
  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-700">
            <ClipboardCheck size={14} />
            Son fəaliyyət
          </div>

          <h2 className="mt-3 text-xl font-black text-slate-950">
            Son auditlər
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Sistemdə yaradılmış və yenilənmiş son audit planları
          </p>
        </div>

        <Link
          href="/dashboard/plans"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:w-auto"
        >
          Hamısına bax
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {audits.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <ClipboardCheck size={22} />
            </div>

            <h3 className="mt-4 font-black text-slate-900">
              Hələ audit yoxdur
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Yeni audit planı yaradıldıqdan sonra burada görünəcək.
            </p>
          </div>
        )}

        {audits.map((audit) => {
          const score = Number(audit.score || 0)
          const tone = statusTone(audit.status)
          const Icon = tone.icon

          return (
            <Link
              key={audit.id}
              href={`/dashboard/plans/${audit.id}`}
              className="group block rounded-3xl border border-slate-100 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50/40 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone.iconBox}`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">
                      {audit.title}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {audit.companies?.name || '-'} • {audit.department || '-'}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={13} />
                        {formatDate(audit.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-black ${tone.badge}`}
                  >
                    {statusLabel(audit.status)}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${scoreTone(
                      score
                    )}`}
                  >
                    {score}%
                  </span>

                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-400 shadow-sm transition group-hover:bg-blue-600 group-hover:text-white">
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
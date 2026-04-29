import { AlertTriangle, CheckCircle2, Gauge } from 'lucide-react'

type Stats = {
  averageScore: string | number
  totalAudits: number
  highRiskCount: number
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value))
}

function scoreTone(score: number) {
  if (score >= 80) {
    return {
      label: 'Yüksək performans',
      text: 'text-emerald-700',
      bg: 'bg-emerald-500',
      soft: 'bg-emerald-50',
      border: 'border-emerald-100',
    }
  }

  if (score >= 50) {
    return {
      label: 'Orta performans',
      text: 'text-yellow-700',
      bg: 'bg-yellow-500',
      soft: 'bg-yellow-50',
      border: 'border-yellow-100',
    }
  }

  return {
    label: 'Aşağı performans',
    text: 'text-red-700',
    bg: 'bg-red-500',
    soft: 'bg-red-50',
    border: 'border-red-100',
  }
}

export default function DashboardStats({ stats }: { stats: Stats }) {
  const averageScore = clampScore(Number(stats?.averageScore || 0))
  const tone = scoreTone(averageScore)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className={`group relative overflow-hidden rounded-3xl border ${tone.border} ${tone.soft} p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}>
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/60 blur-2xl transition group-hover:scale-125" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm">
              <Gauge size={21} className={tone.text} />
            </div>

            <h3 className={`mt-4 text-sm font-black ${tone.text}`}>
              Ümumi Performans
            </h3>

            <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              {stats?.averageScore ?? 0}%
            </p>

            <p className={`mt-1 text-xs font-bold ${tone.text}`}>
              {tone.label}
            </p>
          </div>

          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
            Score
          </span>
        </div>

        <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-white/80">
          <div
            className={`h-full rounded-full ${tone.bg} transition-all duration-700`}
            style={{ width: `${averageScore}%` }}
          />
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-3xl border border-red-100 bg-red-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/60 blur-2xl transition group-hover:scale-125" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm">
              <AlertTriangle size={21} className="text-red-700" />
            </div>

            <h3 className="mt-4 text-sm font-black text-red-700">
              Açıq Risklər
            </h3>

            <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              {stats?.highRiskCount ?? 0}
            </p>

            <p className="mt-1 text-xs font-bold text-red-700">
              Diqqət tələb edən auditlər
            </p>
          </div>

          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-red-700 shadow-sm">
            Risk
          </span>
        </div>

        <div className="relative mt-5 rounded-2xl border border-red-100 bg-white/70 p-3">
          <p className="text-xs leading-5 text-red-700">
            Kritik və aşağı score-lu auditlər prioritet olaraq izlənməlidir.
          </p>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/60 blur-2xl transition group-hover:scale-125" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm">
              <CheckCircle2 size={21} className="text-emerald-700" />
            </div>

            <h3 className="mt-4 text-sm font-black text-emerald-700">
              Tamamlanmış Auditlər
            </h3>

            <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              {stats?.totalAudits ?? 0}
            </p>

            <p className="mt-1 text-xs font-bold text-emerald-700">
              Hesabatlı audit sayı
            </p>
          </div>

          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
            Done
          </span>
        </div>

        <div className="relative mt-5 rounded-2xl border border-emerald-100 bg-white/70 p-3">
          <p className="text-xs leading-5 text-emerald-700">
            Tamamlanmış auditlər performans trendində və hesabatlarda görünür.
          </p>
        </div>
      </div>
    </div>
  )
}
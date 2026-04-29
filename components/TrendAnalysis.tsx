import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'

type TrendItem = {
  name: string
  score: number
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value))
}

function scoreTone(score: number) {
  if (score >= 80) {
    return {
      text: 'text-emerald-700',
      bg: 'bg-emerald-500',
      soft: 'bg-emerald-50',
      label: 'Yaxşı',
    }
  }

  if (score >= 50) {
    return {
      text: 'text-yellow-700',
      bg: 'bg-yellow-500',
      soft: 'bg-yellow-50',
      label: 'Orta',
    }
  }

  return {
    text: 'text-red-700',
    bg: 'bg-red-500',
    soft: 'bg-red-50',
    label: 'Riskli',
  }
}

function trendDirection(trends: TrendItem[]) {
  if (trends.length < 2) return null

  const last = Number(trends[trends.length - 1]?.score || 0)
  const prev = Number(trends[trends.length - 2]?.score || 0)

  return last >= prev ? 'up' : 'down'
}

export default function TrendAnalysis({ trends }: { trends: TrendItem[] }) {
  const direction = trendDirection(trends)
  const latestScore =
    trends.length > 0 ? clampScore(Number(trends[trends.length - 1].score || 0)) : 0

  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
            <BarChart3 size={14} />
            Trend
          </div>

          <h2 className="mt-3 text-xl font-black text-slate-950">
            Aylıq Performans Trendi
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Audit score göstəricilərinin aylar üzrə dəyişimi
          </p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:min-w-40">
          <p className="text-xs font-bold uppercase text-slate-500">
            Son göstərici
          </p>

          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-3xl font-black text-slate-950">
              {latestScore}%
            </p>

            {direction === 'up' && (
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <TrendingUp size={18} />
              </span>
            )}

            {direction === 'down' && (
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-red-50 text-red-700">
                <TrendingDown size={18} />
              </span>
            )}

            {!direction && (
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                <BarChart3 size={18} />
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {trends.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <BarChart3 size={22} />
            </div>

            <h3 className="mt-4 font-black text-slate-900">
              Trend məlumatı yoxdur
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Trend üçün hələ kifayət qədər tamamlanmış audit məlumatı yoxdur.
            </p>
          </div>
        )}

        {trends.map((item, idx) => {
          const score = clampScore(Number(item.score || 0))
          const tone = scoreTone(score)

          return (
            <div
              key={`${item.name}-${idx}`}
              className="group rounded-3xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-blue-100 hover:bg-blue-50/40"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">
                    {item.name}
                  </p>
                  <p className={`mt-0.5 text-xs font-bold ${tone.text}`}>
                    {tone.label}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${tone.soft} ${tone.text}`}
                  >
                    {score}%
                  </span>
                </div>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-white shadow-inner">
                <div
                  className={`h-full rounded-full ${tone.bg} transition-all duration-700 group-hover:brightness-95`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
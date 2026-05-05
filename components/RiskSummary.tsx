import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ShieldAlert,
} from 'lucide-react'

type RiskSummaryData = {
  high: number
  medium: number
  low: number
  open: number
  resolved: number
}

export default function RiskSummary({
  summary,
}: {
  summary: RiskSummaryData
}) {
  const totalRisk = summary.high + summary.medium + summary.low
  const totalStatus = summary.open + summary.resolved
  const resolvedPercent =
    totalStatus > 0 ? Math.round((summary.resolved / totalStatus) * 100) : 0

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-700">
          <ShieldAlert size={14} />
          Risk xülasəsi
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-950">
            Çatışmazlıq riskləri
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Risk səviyyələri və icra vəziyyəti üzrə ümumi baxış
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        <div className="group relative overflow-hidden rounded-3xl border border-red-100 bg-red-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/70 blur-xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-red-700">High</p>
              <p className="mt-1 text-3xl font-black text-red-700">
                {summary.high}
              </p>
            </div>

            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-red-700 shadow-sm">
              <AlertOctagon size={19} />
            </span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-yellow-100 bg-yellow-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/70 blur-xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-yellow-700">Medium</p>
              <p className="mt-1 text-3xl font-black text-yellow-700">
                {summary.medium}
              </p>
            </div>

            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-yellow-700 shadow-sm">
              <AlertTriangle size={19} />
            </span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/70 blur-xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-emerald-700">Low</p>
              <p className="mt-1 text-3xl font-black text-emerald-700">
                {summary.low}
              </p>
            </div>

            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm">
              <CircleDot size={19} />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">
              Həll olunma göstəricisi
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Həll olunan çatışmazlıqlar / ümumi statuslu çatışmazlıqlar
            </p>
          </div>

          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
            {resolvedPercent}%
          </span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white shadow-inner">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${resolvedPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Açıq çatışmazlıqlar</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {summary.open}
              </p>
            </div>

            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldAlert size={18} />
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Həll olunanlar</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {summary.resolved}
              </p>
            </div>

            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={18} />
            </span>
          </div>
        </div>
      </div>

      {totalRisk === 0 && (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Hələ risk çatışmazlığı yoxdur.
          </p>
        </div>
      )}
    </div>
  )
}
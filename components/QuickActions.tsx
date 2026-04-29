import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FilePlus2,
  ListChecks,
  Zap,
} from 'lucide-react'

const actions = [
  {
    title: 'Audit planları',
    description: 'Bütün audit planlarına bax',
    href: '/dashboard/plans',
    icon: ClipboardCheck,
    tone: 'from-blue-600 to-cyan-500',
    soft: 'bg-blue-50 text-blue-700',
  },
  {
    title: 'Yeni audit yarat',
    description: 'Yeni audit planı əlavə et',
    href: '/dashboard/plans',
    icon: FilePlus2,
    tone: 'from-emerald-600 to-teal-500',
    soft: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Şablonlar',
    description: 'Audit checklist şablonlarını idarə et',
    href: '/dashboard/admin/templates',
    icon: ListChecks,
    tone: 'from-indigo-600 to-violet-500',
    soft: 'bg-indigo-50 text-indigo-700',
  },
  {
    title: 'Audit müqayisəsi',
    description: 'İki audit nəticəsini müqayisə et',
    href: '/dashboard/compare',
    icon: BarChart3,
    tone: 'from-slate-800 to-slate-600',
    soft: 'bg-slate-100 text-slate-700',
  },
]

export default function QuickActions() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
          <Zap size={14} />
          Sürətli keçidlər
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-950">
            Əməliyyatlar
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Ən çox istifadə olunan audit əməliyyatlarına tez keçid
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.href + action.title}
              href={action.href}
              className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-blue-100 hover:bg-white hover:shadow-md"
            >
              <div
                className={`absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${action.tone} opacity-10 blur-2xl transition group-hover:scale-125 group-hover:opacity-20`}
              />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-2xl ${action.soft}`}
                  >
                    <Icon size={20} />
                  </div>

                  <p className="mt-4 font-black text-slate-950">
                    {action.title}
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {action.description}
                  </p>
                </div>

                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-slate-400 shadow-sm transition group-hover:bg-blue-600 group-hover:text-white">
                  <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
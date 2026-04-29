import Link from 'next/link'

const actions = [
  {
    title: 'Audit planları',
    description: 'Bütün audit planlarına bax',
    href: '/dashboard/plans',
  },
  {
    title: 'Yeni audit yarat',
    description: 'Yeni audit planı əlavə et',
    href: '/dashboard/plans',
  },
  {
    title: 'Şablonlar',
    description: 'Audit checklist şablonlarını idarə et',
    href: '/dashboard/admin/templates',
  },
  {
    title: 'Audit müqayisəsi',
    description: 'İki audit nəticəsini müqayisə et',
    href: '/dashboard/compare',
  },
]

export default function QuickActions() {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="border-b pb-4">
        <h2 className="text-lg font-bold text-slate-900">Sürətli keçidlər</h2>
        <p className="text-sm text-slate-500">
          Ən çox istifadə olunan əməliyyatlar
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href + action.title}
            href={action.href}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <p className="font-bold text-slate-900">{action.title}</p>
            <p className="mt-1 text-sm text-slate-500">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
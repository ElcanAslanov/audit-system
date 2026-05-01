import { createClient } from '@/lib/supabase/server'
import CreatePlanModal from '@/components/audit/create-plan-modal'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PlanCard from '@/components/audit/plan-card'
import PlansViewSwitcher from '@/components/audit/plans-view-switcher'
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  Search,
  ShieldAlert,
} from 'lucide-react'

type PageProps = {
  searchParams?: Promise<{
    q?: string
    status?: string
    company_id?: string
    view?: string
  }>
}

function statusLabel(value?: string | null) {
  if (value === 'tamamlandi') return 'Tamamlandı'
  if (value === 'needs_attention') return 'Diqqət tələb edir'
  if (value === 'planlanan') return 'Planlanan'
  return value || '-'
}


export default async function PlansPage({ searchParams }: PageProps) {
  const params = await searchParams

  const q = params?.q?.trim() || ''
  const status = params?.status || ''
  const companyId = params?.company_id || ''


  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  if (!profile) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Profil tapılmadı.
      </div>
    )
  }

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .order('name', { ascending: true })

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name, company_id')
    .order('name', { ascending: true })

  const { data: templates } = await supabase
    .from('audit_templates')
    .select(`
    id,
    title,
    template_sections(
      id,
      title,
      sort_order
    )
  `)
    .order('title', { ascending: true })

  let assignableUsers: any[] = []

  if (allProfiles) {
    if (role === 'audit_muavini') {
      assignableUsers = allProfiles.filter((p: any) => p.role === 'auditor')
    } else if (role === 'admin' || role === 'rehber') {
      assignableUsers = allProfiles.filter((p: any) => p.role !== 'admin')
    }
  }

  let planQuery = supabase
    .from('audit_plans')
    .select(`
      *,
      companies(name),
      plan_assignments(profiles(full_name)),
      audit_answers(id)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    planQuery = planQuery.eq('status', status)
  }

  if (companyId) {
    planQuery = planQuery.eq('company_id', companyId)
  }

  if (q) {
    planQuery = planQuery.or(`title.ilike.%${q}%,department.ilike.%${q}%`)
  }

  const { data: plans, error: planError } = await planQuery

  if (planError) {
    console.error('Planları çəkərkən xəta:', planError)
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Planları yükləmək mümkün olmadı: {planError.message}
      </div>
    )
  }

  const normalizedPlans = (plans || []).map((plan: any) => ({
    ...plan,
    companies: Array.isArray(plan.companies)
      ? plan.companies[0] || null
      : plan.companies || null,
  }))

  const plansByDeadline = [...normalizedPlans].sort((a: any, b: any) => {
  const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER
  const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER

  return aTime - bTime
})

  const completedCount = normalizedPlans.filter(
    (plan: any) => plan.status === 'tamamlandi'
  ).length

  const riskCount = normalizedPlans.filter(
    (plan: any) => plan.status === 'needs_attention'
  ).length

  const plannedCount = normalizedPlans.filter(
    (plan: any) => !plan.status || plan.status === 'planlanan'
  ).length

  const selectedCompany = (companies || []).find(
    (company: any) => company.id === companyId
  )

  const hasFilters = Boolean(q || status || companyId)
  const canCreatePlan =
    role === 'admin' || role === 'rehber' || role === 'audit_muavini'

 

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Audit Planları
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Audit planlarını yaradın, izləyin və nəticələrə baxın.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {canCreatePlan && (
                <CreatePlanModal
                  companies={companies || []}
                  departments={departments || []}
                  auditors={assignableUsers}
                  templates={templates || []}
                />
              )}

              <Link
                href="/dashboard/compare"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                <BarChart3 size={16} />
                Müqayisə
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-500">Planlanan</p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {plannedCount}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <ClipboardCheck size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-emerald-700">
                  Tamamlandı
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {completedCount}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-red-700">
                  Diqqət tələb edir
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {riskCount}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-700">
                <ShieldAlert size={20} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Filter size={17} className="text-slate-500" />
                <h2 className="text-lg font-black text-slate-950">
                  Filterlər
                </h2>
              </div>
            </div>

            {hasFilters && (
              <Link
                href="/dashboard/plans"
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                Filterləri təmizlə
              </Link>
            )}
          </div>

          <form className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Axtarış
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Başlıq və ya departament..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Status
              </label>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Hamısı</option>
                <option value="planlanan">Planlanan</option>
                <option value="tamamlandi">Tamamlandı</option>
                <option value="needs_attention">Diqqət tələb edir</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Şirkət
              </label>
              <select
                name="company_id"
                defaultValue={companyId}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Hamısı</option>
                {(companies || []).map((company: any) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end lg:col-span-2">
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Filterlə
              </button>
            </div>
          </form>

          {hasFilters && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {q && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                  Axtarış: {q}
                </span>
              )}

              {status && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700">
                  Status: {statusLabel(status)}
                </span>
              )}

              {companyId && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                  Şirkət: {selectedCompany?.name || companyId}
                </span>
              )}
            </div>
          )}
        </section>

   <PlansViewSwitcher
  plans={normalizedPlans}
  canCreatePlan={canCreatePlan}
  currentUserId={user.id}
  currentUserRole={role || undefined}
/>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
  <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-lg font-black text-slate-950">
        Deadline sıralaması
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Planlar son tarixə görə yaxından uzağa sıralanır.
      </p>
    </div>

    <span className="w-fit rounded-full bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700">
      Yaxın tarix → uzaq tarix
    </span>
  </div>

  <div className="overflow-hidden rounded-2xl border border-slate-200">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-black text-slate-600">
              #
            </th>
            <th className="px-4 py-3 text-left font-black text-slate-600">
              Plan
            </th>
            <th className="px-4 py-3 text-left font-black text-slate-600">
              Şirkət
            </th>
            <th className="px-4 py-3 text-left font-black text-slate-600">
              Departament
            </th>
            <th className="px-4 py-3 text-left font-black text-slate-600">
              Deadline
            </th>
            <th className="px-4 py-3 text-left font-black text-slate-600">
              Status
            </th>
            <th className="px-4 py-3 text-right font-black text-slate-600">
              Bax
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {plansByDeadline.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-8 text-center text-sm text-slate-500"
              >
                Deadline üzrə göstəriləcək plan yoxdur.
              </td>
            </tr>
          )}

          {plansByDeadline.map((plan: any, index: number) => (
            <tr key={plan.id} className="transition hover:bg-slate-50">
              <td className="px-4 py-3 font-bold text-slate-500">
                {index + 1}
              </td>

              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/plans/${plan.id}`}
                  className="font-black text-slate-900 hover:text-blue-600"
                >
                  {plan.title}
                </Link>
              </td>

              <td className="px-4 py-3 text-slate-700">
                {plan.companies?.name || '-'}
              </td>

              <td className="px-4 py-3 text-slate-700">
                {plan.department || '-'}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    plan.due_date
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {plan.due_date || 'Son tarix yoxdur'}
                </span>
              </td>

              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {statusLabel(plan.status)}
                </span>
              </td>

              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dashboard/plans/${plan.id}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Bax
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</section>
      </div>
    </div>
  )
}
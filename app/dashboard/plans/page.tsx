import { createClient } from '@/lib/supabase/server'
import CreatePlanModal from '@/components/audit/create-plan-modal'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PlanDeleteButton from '@/components/audit/plan-delete-button'
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Filter,
  PencilLine,
  Search,
  ShieldAlert,
} from 'lucide-react'

type PageProps = {
  searchParams?: Promise<{
    q?: string
    status?: string
    company_id?: string
  }>
}

function statusLabel(value?: string | null) {
  if (value === 'tamamlandi') return 'Tamamlandı'
  if (value === 'needs_attention') return 'Diqqət tələb edir'
  if (value === 'planlanan') return 'Planlanan'
  return value || '-'
}

function statusClass(value?: string | null) {
  if (value === 'tamamlandi') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (value === 'needs_attention') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function scoreClass(score?: number | null) {
  const value = Number(score || 0)

  if (value >= 80) return 'bg-emerald-50 text-emerald-700'
  if (value >= 50) return 'bg-yellow-50 text-yellow-700'
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

       <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
  <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-lg font-black text-slate-950">
        Cari Planlar
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {normalizedPlans.length} audit planı göstərilir.
      </p>
    </div>
  </div>

  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
    {normalizedPlans.length === 0 && (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center xl:col-span-2">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
          <ClipboardCheck size={22} />
        </div>
        <h3 className="mt-4 font-black text-slate-900">
          Audit planı tapılmadı
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Seçilmiş filterlərə uyğun nəticə yoxdur.
        </p>
      </div>
    )}

    {normalizedPlans.map((plan: any) => {
      const assignedNames =
        plan.plan_assignments?.length > 0
          ? plan.plan_assignments
              .map((a: any) => a.profiles?.full_name)
              .filter(Boolean)
              .join(', ')
          : 'Təyin olunmayıb'

      const hasAnswers = (plan.audit_answers?.length || 0) > 0
      const fillButtonLabel = hasAnswers ? 'Redaktə et' : 'Doldur'
      const answerCount = plan.audit_answers?.length || 0

      return (
        <article
          key={plan.id}
          className="group flex min-h-[255px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />

          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-lg font-black leading-snug text-slate-950">
                  {plan.title}
                </h3>

                <p className="mt-2 line-clamp-1 text-sm text-slate-500">
                  {plan.department || '-'} • {plan.companies?.name || '-'}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${scoreClass(
                  plan.score
                )}`}
              >
                {plan.score ?? 0}%
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                  plan.status
                )}`}
              >
                {statusLabel(plan.status)}
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                {answerCount} cavab
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                Son tarix: {formatDate(plan.due_date)}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Auditorlar
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-700">
                {assignedNames}
              </p>
            </div>

            <div className="mt-auto pt-4">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/dashboard/plans/${plan.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <FileText size={16} />
                  Bax
                </Link>

                <Link
                  href={`/dashboard/plans/${plan.id}/fill`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  <PencilLine size={16} />
                  {fillButtonLabel}
                </Link>

                {hasAnswers && (
                  <Link
                    href={`/dashboard/plans/${plan.id}/report`}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    PDF
                  </Link>
                )}

                {canCreatePlan && <PlanDeleteButton planId={plan.id} />}
              </div>
            </div>
          </div>
        </article>
      )
    })}
  </div>
</section>
      </div>
    </div>
  )
}
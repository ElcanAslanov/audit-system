import { createClient } from '@/lib/supabase/server'
import CreatePlanPanel from '@/components/audit/create-plan-panel'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PlanDeleteButton from '@/components/audit/plan-delete-button'

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

  const { data: templates } = await supabase
    .from('audit_templates')
    .select('id, title')
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

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Audit Planları
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Audit planlarını yaradın, auditorlara təyin edin, nəticələri izləyin
            və müqayisə hesabatları çıxarın.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex w-full justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard/compare"
            className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            Audit Müqayisəsi
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Planlanan</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {plannedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Tamamlandı</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">
            {completedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-700">
            Diqqət tələb edir
          </p>
          <p className="mt-2 text-3xl font-black text-red-700">{riskCount}</p>
        </div>
      </section>

    {(role === 'admin' || role === 'rehber' || role === 'audit_muavini') && (
  <CreatePlanPanel
    companies={companies || []}
    auditors={assignableUsers}
    templates={templates || []}
  />
)}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 border-b pb-4">
          <h2 className="text-xl font-bold text-slate-900">Filterlər</h2>
          <p className="text-sm text-slate-500">
            Audit planlarını axtarış, status və şirkət üzrə süzün.
          </p>
        </div>

        <form className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Axtarış
            </label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Başlıq və ya departament üzrə axtar..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Status
            </label>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Hamısı</option>
              <option value="planlanan">Planlanan</option>
              <option value="tamamlandi">Tamamlandı</option>
              <option value="needs_attention">Diqqət tələb edir</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Şirkət
            </label>
            <select
              name="company_id"
              defaultValue={companyId}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Hamısı</option>
              {(companies || []).map((company: any) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 lg:col-span-2 lg:justify-end">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Filterlə
            </button>

            <Link
              href="/dashboard/plans"
              className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Təmizlə
            </Link>
          </div>
        </form>

        {(q || status || companyId) && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {q && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                Axtarış: {q}
              </span>
            )}

            {status && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                Status: {statusLabel(status)}
              </span>
            )}

            {companyId && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                Şirkət: {selectedCompany?.name || companyId}
              </span>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Cari Planlar ({normalizedPlans.length})
            </h2>
            <p className="text-sm text-slate-500">
              Mövcud audit planları və onların icra vəziyyəti
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {normalizedPlans.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Seçilmiş filterlərə uyğun audit planı tapılmadı.
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
            const fillButtonLabel = hasAnswers ? 'Redaktə et' : 'Auditi Doldur'

            return (
              <article
                key={plan.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between lg:justify-start">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold text-slate-900">
                          {plan.title}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {plan.department || '-'} •{' '}
                          {plan.companies?.name || '-'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                            plan.status
                          )}`}
                        >
                          {statusLabel(plan.status)}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${scoreClass(
                            plan.score
                          )}`}
                        >
                          {plan.score ?? 0}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs font-medium uppercase text-slate-500">
      Son tarix
    </p>
    <p className="mt-1 font-semibold text-slate-800">
      {plan.due_date || '-'}
    </p>
  </div>

  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs font-medium uppercase text-slate-500">
      Auditorlar
    </p>
    <p className="mt-1 line-clamp-2 font-semibold text-slate-800">
      {assignedNames}
    </p>
  </div>

  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs font-medium uppercase text-slate-500">
      Status
    </p>
    <p className="mt-1 font-semibold text-slate-800">
      {statusLabel(plan.status)}
    </p>
  </div>

  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs font-medium uppercase text-slate-500">
      Cavab sayı
    </p>
    <p className="mt-1 font-semibold text-slate-800">
      {plan.audit_answers?.length || 0}
    </p>
  </div>
</div>
                  </div>

               <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
  <Link
    href={`/dashboard/plans/${plan.id}`}
    className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
  >
    Bax
  </Link>

<Link
  href={`/dashboard/plans/${plan.id}/fill`}
  className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
>
  {fillButtonLabel}
</Link>

{hasAnswers && (
  <Link
    href={`/dashboard/plans/${plan.id}/report`}
    className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
  >
    PDF Hesabat
  </Link>
)}

  {(role === 'admin' ||
    role === 'rehber' ||
    role === 'audit_muavini') && (
    <PlanDeleteButton planId={plan.id} />
  )}
</div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
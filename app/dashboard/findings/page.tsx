import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FindingStatusSelect from '@/components/audit/finding-status-select'

type PageProps = {
  searchParams?: Promise<{
    q?: string
    status?: string
    severity?: string
    overdue?: string
  }>
}

function severityClass(value?: string | null) {
  if (value === 'high') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'medium') return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function statusLabel(value?: string | null) {
  if (value === 'aciq') return 'Açıq'
  if (value === 'icrada') return 'İcrada'
  if (value === 'hell_olundu') return 'Həll olundu'
  return value || '-'
}

function isOverdue(deadline?: string | null, status?: string | null) {
  if (!deadline) return false
  if (status === 'hell_olundu') return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(deadline)
  due.setHours(0, 0, 0, 0)

  return due < today
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value)
  })

  const query = search.toString()
  return query ? `/dashboard/findings?${query}` : '/dashboard/findings'
}

export default async function FindingsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const q = params?.q?.trim() || ''
  const status = params?.status || ''
  const severity = params?.severity || ''
  const overdue = params?.overdue === '1'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let query = supabase
    .from('findings')
    .select(`
      id,
      title,
      severity,
      description,
      deadline,
      status,
      assigned_to,
      plan_id,
      profiles(full_name),
      audit_plans(
        id,
        title,
        department,
        score,
        status,
        companies(name)
      )
    `)
    .order('deadline', { ascending: true, nullsFirst: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (severity) {
    query = query.eq('severity', severity)
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data: findings, error } = await query

  if (error) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Çatışmazlıqlar yüklənərkən xəta: {error.message}
      </div>
    )
  }

  let normalizedFindings = (findings || []).map((finding: any) => ({
    ...finding,
    audit_plans: Array.isArray(finding.audit_plans)
      ? finding.audit_plans[0] || null
      : finding.audit_plans || null,
  }))

  if (overdue) {
    normalizedFindings = normalizedFindings.filter((finding: any) =>
      isOverdue(finding.deadline, finding.status)
    )
  }

  const openCount = normalizedFindings.filter(
    (f: any) => f.status === 'aciq'
  ).length

  const inProgressCount = normalizedFindings.filter(
    (f: any) => f.status === 'icrada'
  ).length

  const resolvedCount = normalizedFindings.filter(
    (f: any) => f.status === 'hell_olundu'
  ).length

  const highCount = normalizedFindings.filter(
    (f: any) => f.severity === 'high'
  ).length

  const overdueCount = normalizedFindings.filter((f: any) =>
    isOverdue(f.deadline, f.status)
  ).length

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Çatışmazlıqlar
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Audit zamanı aşkarlanan çatışmazlıqları izləyin, filterləyin və
            statuslarını yeniləyin.
          </p>
        </div>

        <Link
          href="/dashboard/plans"
          className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
        >
          Audit Planları
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Ümumi çatışmazlıq</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {normalizedFindings.length}
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-700">High risk</p>
          <p className="mt-2 text-3xl font-black text-red-700">{highCount}</p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">İcrada</p>
          <p className="mt-2 text-3xl font-black text-blue-700">
            {inProgressCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Həll olunan</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">
            {resolvedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">Gecikmiş</p>
          <p className="mt-2 text-3xl font-black text-orange-700">
            {overdueCount}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 border-b pb-4">
          <h2 className="text-xl font-bold text-slate-900">Filterlər</h2>
          <p className="text-sm text-slate-500">
            çatışmazlıqları status, risk və axtarışa görə süzün.
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
              placeholder="Başlıq və ya təsvir üzrə axtar..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Status
            </label>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Hamısı</option>
              <option value="aciq">Açıq</option>
              <option value="icrada">İcrada</option>
              <option value="hell_olundu">Həll olundu</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Risk
            </label>
            <select
              name="severity"
              defaultValue={severity}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Hamısı</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-end lg:col-span-2">
            <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                name="overdue"
                value="1"
                defaultChecked={overdue}
              />
              Gecikmiş
            </label>
          </div>

          <div className="flex flex-col gap-2 lg:col-span-2 lg:justify-end">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Filterlə
            </button>

            <Link
              href="/dashboard/findings"
              className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Təmizlə
            </Link>
          </div>
        </form>

        {(q || status || severity || overdue) && (
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

            {severity && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700">
                Risk: {severity}
              </span>
            )}

            {overdue && (
              <span className="rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-700">
                Gecikmiş
              </span>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Çatışmazlıq siyahısı
            </h2>
            <p className="text-sm text-slate-500">
              Açıq çatışmazlıqlar: {openCount}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4">
          {normalizedFindings.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Seçilmiş filterlərə uyğun çatışmazlıq yoxdur.
            </div>
          )}

          {normalizedFindings.map((finding: any, index: number) => {
            const plan = finding.audit_plans
            const company = Array.isArray(plan?.companies)
              ? plan.companies[0] || null
              : plan?.companies || null

            const overdueFinding = isOverdue(finding.deadline, finding.status)

            return (
              <article
                key={finding.id}
                className={`rounded-2xl border p-4 transition hover:border-blue-200 hover:bg-blue-50/20 sm:p-5 ${
                  overdueFinding
                    ? 'border-orange-200 bg-orange-50/40'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">
                          Çatışmazlıq #{index + 1}
                        </p>

                        <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                          {finding.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {finding.description || '-'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase ${severityClass(
                            finding.severity
                          )}`}
                        >
                          {finding.severity || 'low'}
                        </span>

                        {overdueFinding && (
                          <span className="inline-flex w-fit rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase text-orange-700">
                            Gecikmiş
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase text-slate-500">
                          Status
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {statusLabel(finding.status)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase text-slate-500">
                          Deadline
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {finding.deadline || '-'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase text-slate-500">
                          Cavabdeh
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {finding.profiles?.full_name || '-'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase text-slate-500">
                          Audit
                        </p>
                        <p className="mt-1 line-clamp-2 font-semibold text-slate-800">
                          {plan?.title || '-'}
                        </p>
                      </div>
                    </div>

                    {plan && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                        <p className="font-semibold text-slate-900">
                          {plan.title}
                        </p>
                        <p className="mt-1 text-slate-500">
                          {company?.name || '-'} • {plan.department || '-'} •
                          Score: {plan.score ?? 0}%
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-56 lg:flex-col">
                    <FindingStatusSelect
                      findingId={finding.id}
                      planId={finding.plan_id}
                      currentStatus={finding.status}
                    />

                    {plan && (
                      <Link
                        href={`/dashboard/plans/${plan.id}`}
                        className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Auditə bax
                      </Link>
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
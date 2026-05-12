import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { Suspense } from 'react'
import { BarChart3 } from 'lucide-react'
import PlansKpiSection from './plans-kpi-section'
import PlansFilterSection from './plans-filter-section'
import PlansContentSection from './plans-content-section'
import { getUserProfile } from '@/lib/actions'
import CreatePlanHeaderButton from './create-plan-header-button'

type PageProps = {
  searchParams?: Promise<{
    q?: string
    status?: string
    company_id?: string
    page?: string
  }>
}

export default async function PlansPage({ searchParams }: PageProps) {
  const params = await searchParams
  const q = params?.q?.trim() || ''
  const status = params?.status || ''
  const companyId = params?.company_id || ''
  const page = Math.max(Number(params?.page || 1), 1)

  const profile = await getUserProfile()
  if (!profile) redirect('/login')

  const userId = profile.userId || profile.id
  const role = profile.role || ''

  const canCreatePlan =
    role === 'admin' || role === 'rehber' || role === 'audit_muavini'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Audit Plans
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Audit planlarını idarə edin, statuslara baxın və icra prosesini
                izləyin.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
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

        {canCreatePlan && (
          <Suspense fallback={<HeaderButtonSkeleton />}>
            <CreatePlanHeaderButton
              role={role}
              companyId={profile.company_id}
            />
          </Suspense>
        )}

        <Suspense fallback={<KpiSkeleton />}>
          <PlansKpiSection
            userId={userId}
            role={role}
            companyId={companyId}
            q={q}
          />
        </Suspense>

        <Suspense fallback={<FilterSkeleton />}>
          <PlansFilterSection q={q} status={status} companyId={companyId} />
        </Suspense>

        <Suspense fallback={<PlansListSkeleton />}>
          <PlansContentSection
            userId={userId}
            role={role}
            currentCompanyId={profile.company_id}
            q={q}
            status={status}
            companyId={companyId}
            page={page}
          />
        </Suspense>
      </div>
    </div>
  )
}

function HeaderButtonSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="h-10 w-full animate-pulse rounded-2xl bg-slate-100 sm:w-36" />
    </div>
  )
}

function KpiSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
        />
      ))}
    </section>
  )
}

function FilterSkeleton() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <div className="h-5 w-28 animate-pulse rounded-full bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="h-11 animate-pulse rounded-2xl bg-slate-100 lg:col-span-4" />
        <div className="h-11 animate-pulse rounded-2xl bg-slate-100 lg:col-span-3" />
        <div className="h-11 animate-pulse rounded-2xl bg-slate-100 lg:col-span-3" />
        <div className="h-11 animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
      </div>
    </section>
  )
}

function PlansListSkeleton() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 space-y-2 border-b border-slate-100 pb-4">
        <div className="h-5 w-40 animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-64 animate-pulse rounded-full bg-slate-100" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    </section>
  )
}
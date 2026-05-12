import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { CheckCircle2, ClipboardCheck, ShieldAlert } from 'lucide-react'

type Props = {
  userId: string
  role: string
  companyId: string
  q: string
}

export default async function PlansKpiSection({
  userId,
  role,
  companyId,
  q,
}: Props) {
  const t = await getTranslations('plans')
  const supabase = await createClient()

  const isAdmin = role === 'admin'
  const isMusahideci = role === 'musahideci'
  const canViewAllPlans = isAdmin || isMusahideci

  let visiblePlanIds: string[] = []

  if (!canViewAllPlans) {
    const [assignedRes, viewerRes] = await Promise.all([
      supabase.from('plan_assignments').select('plan_id').eq('user_id', userId),
      supabase
        .from('audit_plan_viewers')
        .select('plan_id')
        .eq('user_id', userId),
    ])

    const ids = [
      ...(assignedRes.data || []).map((row: any) => row.plan_id),
      ...(viewerRes.data || []).map((row: any) => row.plan_id),
    ].filter(Boolean)

    visiblePlanIds = Array.from(new Set(ids))
  }

  const applySharedFilters = (query: any) => {
    let nextQuery = query

    if (companyId) {
      nextQuery = nextQuery.eq('company_id', companyId)
    }

    if (q) {
      nextQuery = nextQuery.or(`title.ilike.%${q}%,department.ilike.%${q}%`)
    }

    if (!canViewAllPlans) {
      const orParts = [`created_by.eq.${userId}`]

      if (visiblePlanIds.length > 0) {
        orParts.push(`id.in.(${visiblePlanIds.join(',')})`)
      }

      nextQuery = nextQuery.or(orParts.join(','))
    }

    return nextQuery
  }

  const buildKpiQuery = (statusValue: string | null) => {
    let query = supabase
      .from('audit_plans')
      .select('id', { count: 'exact', head: true })

    if (statusValue === null) {
      query = query.or('status.eq.planlanan,status.is.null')
    } else {
      query = query.eq('status', statusValue)
    }

    return applySharedFilters(query)
  }

  const [completedRes, riskRes, plannedRes] = await Promise.all([
    buildKpiQuery('tamamlandi'),
    buildKpiQuery('needs_attention'),
    buildKpiQuery(null),
  ])

  const completedCount = completedRes.count || 0
  const riskCount = riskRes.count || 0
  const plannedCount = plannedRes.count || 0

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-500">{t('planned')}</p>
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
              {t('completed')}
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
              {t('needsAttention')}
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
  )
} 
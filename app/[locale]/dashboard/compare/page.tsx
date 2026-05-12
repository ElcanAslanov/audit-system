import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import CompareAuditForm from '@/components/audit/compare-audit-form'
import { getUserProfile } from '@/lib/actions'

export default async function ComparePage() {
  const [t, profile] = await Promise.all([
    getTranslations('comparePage'),
    getUserProfile(),
  ])

  if (!profile) redirect('/login')

  const supabase = await createClient()

  const userId = profile.userId || profile.id
  const role = profile.role || ''
  const isAdmin = role === 'admin'

  let plansQuery = supabase
    .from('audit_plans')
    .select(
      `
      id,
      title,
      department,
      status,
      score,
      created_at,
      company_id,
      created_by,
      locked_view,
      companies(id, name)
    `
    )
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    plansQuery = plansQuery.or(`locked_view.eq.false,created_by.eq.${userId}`)
  }

  const { data: plansData, error: plansError } = await plansQuery

  if (plansError) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        {t('auditsLoadError', { message: plansError.message })}
      </div>
    )
  }

  const normalizedPlans = (plansData || []).map((plan: any) => ({
    ...plan,
    companies: Array.isArray(plan.companies)
      ? plan.companies[0] || null
      : plan.companies || null,
  }))

  const visiblePlanIds = normalizedPlans.map((plan: any) => plan.id).filter(Boolean)

  let plansWithComposition = normalizedPlans

  if (visiblePlanIds.length > 0) {
    const { data: answersForComposition, error: compositionError } =
      await supabase
        .from('audit_answers')
        .select(
          `
          plan_id,
          question_id,
          template_questions(
            id,
            template_sections(
              id
            )
          )
        `
        )
        .in('plan_id', visiblePlanIds)

    if (compositionError) {
      return (
        <div className="p-4 text-red-600 sm:p-6 lg:p-8">
          {t('compositionLoadError', { message: compositionError.message })}
        </div>
      )
    }

    const compositionMap = new Map<
      string,
      {
        questionIds: Set<string>
        sectionIds: Set<string>
      }
    >()

    for (const plan of normalizedPlans as any[]) {
      compositionMap.set(String(plan.id), {
        questionIds: new Set<string>(),
        sectionIds: new Set<string>(),
      })
    }

    for (const answer of answersForComposition || []) {
      const planId = String((answer as any).plan_id)
      const composition = compositionMap.get(planId)

      if (!composition) continue

      const question = Array.isArray((answer as any).template_questions)
        ? (answer as any).template_questions[0] || null
        : (answer as any).template_questions || null

      const section = Array.isArray(question?.template_sections)
        ? question.template_sections[0] || null
        : question?.template_sections || null

      if ((answer as any).question_id) {
        composition.questionIds.add(String((answer as any).question_id))
      }

      if (section?.id) {
        composition.sectionIds.add(String(section.id))
      }
    }

    plansWithComposition = normalizedPlans.map((plan: any) => {
      const composition = compositionMap.get(String(plan.id))

      return {
        ...plan,
        questionIds: Array.from(composition?.questionIds || []),
        sectionIds: Array.from(composition?.sectionIds || []),
      }
    })
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="border-b pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {t('title')}
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {t('subtitle')}
        </p>
      </div>

      <CompareAuditForm plans={plansWithComposition} />
    </div>
  )
}
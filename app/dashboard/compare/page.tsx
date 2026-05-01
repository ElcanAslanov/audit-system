import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CompareAuditForm from '@/components/audit/compare-audit-form'

export default async function ComparePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Profil yüklənərkən xəta: {profileError.message}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Profil tapılmadı.
      </div>
    )
  }

  const isAdmin = profile.role === 'admin'

  const { data: plans, error } = await supabase
    .from('audit_plans')
    .select(`
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
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Auditlər yüklənərkən xəta: {error.message}
      </div>
    )
  }

  const normalizedPlans = (plans || [])
    .filter((plan: any) => {
      if (!plan.locked_view) return true
      if (isAdmin) return true
      return plan.created_by === user.id
    })
    .map((plan: any) => ({
      ...plan,
      companies: Array.isArray(plan.companies)
        ? plan.companies[0] || null
        : plan.companies || null,
    }))

  const visiblePlanIds = normalizedPlans.map((plan: any) => plan.id)

let plansWithComposition = normalizedPlans

if (visiblePlanIds.length > 0) {
  const { data: answersForComposition, error: compositionError } = await supabase
    .from('audit_answers')
    .select(`
      plan_id,
      question_id,
      template_questions(
        id,
        template_sections(
          id
        )
      )
    `)
    .in('plan_id', visiblePlanIds)

  if (compositionError) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Müqayisə tərkibi yüklənərkən xəta: {compositionError.message}
      </div>
    )
  }

  const compositionMap = new Map<string, {
    questionIds: Set<string>
    sectionIds: Set<string>
  }>()

  for (const plan of normalizedPlans as any[]) {
    compositionMap.set(plan.id, {
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
    const composition = compositionMap.get(plan.id)

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
          Audit Müqayisəsi
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Şirkət, departament və audit planları üzrə score, risk, checklist
          sualları və cavab nəticələrini müqayisə edin.
        </p>
      </div>

      <CompareAuditForm plans={plansWithComposition} />
    </div>
  )
}
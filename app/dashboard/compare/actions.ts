'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAuditCompareData(leftId: string, rightId: string) {
  const supabase = await createClient()

  if (!leftId || !rightId) {
    return {
      success: false,
      error: 'İki audit seçilməlidir.',
      left: null,
      right: null,
    }
  }

  async function getOneAudit(planId: string) {
    const { data: plan, error: planError } = await supabase
      .from('audit_plans')
      .select('id, title, department, status, score, created_at, companies(name)')
      .eq('id', planId)
      .maybeSingle()

    if (planError) throw planError

    const { data: answers, error: answersError } = await supabase
      .from('audit_answers')
      .select(`
        id,
        response,
        comment,
        score,
        template_questions(question_text, max_score)
      `)
      .eq('plan_id', planId)

    if (answersError) throw answersError

    const { data: findings, error: findingsError } = await supabase
      .from('findings')
      .select('id, title, severity, status, deadline')
      .eq('plan_id', planId)

    if (findingsError) throw findingsError

   return {
  ...plan,
  companies: Array.isArray((plan as any)?.companies)
    ? (plan as any).companies[0] || null
    : (plan as any)?.companies || null,
  answers: answers || [],
  findings: findings || [],
}
  }

  try {
    const [left, right] = await Promise.all([
      getOneAudit(leftId),
      getOneAudit(rightId),
    ])

    return {
      success: true,
      error: null,
      left,
      right,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Audit müqayisəsi yüklənərkən xəta baş verdi.',
      left: null,
      right: null,
    }
  }
}
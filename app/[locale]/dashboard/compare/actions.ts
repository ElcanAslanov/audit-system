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

  if (leftId === rightId) {
    return {
      success: false,
      error: 'Eyni audit özü ilə müqayisə edilə bilməz.',
      left: null,
      right: null,
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'İstifadəçi tapılmadı.',
      left: null,
      right: null,
    }
  }

  const userId = user.id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    return {
      success: false,
      error: profileError.message,
      left: null,
      right: null,
    }
  }

  const isAdmin = profile?.role === 'admin'

 function getQuestionAndSectionKeys(audit: any) {
  const questionIds = new Set<string>()
  const sectionIds = new Set<string>()

  for (const answer of audit?.answers || []) {
    const question = Array.isArray(answer.template_questions)
      ? answer.template_questions[0] || null
      : answer.template_questions || null

    const section = Array.isArray(question?.template_sections)
      ? question.template_sections[0] || null
      : question?.template_sections || null

    const questionId = answer.question_id || question?.id
    const sectionId = section?.id

    if (questionId) questionIds.add(String(questionId))
    if (sectionId) sectionIds.add(String(sectionId))
  }

  return {
    questionIds,
    sectionIds,
  }
}

  function hasAnyIntersection(a: Set<string>, b: Set<string>) {
    for (const value of a) {
      if (b.has(value)) return true
    }

    return false
  }

  async function getOneAudit(planId: string) {
    const { data: plan, error: planError } = await supabase
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
        locked_edit,
        companies(id, name)
      `)
      .eq('id', planId)
      .maybeSingle()

    if (planError) throw planError

    if (!plan) {
      throw new Error('Audit planı tapılmadı.')
    }

    const isCreator = (plan as any).created_by === userId
    const isViewLocked = Boolean((plan as any).locked_view)

    if (isViewLocked && !isAdmin && !isCreator) {
      throw new Error(
        `"${(plan as any).title}" audit planına baxış kilidlənib.`
      )
    }

    const { data: answers, error: answersError } = await supabase
      .from('audit_answers')
      .select(`
        id,
        plan_id,
        question_id,
        response,
        comment,
        score,
        template_questions(
          id,
          question_text,
          max_score,
          sort_order,
          template_sections(
            id,
            title,
            sort_order,
            audit_templates(id, title)
          )
        )
      `)
      .eq('plan_id', planId)

    if (answersError) throw answersError

    const { data: findings, error: findingsError } = await supabase
      .from('findings')
      .select(`
        id,
        title,
        severity,
        status,
        deadline,
        description
      `)
      .eq('plan_id', planId)

    if (findingsError) throw findingsError

    const normalizedAnswers = (answers || []).map((answer: any) => {
      const question = Array.isArray(answer.template_questions)
        ? answer.template_questions[0] || null
        : answer.template_questions || null

      const section = Array.isArray(question?.template_sections)
        ? question.template_sections[0] || null
        : question?.template_sections || null

      const template = Array.isArray(section?.audit_templates)
        ? section.audit_templates[0] || null
        : section?.audit_templates || null

      return {
        ...answer,
        template_questions: question
          ? {
            ...question,
            template_sections: section
              ? {
                ...section,
                audit_templates: template,
              }
              : null,
          }
          : null,
      }
    })

    return {
      ...plan,
      companies: Array.isArray((plan as any)?.companies)
        ? (plan as any).companies[0] || null
        : (plan as any)?.companies || null,
      answers: normalizedAnswers,
      findings: findings || [],
    }
  }

  try {
    const [left, right] = await Promise.all([
      getOneAudit(leftId),
      getOneAudit(rightId),
    ])

    const leftKeys = getQuestionAndSectionKeys(left)
    const rightKeys = getQuestionAndSectionKeys(right)

const hasSameQuestion = hasAnyIntersection(
  leftKeys.questionIds,
  rightKeys.questionIds
)

if (!hasSameQuestion) {
  return {
    success: false,
    error:
      'Bu iki plan müqayisə edilə bilməz. Planlarda ən azı 1 eyni sual tapılmadı.',
    left: null,
    right: null,
  }
}

    return {
      success: true,
      error: null,
      left,
      right,
     compareMeta: {
  hasSameQuestion,
  leftQuestionCount: leftKeys.questionIds.size,
  rightQuestionCount: rightKeys.questionIds.size,
},
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
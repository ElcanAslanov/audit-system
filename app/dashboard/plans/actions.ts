'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  error: string | null;
  success: boolean;
};

/**
 * Fayl adını təmizləyən köməkçi funksiya.
 * Azərbaycan hərflərini, boşluqları və xüsusi simvolları təmizləyir.
 */
function sanitizeFilename(filename: string): string {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/gi, "")
    .toLowerCase();
}
async function getCurrentProfileRole(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return { role: null, error: error.message }
  }

  return {
    role: String(profile?.role || '').toLowerCase(),
    error: null,
  }
}

function isObserverRole(role: string | null) {
  return role === 'musahideci'
}

function observerReadOnlyError(): ActionState {
  return {
    error: 'Müşahidəçi yalnız baxış icazəsinə malikdir.',
    success: false,
  }
}
// --- 1. Audit Planı Yaratma ---
export async function createAuditPlan(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'İstifadəçi tapılmadı', success: false }
const currentRole = await getCurrentProfileRole(supabase, user.id)

if (currentRole.error) {
  return { error: currentRole.error, success: false }
}

if (isObserverRole(currentRole.role)) {
  return observerReadOnlyError()
}
  const title = String(formData.get('title') || '').trim()
  const companyId = String(formData.get('company_id') || '')
  const templateIds = formData.getAll('template_ids') as string[]
  const selectedSectionIds = formData.getAll('template_section_ids') as string[]
  const templateId = templateIds[0] || ''
  const dueDate = String(formData.get('due_date') || '')
  const startDate = String(formData.get('start_date') || '')
  const notes = String(formData.get('notes') || '')
  const department = String(formData.get('department') || '')

  const validStartDate =
    !startDate || /^\d{4}-\d{2}-\d{2}$/.test(startDate)

  const validDueDate =
    !dueDate || /^\d{4}-\d{2}-\d{2}$/.test(dueDate)

  if (!validStartDate) {
    return { error: 'Başlama tarixi düzgün formatda deyil.', success: false }
  }

  if (!validDueDate) {
    return { error: 'Son tarix düzgün formatda deyil.', success: false }
  }

  if (startDate && dueDate && startDate > dueDate) {
    return {
      error: 'Başlama tarixi son tarixdən sonra ola bilməz.',
      success: false,
    }
  }

  if (!title) {
    return { error: 'Plan başlığı daxil edilməlidir.', success: false }
  }

  if (!companyId) {
    return { error: 'Şirkət seçilməlidir.', success: false }
  }

  if (templateIds.length === 0) {
    return { error: 'Ən azı 1 audit şablonu seçilməlidir.', success: false }
  }

  if (selectedSectionIds.length === 0) {
    return { error: 'Ən azı 1 şablon bölməsi seçilməlidir.', success: false }
  }

  let fileUrl: string | null = null
  const file = formData.get('file') as File | null

  try {
    if (file && file.size > 0) {
      const safeName = sanitizeFilename(file.name)
      const fileName = `${Date.now()}_${safeName}`
      const filePath = `plans/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('audit-docs')
        .upload(filePath, file)

      if (uploadError) {
        return {
          error: 'Fayl yüklənərkən xəta: ' + uploadError.message,
          success: false,
        }
      }

      fileUrl = filePath
    }

    const { data: plan, error: planError } = await supabase
      .from('audit_plans')
      .insert([
        {
          title,
          department: department || null,
          company_id: companyId,
          template_id: templateId,
          due_date: dueDate || null,
          start_date: startDate || null,
          notes,
          file_url: fileUrl,
          created_by: user.id,
          status: 'planlanan',
          score: 0,
        },
      ])
      .select()
      .single()

    if (planError) throw planError

    const uniqueTemplateIds = Array.from(new Set(templateIds.filter(Boolean)))

    const planTemplates = uniqueTemplateIds.map((id) => ({
      plan_id: plan.id,
      template_id: id,
    }))

    const uniqueSectionPairs = Array.from(
      new Set(selectedSectionIds.filter(Boolean))
    )

    const planTemplateSections = uniqueSectionPairs
      .map((value) => {
        const [template_id, section_id] = String(value).split(':')

        if (!template_id || !section_id) return null
        if (!uniqueTemplateIds.includes(template_id)) return null

        return {
          plan_id: plan.id,
          template_id,
          section_id,
        }
      })
      .filter(Boolean)

    if (planTemplateSections.length === 0) {
      throw new Error('Seçilmiş bölmələr tapılmadı.')
    }

    const assignedIds = formData.getAll('assigned_to') as string[]

    const assignments = Array.from(new Set(assignedIds.filter(Boolean))).map(
      (id) => ({
        plan_id: plan.id,
        user_id: id,
      })
    )

    const insertTasks = [
      supabase.from('audit_plan_templates').insert(planTemplates),
      supabase.from('audit_plan_template_sections').insert(planTemplateSections),
    ]

    if (assignments.length > 0) {
      insertTasks.push(supabase.from('plan_assignments').insert(assignments))
    }

    const [planTemplatesResult, planTemplateSectionsResult, assignmentsResult] =
      await Promise.all(insertTasks)

    if (planTemplatesResult.error) {
      throw planTemplatesResult.error
    }

    if (planTemplateSectionsResult.error) {
      throw planTemplateSectionsResult.error
    }

    if (assignmentsResult?.error) {
      throw assignmentsResult.error
    }

    revalidatePath('/dashboard/plans')
    revalidatePath('/dashboard')

    return { error: null, success: true }
  } catch (err: any) {
    if (fileUrl) {
      await supabase.storage.from('audit-docs').remove([fileUrl])
    }

    return {
      error: err.message || 'Audit planı yaradılarkən xəta baş verdi.',
      success: false,
    }
  }
}

// --- 2. çatışmazlıq (Finding) Əlavə Etmə ---
export async function addFinding(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'İstifadəçi tapılmadı', success: false }
  }
const currentRole = await getCurrentProfileRole(supabase, user.id)

if (currentRole.error) {
  return { error: currentRole.error, success: false }
}

if (isObserverRole(currentRole.role)) {
  return observerReadOnlyError()
}
  const planId = String(formData.get('plan_id') || '')
  const questionId = String(formData.get('question_id') || '')
  const questionType = String(formData.get('question_type') || 'template')
  const assignedTo = String(formData.get('assigned_to') || '')
  const title = String(formData.get('title') || '').trim()
  const severity = String(formData.get('severity') || 'low')
  const description = String(formData.get('description') || '').trim()
  const deadline = String(formData.get('deadline') || '').trim()

  if (!planId) {
    return { error: 'Plan ID tapılmadı.', success: false }
  }

  if (!questionId) {
    return { error: 'Sual ID tapılmadı.', success: false }
  }

  if (!title) {
    return { error: 'Problem başlığı daxil edilməlidir.', success: false }
  }

  const uploadedFiles: {
    name: string
    path: string
    size: number
    type: string
  }[] = []

  const files = formData
    .getAll('files')
    .filter((file): file is File => file instanceof File && file.size > 0)

  for (const file of files) {
    const safeName = file.name
      .replace(/[^\w.\-]+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 120)

    const filePath = `${planId}/${questionId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('finding-files')
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      return {
        error: 'Fayl yüklənmədi: ' + uploadError.message,
        success: false,
      }
    }

    uploadedFiles.push({
      name: file.name,
      path: filePath,
      size: file.size,
      type: file.type || 'application/octet-stream',
    })
  }

  const { error } = await supabase.from('findings').insert([
    {
      plan_id: planId,
      question_id: questionType === 'custom' ? null : questionId,
      custom_question_id: questionType === 'custom' ? questionId : null,
      assigned_to: assignedTo || null,
      title,
      severity,
      description,
      deadline: deadline || null,
      status: 'aciq',
      files: uploadedFiles,
    },
  ])

  if (error) {
    if (uploadedFiles.length > 0) {
      await supabase.storage
        .from('finding-files')
        .remove(uploadedFiles.map((file) => file.path))
    }

    return { error: error.message, success: false }
  }

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath(`/dashboard/plans/${planId}/report`)

  return { error: null, success: true }
}


// --- 2.1. Auditor tərəfindən plana xüsusi sual əlavə et ---
export async function addCustomQuestion(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'İstifadəçi tapılmadı.', success: false }
  }
const currentRole = await getCurrentProfileRole(supabase, user.id)

if (currentRole.error) {
  return { error: currentRole.error, success: false }
}

if (isObserverRole(currentRole.role)) {
  return observerReadOnlyError()
}
  const planId = String(formData.get('plan_id') || '').trim()
  const questionText = String(formData.get('question_text') || '').trim()
  const rawMaxScore = String(formData.get('max_score') || '10').trim()

  if (!planId) {
    return { error: 'Plan ID tapılmadı.', success: false }
  }

  if (!questionText) {
    return { error: 'Sual mətni daxil edilməlidir.', success: false }
  }

  let maxScore = Number(rawMaxScore || 10)

  if (Number.isNaN(maxScore) || maxScore <= 0) {
    maxScore = 10
  }

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('id, locked_edit')
    .eq('id', planId)
    .maybeSingle()

  if (planError) {
    return { error: planError.message, success: false }
  }

  if (!plan) {
    return { error: 'Audit planı tapılmadı.', success: false }
  }

  if (plan.locked_edit) {
    return {
      error:
        'Bu audit redaktəyə kilidlənib. Xüsusi sual əlavə etmək mümkün deyil.',
      success: false,
    }
  }

  const { error } = await supabase.from('audit_custom_questions').insert([
    {
      plan_id: planId,
      question_text: questionText,
      max_score: maxScore,
      created_by: user.id,
    },
  ])

  if (error) {
    return {
      error: 'Xüsusi sual əlavə olunmadı: ' + error.message,
      success: false,
    }
  }

  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath('/dashboard/plans')

  return { error: null, success: true }
}

// --- 3. Audit Cavablarını Yadda Saxlama ---
// --- 3. Audit Cavablarını Yadda Saxlama ---
export async function saveAuditAnswers(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
const supabase = await createClient()

const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  return { error: 'İstifadəçi tapılmadı.', success: false }
}

const currentRole = await getCurrentProfileRole(supabase, user.id)

if (currentRole.error) {
  return { error: currentRole.error, success: false }
}

if (isObserverRole(currentRole.role)) {
  return observerReadOnlyError()
}

const plan_id = formData.get('plan_id') as string

  if (!plan_id) {
    return { error: 'Plan ID tapılmadı.', success: false }
  }

  try {
    const templateAnswers: any[] = []
    const customAnswers: any[] = []
    const incomingQuestionIds: string[] = []
    const incomingCustomQuestionIds: string[] = []

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('answer_custom_')) {
        const custom_question_id = key.replace('answer_custom_', '')
        const response = String(value || '')
        const comment = String(
          formData.get(`comment_custom_${custom_question_id}`) || ''
        )
        const rawScore = formData.get(`score_custom_${custom_question_id}`)

        incomingCustomQuestionIds.push(custom_question_id)

        customAnswers.push({
          plan_id,
          custom_question_id,
          response,
          comment,
          rawScore,
          updated_at: new Date().toISOString(),
        })

        continue
      }

      if (key.startsWith('answer_')) {
        const question_id = key.replace('answer_', '')
        const response = String(value || '')
        const comment = String(formData.get(`comment_${question_id}`) || '')
        const rawScore = formData.get(`score_${question_id}`)

        incomingQuestionIds.push(question_id)

        templateAnswers.push({
          plan_id,
          question_id,
          response,
          comment,
          rawScore,
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (templateAnswers.length === 0 && customAnswers.length === 0) {
      return {
        error: 'Yadda saxlamaq üçün cavab seçilməyib.',
        success: false,
      }
    }

    let incomingQuestions: any[] = []

    if (incomingQuestionIds.length > 0) {
      const { data, error: incomingQuestionsError } = await supabase
        .from('template_questions')
        .select('id, max_score')
        .in('id', incomingQuestionIds)

      if (incomingQuestionsError) throw incomingQuestionsError

      incomingQuestions = data || []
    }

    const incomingMaxScoreMap = new Map(
      incomingQuestions.map((q: any) => [q.id, Number(q.max_score || 10)])
    )

    const templateAnswersWithScore = templateAnswers.map((answer) => {
      const maxScore = incomingMaxScoreMap.get(answer.question_id) || 10

      let score = Number(answer.rawScore || 0)

      if (Number.isNaN(score)) score = 0
      if (score < 0) score = 0
      if (score > maxScore) score = maxScore
      if (answer.response === 'na') score = 0

      return {
        plan_id: answer.plan_id,
        question_id: answer.question_id,
        custom_question_id: null,
        response: answer.response,
        comment: answer.comment,
        score,
        updated_at: answer.updated_at,
      }
    })

    let incomingCustomQuestions: any[] = []

    if (incomingCustomQuestionIds.length > 0) {
      const { data, error: incomingCustomQuestionsError } = await supabase
        .from('audit_custom_questions')
        .select('id, max_score')
        .eq('plan_id', plan_id)
        .in('id', incomingCustomQuestionIds)

      if (incomingCustomQuestionsError) throw incomingCustomQuestionsError

      incomingCustomQuestions = data || []
    }

    const incomingCustomMaxScoreMap = new Map(
      incomingCustomQuestions.map((q: any) => [
        q.id,
        Number(q.max_score || 10),
      ])
    )

    const customAnswersWithScore = customAnswers.map((answer) => {
      const maxScore =
        incomingCustomMaxScoreMap.get(answer.custom_question_id) || 10

      let score = Number(answer.rawScore || 0)

      if (Number.isNaN(score)) score = 0
      if (score < 0) score = 0
      if (score > maxScore) score = maxScore
      if (answer.response === 'na') score = 0

      return {
        plan_id: answer.plan_id,
        question_id: null,
        custom_question_id: answer.custom_question_id,
        response: answer.response,
        comment: answer.comment,
        score,
        updated_at: answer.updated_at,
      }
    })

    if (templateAnswersWithScore.length > 0) {
      const { error: upsertTemplateError } = await supabase
        .from('audit_answers')
        .upsert(templateAnswersWithScore, {
          onConflict: 'plan_id,question_id',
        })

      if (upsertTemplateError) {
        return {
          error:
            'Şablon suallarının cavabları saxlanmadı: ' +
            upsertTemplateError.message,
          success: false,
        }
      }
    }

    if (customAnswersWithScore.length > 0) {
      for (const answer of customAnswersWithScore) {
        const { data: existingCustomAnswer, error: findCustomError } = await supabase
          .from('audit_answers')
          .select('id')
          .eq('plan_id', answer.plan_id)
          .eq('custom_question_id', answer.custom_question_id)
          .maybeSingle()

        if (findCustomError) {
          return {
            error:
              'Əlavə sual cavabı yoxlanarkən xəta: ' +
              findCustomError.message,
            success: false,
          }
        }

        if (existingCustomAnswer?.id) {
          const { error: updateCustomError } = await supabase
            .from('audit_answers')
            .update({
              response: answer.response,
              comment: answer.comment,
              score: answer.score,
              updated_at: answer.updated_at,
            })
            .eq('id', existingCustomAnswer.id)

          if (updateCustomError) {
            return {
              error:
                'Əlavə sual cavabı yenilənmədi: ' +
                updateCustomError.message,
              success: false,
            }
          }
        } else {
          const { error: insertCustomError } = await supabase
            .from('audit_answers')
            .insert([
              {
                plan_id: answer.plan_id,
                question_id: null,
                custom_question_id: answer.custom_question_id,
                response: answer.response,
                comment: answer.comment,
                score: answer.score,
                updated_at: answer.updated_at,
              },
            ])

          if (insertCustomError) {
            return {
              error:
                'Əlavə sual cavabı əlavə olunmadı: ' +
                insertCustomError.message,
              success: false,
            }
          }
        }
      }
    }

    const { data: allAnswers, error: allAnswersError } = await supabase
      .from('audit_answers')
      .select(`
        question_id,
        custom_question_id,
        response,
        score,
        template_questions(max_score),
        audit_custom_questions(max_score)
      `)
      .eq('plan_id', plan_id)

    if (allAnswersError) throw allAnswersError

    const scoredAnswers = (allAnswers || []).filter(
      (answer: any) => answer.response !== 'na'
    )

    const earnedScore = scoredAnswers.reduce((sum: number, answer: any) => {
      return sum + Number(answer.score || 0)
    }, 0)

    const possibleScore = scoredAnswers.reduce((sum: number, answer: any) => {
      const templateQuestion = Array.isArray(answer.template_questions)
        ? answer.template_questions[0] || null
        : answer.template_questions || null

      const customQuestion = Array.isArray(answer.audit_custom_questions)
        ? answer.audit_custom_questions[0] || null
        : answer.audit_custom_questions || null

      const maxScore =
        templateQuestion?.max_score ?? customQuestion?.max_score ?? 10

      return sum + Number(maxScore || 10)
    }, 0)

    const finalScore =
      possibleScore > 0 ? Math.round((earnedScore / possibleScore) * 100) : 0

    const nextStatus = finalScore >= 50 ? 'tamamlandi' : 'needs_attention'

    const { error: planUpdateError } = await supabase
      .from('audit_plans')
      .update({
        score: finalScore,
        status: nextStatus,
      })
      .eq('id', plan_id)

    if (planUpdateError) {
      return {
        error:
          'Cavablar saxlandı, amma plan nəticəsi yenilənmədi: ' +
          planUpdateError.message,
        success: false,
      }
    }

    revalidatePath(`/dashboard/plans/${plan_id}/fill`)
    revalidatePath(`/dashboard/plans/${plan_id}`)
    revalidatePath(`/dashboard/plans/${plan_id}/report`)
    revalidatePath('/dashboard/plans')
    revalidatePath('/dashboard/findings')
    revalidatePath('/dashboard')

    return { error: null, success: true }
  } catch (err: any) {
    return {
      error: err.message || 'Cavabları saxlayarkən xəta baş verdi.',
      success: false,
    }
  }
}

// --- 4. Auditi Tamamla ---
export async function completeAudit(planId: string): Promise<ActionState> {
  const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  return { error: 'İstifadəçi tapılmadı.', success: false }
}

const currentRole = await getCurrentProfileRole(supabase, user.id)

if (currentRole.error) {
  return { error: currentRole.error, success: false }
}

if (isObserverRole(currentRole.role)) {
  return observerReadOnlyError()
}
  if (!planId) {
    return { error: 'Plan ID tapılmadı.', success: false }
  }

  const { data: answers, error: answersError } = await supabase
    .from('audit_answers')
    .select('score')
    .eq('plan_id', planId)

  if (answersError) {
    return {
      error: 'Audit cavabları yoxlanarkən xəta: ' + answersError.message,
      success: false,
    }
  }

  if (!answers || answers.length === 0) {
    return {
      error: 'Auditi tamamlamaq üçün əvvəlcə cavabları yadda saxlayın.',
      success: false,
    }
  }

  const totalScore = answers.reduce(
    (sum: number, item: any) => sum + Number(item.score || 0),
    0
  )

  const averageScore = Math.round(totalScore / answers.length)
  const status = averageScore < 50 ? 'needs_attention' : 'tamamlandi'

  const { error } = await supabase
    .from('audit_plans')
    .update({
      status,
      score: averageScore,
    })
    .eq('id', planId)

  if (error) {
    return {
      error: 'Auditi tamamlamaq mümkün olmadı: ' + error.message,
      success: false,
    }
  }

  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath('/dashboard/plans')
  revalidatePath('/dashboard')

  return { error: null, success: true }
}

// --- 5. Finding status yenilə ---
export async function updateFindingStatus(
  findingId: string,
  status: string,
  planId: string
): Promise<ActionState> {
  const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  return { error: 'İstifadəçi tapılmadı.', success: false }
}

const currentRole = await getCurrentProfileRole(supabase, user.id)

if (currentRole.error) {
  return { error: currentRole.error, success: false }
}

if (isObserverRole(currentRole.role)) {
  return observerReadOnlyError()
}
  if (!findingId) {
    return { error: 'Finding ID tapılmadı.', success: false }
  }

  if (!status) {
    return { error: 'Status seçilməyib.', success: false }
  }

  const { error } = await supabase
    .from('findings')
    .update({ status })
    .eq('id', findingId)

  if (error) {
    return {
      error: 'Çatışmazlıq statusu yenilənmədi: ' + error.message,
      success: false,
    }
  }

  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath('/dashboard/plans')
  revalidatePath('/dashboard')

  return { error: null, success: true }
}

// --- 6. Audit Planı Sil ---
export async function deleteAuditPlan(planId: string): Promise<ActionState> {
  const supabase = await createClient()

  if (!planId) {
    return { error: 'Plan ID tapılmadı.', success: false }
  }

  try {
    const { data: plan, error: planFetchError } = await supabase
      .from('audit_plans')
      .select('id, file_url')
      .eq('id', planId)
      .maybeSingle()

    if (planFetchError) throw planFetchError

    if (!plan) {
      return {
        error: 'Audit planı tapılmadı və ya silmək icazəniz yoxdur.',
        success: false,
      }
    }

    const { error: planError } = await supabase
      .from('audit_plans')
      .delete()
      .eq('id', planId)

    if (planError) throw planError

    if (plan.file_url) {
      supabase.storage.from('audit-docs').remove([plan.file_url]).then(({ error }) => {
        if (error) {
          console.error('Audit faylı storage-dən silinmədi:', error.message)
        }
      })
    }

    revalidatePath('/dashboard/plans')
    revalidatePath('/dashboard')

    return { error: null, success: true }
  } catch (err: any) {
    return {
      error: err.message || 'Audit planı silinərkən xəta baş verdi.',
      success: false,
    }
  }
}


// --- 7. Audit tamamlanma yoxlaması ---
export async function checkAuditReady(planId: string): Promise<ActionState> {
  const supabase = await createClient()

  if (!planId) {
    return { error: 'Plan ID tapılmadı.', success: false }
  }

  const { data: answers, error } = await supabase
    .from('audit_answers')
    .select('id')
    .eq('plan_id', planId)
    .limit(1)

  if (error) {
    return {
      error: 'Audit cavabları yoxlanılarkən xəta: ' + error.message,
      success: false,
    }
  }

  if (!answers || answers.length === 0) {
    return {
      error:
        'Audit tamamlanması üçün əvvəlcə cavabları seçib “Cavabları Yadda Saxla” düyməsinə basın.',
      success: false,
    }
  }

  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath('/dashboard/plans')
  revalidatePath('/dashboard')

  return { error: null, success: true }
}

export async function updateAuditPlanLock(
  planId: string,
  lockType: 'none' | 'edit' | 'view'
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'İstifadəçi tapılmadı.', success: false }

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('id, created_by')
    .eq('id', planId)
    .maybeSingle()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { error: profileError.message, success: false }
  }
if (String(profile?.role || '').toLowerCase() === 'musahideci') {
  return observerReadOnlyError()
}
  if (planError) {
    return { error: planError.message, success: false }
  }

  if (!plan) {
    return { error: 'Plan tapılmadı.', success: false }
  }

  const isAdmin = profile?.role === 'admin'
  const isCreator = plan.created_by === user.id

  if (!isAdmin && !isCreator) {
    return {
      error: 'Bu planı yalnız admin və ya planı yaradan istifadəçi kilidləyə bilər.',
      success: false,
    }
  }

  const payload =
    lockType === 'none'
      ? {
        locked_edit: false,
        locked_view: false,
        locked_by: null,
        locked_at: null,
      }
      : lockType === 'edit'
        ? {
          locked_edit: true,
          locked_view: false,
          locked_by: user.id,
          locked_at: new Date().toISOString(),
        }
        : {
          locked_edit: true,
          locked_view: true,
          locked_by: user.id,
          locked_at: new Date().toISOString(),
        }

  const { error } = await supabase
    .from('audit_plans')
    .update(payload)
    .eq('id', planId)

  if (error) {
    return {
      error: 'Plan kilidi yenilənmədi: ' + error.message,
      success: false,
    }
  }

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath(`/dashboard/plans/${planId}/report`)

  return { error: null, success: true }
}

export async function addPlanViewer(
  planId: string,
  userId: string
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'İstifadəçi tapılmadı.', success: false }

  if (!planId) return { error: 'Plan ID tapılmadı.', success: false }
  if (!userId) return { error: 'İstifadəçi seçilməyib.', success: false }

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('id, created_by')
    .eq('id', planId)
    .maybeSingle()

  if (planError) return { error: planError.message, success: false }
  if (!plan) return { error: 'Plan tapılmadı.', success: false }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) return { error: profileError.message, success: false }
if (String(profile?.role || '').toLowerCase() === 'musahideci') {
  return observerReadOnlyError()
}
  const isAdmin = profile?.role === 'admin'
  const isCreator = plan.created_by === user.id

  if (!isAdmin && !isCreator) {
    return {
      error: 'Əlavə baxış icazəsini yalnız admin və ya planı yaradan verə bilər.',
      success: false,
    }
  }

  const { error } = await supabase.from('audit_plan_viewers').upsert(
    [
      {
        plan_id: planId,
        user_id: userId,
        created_by: user.id,
      },
    ],
    {
      onConflict: 'plan_id,user_id',
    }
  )

  if (error) {
    return {
      error: 'Baxış icazəsi əlavə olunmadı: ' + error.message,
      success: false,
    }
  }

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${planId}`)

  return { error: null, success: true }
}

export async function removePlanViewer(
  planId: string,
  userId: string
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'İstifadəçi tapılmadı.', success: false }

  if (!planId) return { error: 'Plan ID tapılmadı.', success: false }
  if (!userId) return { error: 'İstifadəçi tapılmadı.', success: false }

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('id, created_by')
    .eq('id', planId)
    .maybeSingle()

  if (planError) return { error: planError.message, success: false }
  if (!plan) return { error: 'Plan tapılmadı.', success: false }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) return { error: profileError.message, success: false }
if (String(profile?.role || '').toLowerCase() === 'musahideci') {
  return observerReadOnlyError()
}
  const isAdmin = profile?.role === 'admin'
  const isCreator = plan.created_by === user.id

  if (!isAdmin && !isCreator) {
    return {
      error: 'Baxış icazəsini yalnız admin və ya planı yaradan silə bilər.',
      success: false,
    }
  }

  const { error } = await supabase
    .from('audit_plan_viewers')
    .delete()
    .eq('plan_id', planId)
    .eq('user_id', userId)

  if (error) {
    return {
      error: 'Baxış icazəsi silinmədi: ' + error.message,
      success: false,
    }
  }

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${planId}`)

  return { error: null, success: true }
}

export async function deleteFinding(
  findingId: string,
  planId: string
): Promise<ActionState> {
  const supabase = await createClient()

  if (!findingId) {
    return { error: 'Çatışmazlıq ID tapılmadı.', success: false }
  }

  if (!planId) {
    return { error: 'Plan ID tapılmadı.', success: false }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'İstifadəçi tapılmadı.', success: false }
  }

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('id, created_by, locked_edit, locked_view')
    .eq('id', planId)
    .maybeSingle()

  if (planError) {
    return { error: planError.message, success: false }
  }

  if (!plan) {
    return { error: 'Audit planı tapılmadı.', success: false }
  }

  if (plan.locked_edit || plan.locked_view) {
    return {
      error: 'Bu plan kilidlidir. çatışmazlıq silmək mümkün deyil.',
      success: false,
    }
  }

  const { data: finding, error: findingError } = await supabase
    .from('findings')
    .select('id, files')
    .eq('id', findingId)
    .eq('plan_id', planId)
    .maybeSingle()

  if (findingError) {
    return { error: findingError.message, success: false }
  }

  if (!finding) {
    return { error: 'Çatışmazlıq tapılmadı.', success: false }
  }

const { data: deletedRows, error: deleteError } = await supabase
  .from('findings')
  .delete()
  .eq('id', findingId)
  .eq('plan_id', planId)
  .select('id')

if (deleteError) {
  return {
    error: 'çatışmazlıq silinmədi: ' + deleteError.message,
    success: false,
  }
}

if (!deletedRows || deletedRows.length === 0) {
  return {
    error:
      'Çatışmazlıq database-dən silinmədi. Böyük ehtimalla Supabase RLS DELETE icazəsi yoxdur.',
    success: false,
  }
}

  const filePaths = Array.isArray((finding as any).files)
    ? (finding as any).files
        .map((file: any) => file?.path)
        .filter(Boolean)
    : []

  if (filePaths.length > 0) {
    supabase.storage
      .from('finding-files')
      .remove(filePaths)
      .then(({ error }) => {
        if (error) {
          console.error('Çatışmazlıq faylları storage-dən silinmədi:', error.message)
        }
      })
  }

  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath(`/dashboard/plans/${planId}/report`)
  revalidatePath('/dashboard/plans')
  revalidatePath('/dashboard/findings')
  revalidatePath('/dashboard')

  return { error: null, success: true }
}

export async function deleteFindingFile(
  findingId: string,
  planId: string,
  filePath: string
): Promise<ActionState> {
  const supabase = await createClient()

  if (!findingId) {
    return { error: 'Çatışmazlıq ID tapılmadı.', success: false }
  }

  if (!planId) {
    return { error: 'Plan ID tapılmadı.', success: false }
  }

  if (!filePath) {
    return { error: 'Fayl yolu tapılmadı.', success: false }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'İstifadəçi tapılmadı.', success: false }
  }

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('id, locked_edit, locked_view')
    .eq('id', planId)
    .maybeSingle()

  if (planError) {
    return { error: planError.message, success: false }
  }

  if (!plan) {
    return { error: 'Audit planı tapılmadı.', success: false }
  }

  if (plan.locked_edit || plan.locked_view) {
    return {
      error: 'Bu plan kilidlidir. Fayl silmək mümkün deyil.',
      success: false,
    }
  }

  const { data: finding, error: findingError } = await supabase
    .from('findings')
    .select('id, files')
    .eq('id', findingId)
    .eq('plan_id', planId)
    .maybeSingle()

  if (findingError) {
    return { error: findingError.message, success: false }
  }

  if (!finding) {
    return { error: 'Çatışmazlıq tapılmadı.', success: false }
  }

  const oldFiles = Array.isArray((finding as any).files)
    ? (finding as any).files
    : []

  const fileExists = oldFiles.some((file: any) => file?.path === filePath)

  if (!fileExists) {
    return { error: 'Fayl çatışmazlıqda tapılmadı.', success: false }
  }

  const nextFiles = oldFiles.filter((file: any) => file?.path !== filePath)

  const { error: updateError } = await supabase
    .from('findings')
    .update({ files: nextFiles })
    .eq('id', findingId)
    .eq('plan_id', planId)

  if (updateError) {
    return {
      error: 'Çatışmazlıq fayl siyahısı yenilənmədi: ' + updateError.message,
      success: false,
    }
  }

  supabase.storage
    .from('finding-files')
    .remove([filePath])
    .then(({ error }) => {
      if (error) {
        console.error('Çatışmazlıq faylı storage-dən silinmədi:', error.message)
      }
    })

  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath(`/dashboard/plans/${planId}/report`)
  revalidatePath('/dashboard/findings')
  revalidatePath('/dashboard/plans')

  return { error: null, success: true }
}

export async function updateAuditPlan(
  planId: string,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  if (!planId) {
    return { error: 'Plan ID tapılmadı.', success: false }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'İstifadəçi tapılmadı.', success: false }
  }

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('id, created_by, file_url, locked_edit, locked_view')
    .eq('id', planId)
    .maybeSingle()

  if (planError) {
    return { error: planError.message, success: false }
  }

  if (!plan) {
    return { error: 'Audit planı tapılmadı.', success: false }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { error: profileError.message, success: false }
  }
if (String(profile?.role || '').toLowerCase() === 'musahideci') {
  return observerReadOnlyError()
}
  const isAdmin = profile?.role === 'admin'
  const isCreator = plan.created_by === user.id

  if (!isAdmin && !isCreator) {
    return {
      error: 'Bu audit planını yalnız admin və ya planı yaradan redaktə edə bilər.',
      success: false,
    }
  }

  if (plan.locked_view) {
    return {
      error: 'Bu plan baxışa kilidlidir. Plan məlumatlarını redaktə etmək mümkün deyil.',
      success: false,
    }
  }

  const title = String(formData.get('title') || '').trim()
  const companyId = String(formData.get('company_id') || '').trim()
  const department = String(formData.get('department') || '').trim()
  const startDate = String(formData.get('start_date') || '').trim()
  const dueDate = String(formData.get('due_date') || '').trim()
  const notes = String(formData.get('notes') || '').trim()
  const templateIds = formData.getAll('template_ids') as string[]
  const selectedSectionIds = formData.getAll('template_section_ids') as string[]
  const assignedIds = formData.getAll('assigned_to') as string[]

  const validStartDate =
    !startDate || /^\d{4}-\d{2}-\d{2}$/.test(startDate)

  const validDueDate =
    !dueDate || /^\d{4}-\d{2}-\d{2}$/.test(dueDate)

  if (!title) {
    return { error: 'Plan başlığı daxil edilməlidir.', success: false }
  }

  if (!companyId) {
    return { error: 'Şirkət seçilməlidir.', success: false }
  }

  if (!validStartDate) {
    return { error: 'Başlama tarixi düzgün formatda deyil.', success: false }
  }

  if (!validDueDate) {
    return { error: 'Son tarix düzgün formatda deyil.', success: false }
  }

  if (startDate && dueDate && startDate > dueDate) {
    return {
      error: 'Başlama tarixi son tarixdən sonra ola bilməz.',
      success: false,
    }
  }

  if (templateIds.length === 0) {
    return { error: 'Ən azı 1 audit şablonu seçilməlidir.', success: false }
  }

  if (selectedSectionIds.length === 0) {
    return { error: 'Ən azı 1 şablon bölməsi seçilməlidir.', success: false }
  }

  const { data: existingAnswers, error: answersError } = await supabase
    .from('audit_answers')
    .select('id')
    .eq('plan_id', planId)
    .limit(1)

  if (answersError) {
    return {
      error: 'Plan cavabları yoxlanarkən xəta: ' + answersError.message,
      success: false,
    }
  }

  const hasAnswers = Boolean(existingAnswers && existingAnswers.length > 0)

  let nextFileUrl: string | null = plan.file_url || null
  let uploadedFilePath: string | null = null
  const file = formData.get('file') as File | null

  try {
    if (file && file.size > 0) {
      const safeName = sanitizeFilename(file.name)
      const fileName = `${Date.now()}_${safeName}`
      const filePath = `plans/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('audit-docs')
        .upload(filePath, file)

      if (uploadError) {
        return {
          error: 'Fayl yüklənərkən xəta: ' + uploadError.message,
          success: false,
        }
      }

      uploadedFilePath = filePath
      nextFileUrl = filePath
    }

    const uniqueTemplateIds = Array.from(new Set(templateIds.filter(Boolean)))
    const templateId = uniqueTemplateIds[0] || ''

    const updatePayload: any = {
      title,
      company_id: companyId,
      department: department || null,
      start_date: startDate || null,
      due_date: dueDate || null,
      notes,
      file_url: nextFileUrl,
    }

    if (!hasAnswers) {
      updatePayload.template_id = templateId
    }

    const { error: updateError } = await supabase
      .from('audit_plans')
      .update(updatePayload)
      .eq('id', planId)

    if (updateError) throw updateError

    const assignments = Array.from(new Set(assignedIds.filter(Boolean))).map(
      (id) => ({
        plan_id: planId,
        user_id: id,
      })
    )

    const { error: deleteAssignmentsError } = await supabase
      .from('plan_assignments')
      .delete()
      .eq('plan_id', planId)

    if (deleteAssignmentsError) throw deleteAssignmentsError

    if (assignments.length > 0) {
      const { error: insertAssignmentsError } = await supabase
        .from('plan_assignments')
        .insert(assignments)

      if (insertAssignmentsError) throw insertAssignmentsError
    }

    if (!hasAnswers) {
      const planTemplates = uniqueTemplateIds.map((id) => ({
        plan_id: planId,
        template_id: id,
      }))

      const uniqueSectionPairs = Array.from(
        new Set(selectedSectionIds.filter(Boolean))
      )

      const planTemplateSections = uniqueSectionPairs
        .map((value) => {
          const [template_id, section_id] = String(value).split(':')

          if (!template_id || !section_id) return null
          if (!uniqueTemplateIds.includes(template_id)) return null

          return {
            plan_id: planId,
            template_id,
            section_id,
          }
        })
        .filter(Boolean)

      if (planTemplateSections.length === 0) {
        throw new Error('Seçilmiş bölmələr tapılmadı.')
      }

      const { error: deletePlanTemplatesError } = await supabase
        .from('audit_plan_templates')
        .delete()
        .eq('plan_id', planId)

      if (deletePlanTemplatesError) throw deletePlanTemplatesError

      const { error: deletePlanSectionsError } = await supabase
        .from('audit_plan_template_sections')
        .delete()
        .eq('plan_id', planId)

      if (deletePlanSectionsError) throw deletePlanSectionsError

      const { error: insertPlanTemplatesError } = await supabase
        .from('audit_plan_templates')
        .insert(planTemplates)

      if (insertPlanTemplatesError) throw insertPlanTemplatesError

      const { error: insertPlanSectionsError } = await supabase
        .from('audit_plan_template_sections')
        .insert(planTemplateSections)

      if (insertPlanSectionsError) throw insertPlanSectionsError
    }

    if (uploadedFilePath && plan.file_url) {
      supabase.storage
        .from('audit-docs')
        .remove([plan.file_url])
        .then(({ error }) => {
          if (error) {
            console.error('Köhnə plan faylı storage-dən silinmədi:', error.message)
          }
        })
    }

    revalidatePath('/dashboard/plans')
    revalidatePath(`/dashboard/plans/${planId}`)
    revalidatePath(`/dashboard/plans/${planId}/fill`)
    revalidatePath(`/dashboard/plans/${planId}/report`)
    revalidatePath('/dashboard')

    return { error: null, success: true }
  } catch (err: any) {
    if (uploadedFilePath) {
      await supabase.storage.from('audit-docs').remove([uploadedFilePath])
    }

    return {
      error: err.message || 'Audit planı redaktə edilərkən xəta baş verdi.',
      success: false,
    }
  }
}
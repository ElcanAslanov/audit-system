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

  const title = formData.get('title') as string
  const companyId = formData.get('company_id') as string
  const templateIds = formData.getAll('template_ids') as string[]
  const selectedSectionIds = formData.getAll('template_section_ids') as string[]
  const templateId = templateIds[0] || ''
  const dueDate = formData.get('due_date') as string

  const validDueDate =
  !dueDate || /^\d{4}-\d{2}-\d{2}$/.test(dueDate)

if (!validDueDate) {
  return { error: 'Son tarix düzgün formatda deyil.', success: false }
}
  const notes = formData.get('notes') as string
  const department = formData.get('department') as string

  if (!title?.trim()) {
    return { error: 'Plan başlığı daxil edilməlidir.', success: false }
  }

  if (!companyId) {
    return { error: 'Şirkət seçilməlidir.', success: false }
  }

  if (!department) {
  return { error: 'Departament seçilməlidir.', success: false }
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
          department,
          company_id: companyId,
          template_id: templateId, // legacy uyğunluq üçün ilk seçilən şablon
          due_date: dueDate || null,
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

    const { error: planTemplatesError } = await supabase
      .from('audit_plan_templates')
      .insert(planTemplates)

    if (planTemplatesError) {
      throw planTemplatesError
    }

    const uniqueSectionIds = Array.from(
  new Set(selectedSectionIds.filter(Boolean))
)

const { data: selectedSections, error: selectedSectionsError } = await supabase
  .from('template_sections')
  .select('id, template_id')
  .in('id', uniqueSectionIds)

if (selectedSectionsError) {
  throw selectedSectionsError
}

const planTemplateSections = (selectedSections || [])
  .filter((section: any) => uniqueTemplateIds.includes(section.template_id))
  .map((section: any) => ({
    plan_id: plan.id,
    template_id: section.template_id,
    section_id: section.id,
  }))

if (planTemplateSections.length === 0) {
  throw new Error('Seçilmiş bölmələr tapılmadı.')
}

const { error: planTemplateSectionsError } = await supabase
  .from('audit_plan_template_sections')
  .insert(planTemplateSections)

if (planTemplateSectionsError) {
  throw planTemplateSectionsError
}

    const assignedIds = formData.getAll('assigned_to') as string[]

    if (assignedIds.length > 0) {
      const assignments = assignedIds.map((id) => ({
        plan_id: plan.id,
        user_id: id,
      }))

      const { error: assignmentsError } = await supabase
        .from('plan_assignments')
        .insert(assignments)

      if (assignmentsError) throw assignmentsError
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

// --- 2. Tapıntı (Finding) Əlavə Etmə ---
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

  const planId = String(formData.get('plan_id') || '')
  const questionId = String(formData.get('question_id') || '')
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
      question_id: questionId,
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

// --- 3. Audit Cavablarını Yadda Saxlama ---
export async function saveAuditAnswers(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const plan_id = formData.get('plan_id') as string

  if (!plan_id) {
    return { error: 'Plan ID tapılmadı.', success: false }
  }

  try {
    const answers: any[] = []
    const incomingQuestionIds: string[] = []

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('answer_')) {
        const question_id = key.replace('answer_', '')
        const response = String(value || '')
        const comment = String(formData.get(`comment_${question_id}`) || '')
        const rawScore = formData.get(`score_${question_id}`)

        incomingQuestionIds.push(question_id)

        answers.push({
          plan_id,
          question_id,
          response,
          comment,
          rawScore,
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (answers.length === 0) {
      return {
        error: 'Yadda saxlamaq üçün cavab seçilməyib.',
        success: false,
      }
    }

    const { data: incomingQuestions, error: incomingQuestionsError } =
      await supabase
        .from('template_questions')
        .select('id, max_score')
        .in('id', incomingQuestionIds)

    if (incomingQuestionsError) throw incomingQuestionsError

    const incomingMaxScoreMap = new Map(
      (incomingQuestions || []).map((q: any) => [
        q.id,
        Number(q.max_score || 10),
      ])
    )

    const answersWithScore = answers.map((answer) => {
      const maxScore = incomingMaxScoreMap.get(answer.question_id) || 10

      let score = Number(answer.rawScore || 0)

      if (Number.isNaN(score)) {
        score = 0
      }

      if (score < 0) {
        score = 0
      }

      if (score > maxScore) {
        score = maxScore
      }

      if (answer.response === 'na') {
        score = 0
      }

      return {
        plan_id: answer.plan_id,
        question_id: answer.question_id,
        response: answer.response,
        comment: answer.comment,
        score,
        updated_at: answer.updated_at,
      }
    })

    const { error: upsertError } = await supabase
      .from('audit_answers')
      .upsert(answersWithScore, {
        onConflict: 'plan_id,question_id',
      })

    if (upsertError) {
      return {
        error: 'Cavabları saxlayarkən xəta: ' + upsertError.message,
        success: false,
      }
    }

    const { data: allAnswers, error: allAnswersError } = await supabase
      .from('audit_answers')
      .select(`
        question_id,
        response,
        score,
        template_questions(max_score)
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
      const question = Array.isArray(answer.template_questions)
        ? answer.template_questions[0] || null
        : answer.template_questions || null

      return sum + Number(question?.max_score || 10)
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
      error: 'Tapıntı statusu yenilənmədi: ' + error.message,
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
    // Əvvəl planın fayl path-ni götürürük
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

    // Əvvəl bu plana aid findings-ləri silirik
    const { error: findingsError } = await supabase
      .from('findings')
      .delete()
      .eq('plan_id', planId)

    if (findingsError) throw findingsError

    // Sonra audit cavablarını silirik
    const { error: answersError } = await supabase
      .from('audit_answers')
      .delete()
      .eq('plan_id', planId)

    if (answersError) throw answersError

    // Sonra plan-şablon-bölmə əlaqələrini silirik
const { error: planTemplateSectionsError } = await supabase
  .from('audit_plan_template_sections')
  .delete()
  .eq('plan_id', planId)

if (planTemplateSectionsError) throw planTemplateSectionsError

    // Sonra plan-şablon əlaqələrini silirik
    const { error: planTemplatesError } = await supabase
      .from('audit_plan_templates')
      .delete()
      .eq('plan_id', planId)

    if (planTemplatesError) throw planTemplatesError

    // Sonra təyinatları silirik
    const { error: assignmentsError } = await supabase
      .from('plan_assignments')
      .delete()
      .eq('plan_id', planId)

    if (assignmentsError) throw assignmentsError

    // Planın özünü silirik
    const { error: planError } = await supabase
      .from('audit_plans')
      .delete()
      .eq('id', planId)

    if (planError) throw planError

    // Axırda storage faylını silirik
    // file_url bizdə "plans/filename.ext" kimi saxlanır
    if (plan.file_url) {
      const { error: storageError } = await supabase.storage
        .from('audit-docs')
        .remove([plan.file_url])

      // Storage silinməsə belə DB silinib; bunu fatal etməyək
      if (storageError) {
        console.error('Audit faylı storage-dən silinmədi:', storageError.message)
      }
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
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
export async function createAuditPlan(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: "İstifadəçi tapılmadı", success: false }

  const title = formData.get('title') as string
  const companyId = formData.get('company_id') as string
  const templateId = formData.get('template_id') as string
  const dueDate = formData.get('due_date') as string
  const notes = formData.get('notes') as string
  const department = formData.get('department') as string

  if (!templateId) return { error: "Audit şablonu seçilməlidir.", success: false }
  if (!companyId) return { error: "Şirkət seçilməlidir.", success: false }

  // Fayl yükləmə prosesi
  let fileUrl = null
  const file = formData.get('file') as File | null

  if (file && file.size > 0) {
    // Adı təmizləyirik: "Azərbaycan.pdf" -> "azerbaycan.pdf"
    const safeName = sanitizeFilename(file.name)
    const fileName = `${Date.now()}_${safeName}`
    const filePath = `plans/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('audit-docs') // Bucket adının düzgün olduğundan əmin ol
      .upload(filePath, file)
      
    if (uploadError) return { error: "Fayl yüklənərkən xəta: " + uploadError.message, success: false }
    fileUrl = filePath
  }
console.log("DEBUG: Gələn Şirkət ID:", companyId);
  console.log("DEBUG: İstifadəçi ID:", user.id);
  // Audit planı yaratma
  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .insert([{ 
      title, 
      department, 
      company_id: companyId, 
      template_id: templateId, 
      due_date: dueDate || null, 
      notes, 
      file_url: fileUrl, 
      created_by: user.id, 
      status: 'planlanan' 
    }])
    .select()
    .single()

  if (planError) return { error: planError.message, success: false }

  // Təyinatları (Assignments) əlavə etmə
  const assignedIds = formData.getAll('assigned_to') as string[]
  if (assignedIds.length > 0) {
    const assignments = assignedIds.map(id => ({ plan_id: plan.id, user_id: id }))
    await supabase.from('plan_assignments').insert(assignments)
  }

  revalidatePath('/dashboard/plans')
  return { error: null, success: true }
}

// --- 2. Tapıntı (Finding) Əlavə Etmə ---
export async function addFinding(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "İstifadəçi tapılmadı", success: false }

  const { error } = await supabase.from('findings').insert([{
    plan_id: formData.get('plan_id'),
    question_id: formData.get('question_id'),
    assigned_to: formData.get('assigned_to'),
    title: formData.get('title'),
    severity: formData.get('severity'),
    description: formData.get('description'),
    deadline: formData.get('deadline'),
    status: 'aciq'
  }])

  if (error) return { error: error.message, success: false }

  revalidatePath('/dashboard/plans')
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

        incomingQuestionIds.push(question_id)

        answers.push({
          plan_id,
          question_id,
          response,
          comment,
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

      let score = 0

      if (answer.response === 'yes') {
        score = maxScore
      }

      if (answer.response === 'no') {
        score = 0
      }

      if (answer.response === 'na') {
        score = 0
      }

      return {
        ...answer,
        score,
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

    // Upsert-dən sonra bu plan üzrə bütün cavabları yenidən çəkirik
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
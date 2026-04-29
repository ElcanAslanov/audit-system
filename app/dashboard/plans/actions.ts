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

  const questionIds = new Set<string>()

  for (const [key] of formData.entries()) {
    if (key.startsWith('answer_')) {
      questionIds.add(key.replace('answer_', ''))
    }

    if (key.startsWith('comment_')) {
      questionIds.add(key.replace('comment_', ''))
    }
  }

  if (questionIds.size === 0) {
    return { error: 'Heç bir cavab tapılmadı.', success: false }
  }

  const ids = Array.from(questionIds)

const { data: questions, error: questionsError } = await supabase
  .from('template_questions')
  .select('id, max_score')
  .in('id', ids)

  if (questionsError) {
    return {
      error: 'Sualları oxuyarkən xəta: ' + questionsError.message,
      success: false,
    }
  }

const questionMap = new Map(
  (questions || []).map((q: any) => [
    q.id,
    {
      max_score: Number(q.max_score || 0),
    },
  ])
)

  const answers = ids.map((question_id) => {
    const answer = String(formData.get(`answer_${question_id}`) || '')
    const comment = String(formData.get(`comment_${question_id}`) || '')
    const qInfo = questionMap.get(question_id)

    const maxScore = qInfo?.max_score || 0
    const normalizedAnswer = answer.toLowerCase()

    let score = 0

    if (normalizedAnswer === 'yes') {
      score = maxScore
    } else if (normalizedAnswer === 'na') {
      score = 0
    } else {
      score = 0
    }

return {
  plan_id,
  question_id,
  response: answer,
  comment,
  score,
}
  })

  const { error } = await supabase
    .from('audit_answers')
    .upsert(answers, { onConflict: 'plan_id,question_id' })

  if (error) {
    return {
      error: 'Cavabları saxlayarkən xəta: ' + error.message,
      success: false,
    }
  }

  revalidatePath(`/dashboard/plans/${plan_id}/fill`)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/plans')

  return { error: null, success: true }
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

    // Axırda audit planını silirik
    const { error: planError } = await supabase
      .from('audit_plans')
      .delete()
      .eq('id', planId)

    if (planError) throw planError

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
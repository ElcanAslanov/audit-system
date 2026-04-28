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
export async function saveAuditAnswers(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const plan_id = formData.get('plan_id') as string

  if (!plan_id) return { error: "Plan ID tapılmadı.", success: false }

  const answers: any[] = []
  
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('question_')) {
      const question_id = key.replace('question_', '')
      answers.push({
        plan_id,
        question_id,
        response: value as string, 
        created_at: new Date().toISOString()
      })
    }
  }

  const { error } = await supabase
    .from('audit_answers')
    .upsert(answers, { onConflict: 'plan_id,question_id' }) 

  if (error) {
    return { error: "Cavabları saxlayarkən xəta: " + error.message, success: false }
  }

  revalidatePath(`/dashboard/plans/${plan_id}/fill`)
  return { error: null, success: true }
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AuditActionState = {
  success: boolean
  message: string
}

// 1. Audit cavablarını saxlayan funksiya
export async function saveAuditAnswers(
  prevState: AuditActionState, 
  formData: FormData
): Promise<AuditActionState> {
  const supabase = await createClient()
  const planId = formData.get('plan_id') as string

  if (!planId) return { success: false, message: "Plan ID tapılmadı." }

  const entries = Array.from(formData.entries());
  const questionsMap = new Map<string, any>();

  for (const [key, value] of entries) {
    if (key.startsWith('answer_')) {
      const qId = key.replace('answer_', '');
      if (!questionsMap.has(qId)) questionsMap.set(qId, { question_id: qId, response: '', comment: '' });
      questionsMap.get(qId).response = value;
    } else if (key.startsWith('comment_')) {
      const qId = key.replace('comment_', '');
      if (!questionsMap.has(qId)) questionsMap.set(qId, { question_id: qId, response: '', comment: '' });
      questionsMap.get(qId).comment = value;
    }
  }

  const questionIds = Array.from(questionsMap.keys());
  const { data: questionsData, error: qError } = await supabase
    .from('template_questions')
    .select('id, max_score, weight')
    .in('id', questionIds);

  if (qError) return { success: false, message: "Sual xətası: " + qError.message };

  const answers = Array.from(questionsMap.values()).map(item => {
    const qInfo = questionsData?.find(q => q.id === item.question_id);
    const maxScore = qInfo?.max_score || 0;
    const calculatedScore = item.response === 'yes' ? maxScore : 0;

    return {
      plan_id: planId,
      question_id: item.question_id,
      response: item.response,
      comment: item.comment,
      score: calculatedScore
    };
  });

  const { error } = await supabase
    .from('audit_answers')
    .upsert(answers, { onConflict: 'plan_id, question_id' })

  if (error) return { success: false, message: "Yadda saxlama xətası: " + error.message };

  revalidatePath(`/dashboard/plans/${planId}`);
  return { success: true, message: "Audit cavabları uğurla yadda saxlanıldı!" };
}

// 2. Dashboard üçün statistik funksiya (Eksport etdiyimizə əmin ol!)
export async function getDashboardStats() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audit_answers')
    .select(`
      score,
      template_questions(weight, max_score)
    `) as { data: any[] | null, error: any }

  if (error || !data) return { averageScore: "0", totalAudits: 0, highRiskCount: 0 }

  let totalWeightedScore = 0
  let totalMaxWeight = 0

  data.forEach((a: any) => {
    const weight = a.template_questions?.weight ?? 1
    const maxScore = a.template_questions?.max_score ?? 10
    const score = a.score ?? 0
    
    totalWeightedScore += (score * weight)
    totalMaxWeight += (maxScore * weight)
  })

  const averageScore = totalMaxWeight > 0 ? (totalWeightedScore / totalMaxWeight) * 100 : 0

  return {
    averageScore: averageScore.toFixed(1),
    totalAudits: 0, 
    highRiskCount: 0
  }
}

export async function getMonthlyTrend() {
  const supabase = await createClient()

  // Son 6 ayın audit nəticələrini qruplaşdırıb çəkirik
  const { data, error } = await supabase
    .from('audit_plans')
    .select(`
      id,
      created_at,
      audit_answers (
        score,
        template_questions (max_score)
      )
    `)

  if (error) return []

  // Məlumatları aylara görə qruplaşdıran sadə məntiq
  const monthlyData: Record<string, { totalScore: number, maxScore: number }> = {}

  data.forEach(plan => {
    const month = new Date(plan.created_at).toLocaleString('az-AZ', { month: 'long' })
    
    if (!monthlyData[month]) monthlyData[month] = { totalScore: 0, maxScore: 0 }
    
    plan.audit_answers.forEach((ans: any) => {
      monthlyData[month].totalScore += ans.score || 0
      monthlyData[month].maxScore += ans.template_questions?.max_score || 10
    })
  })

  return Object.entries(monthlyData).map(([name, val]) => ({
    name,
    score: val.maxScore > 0 ? Math.round((val.totalScore / val.maxScore) * 100) : 0
  }))
}

export async function getAuditReportData(planId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audit_plans')
    .select(`
      id,
      created_at,
      profiles (full_name),
      audit_answers (
        response,
        comment,
        score,
        template_questions (text, max_score, weight)
      )
    `)
    .eq('id', planId)
    .single()

  if (error) throw error
  return data
}
export async function completeAudit(planId: string) {
  const supabase = await createClient()
  
  // Auditi tamamlanmış et
  const { error } = await supabase
    .from('audit_plans')
    .update({ status: 'tamamlandi', updated_at: new Date().toISOString() })
    .eq('id', planId)

  if (error) return { error: "Tamamlama xətası: " + error.message, success: false }
  
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  return { error: null, success: true }
}
// Bu funksiyanı saveAuditAnswers-ın içində, 'error' yoxlamasından sonra çağıra bilərsən
async function checkCriticalAlerts(planId: string) {
  const supabase = await createClient();

  // Auditin ümumi balını hesabla
  const { data: answers } = await supabase
    .from('audit_answers')
    .select('score')
    .eq('plan_id', planId);

  const totalScore = answers?.reduce((acc, curr) => acc + (curr.score || 0), 0) || 0;

  // Əgər bal 50-dən aşağıdırsa, bunu "kritik" statusuna sal
  if (totalScore < 50) {
    await supabase
      .from('audit_plans')
      .update({ status: 'needs_attention' }) // Status sütununun olduğundan əmin ol
      .eq('id', planId);
      
    // Buraya e-mail göndərmə funksiyasını da (məsələn Resend və ya Nodemailer) əlavə edə bilərik
    console.log("Kritik audit aşkarlandı!");
  }
}
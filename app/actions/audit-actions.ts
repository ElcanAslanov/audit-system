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

  const { data: plans, error } = await supabase
    .from('audit_plans')
    .select('id, status, score')

  if (error || !plans) {
    return {
      averageScore: '0',
      totalAudits: 0,
      highRiskCount: 0,
    }
  }

  const completedPlans = (plans || []).filter((plan: any) => {
    return plan.status === 'tamamlandi' || plan.status === 'needs_attention'
  })

  const totalAudits = completedPlans.length

  const totalScore = completedPlans.reduce((sum: number, plan: any) => {
    return sum + Number(plan.score || 0)
  }, 0)

  const averageScore =
    totalAudits > 0 ? (totalScore / totalAudits).toFixed(1) : '0'

  const highRiskCount = (plans || []).filter((plan: any) => {
    const score = Number(plan.score || 0)

    return plan.status === 'needs_attention' || score < 50
  }).length

  return {
    averageScore,
    totalAudits,
    highRiskCount,
  }
}

export async function getMonthlyTrend() {
  const supabase = await createClient()

  const { data: plans, error } = await supabase
    .from('audit_plans')
    .select('id, score, status, created_at')
    .in('status', ['tamamlandi', 'needs_attention'])
    .not('score', 'is', null)
    .order('created_at', { ascending: true })

  if (error || !plans) {
    return []
  }

  const monthNames = [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'İyun',
    'İyul',
    'Avqust',
    'Sentyabr',
    'Oktyabr',
    'Noyabr',
    'Dekabr',
  ]

  const grouped = new Map<string, { total: number; count: number; sort: string }>()

  for (const plan of plans as any[]) {
    if (!plan.created_at) continue

    const date = new Date(plan.created_at)
    const year = date.getFullYear()
    const month = date.getMonth()

    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    const label = `${monthNames[month]} ${year}`

    const current = grouped.get(key) || {
      total: 0,
      count: 0,
      sort: label,
    }

    current.total += Number(plan.score || 0)
    current.count += 1
    current.sort = label

    grouped.set(key, current)
  }

  return Array.from(grouped.entries()).map(([key, item]) => ({
    name: item.sort,
    score: item.count > 0 ? Math.round(item.total / item.count) : 0,
    key,
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

export async function getRecentAudits() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audit_plans')
    .select(`
      id,
      title,
      department,
      status,
      score,
      due_date,
      created_at,
      companies(name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    return []
  }

  return (data || []).map((item: any) => ({
    ...item,
    companies: Array.isArray(item.companies)
      ? item.companies[0] || null
      : item.companies || null,
  }))
}

export async function getRiskSummary() {
  const supabase = await createClient()

  const { data: findings, error } = await supabase
    .from('findings')
    .select('severity, status')

  if (error || !findings) {
    return {
      high: 0,
      medium: 0,
      low: 0,
      open: 0,
      resolved: 0,
    }
  }

  const isResolved = (status?: string | null) => {
    return status === 'hell_olundu' || status === 'resolved' || status === 'closed'
  }

  const isOpen = (status?: string | null) => {
    return !isResolved(status)
  }

  return {
    high: findings.filter((f: any) => f.severity === 'high').length,
    medium: findings.filter((f: any) => f.severity === 'medium').length,
    low: findings.filter((f: any) => f.severity === 'low').length,
    open: findings.filter((f: any) => isOpen(f.status)).length,
    resolved: findings.filter((f: any) => isResolved(f.status)).length,
  }
}

export async function getAuditChartData() {
  const supabase = await createClient()

  const { data: plans, error } = await supabase
    .from('audit_plans')
    .select('id, status, score, created_at')
    .order('created_at', { ascending: true })

  if (error || !plans) {
    return {
      yearly: [],
      monthly: [],
      monthlyScore: [],
      status: [],
    }
  }

  const monthNames = [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'İyun',
    'İyul',
    'Avqust',
    'Sentyabr',
    'Oktyabr',
    'Noyabr',
    'Dekabr',
  ]

  const yearlyMap = new Map<string, number>()
  const monthlyMap = new Map<string, number>()
  const monthlyScoreMap = new Map<string, { total: number; count: number }>()
  const statusMap = new Map<string, number>()

  for (const plan of plans as any[]) {
    if (!plan.created_at) continue

    const date = new Date(plan.created_at)
    const year = String(date.getFullYear())
    const month = date.getMonth()
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
    const monthLabel = `${monthNames[month]} ${year}`

    yearlyMap.set(year, (yearlyMap.get(year) || 0) + 1)

    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1)

    const score = Number(plan.score || 0)
    if (plan.status === 'tamamlandi' || plan.status === 'needs_attention') {
      const current = monthlyScoreMap.get(monthKey) || { total: 0, count: 0 }
      current.total += score
      current.count += 1
      monthlyScoreMap.set(monthKey, current)
    }

    const status = plan.status || 'planlanan'
    statusMap.set(status, (statusMap.get(status) || 0) + 1)
  }

  const yearly = Array.from(yearlyMap.entries()).map(([year, count]) => ({
    year,
    count,
  }))

  const monthly = Array.from(monthlyMap.entries()).map(([key, count]) => {
    const [year, monthRaw] = key.split('-')
    const monthIndex = Number(monthRaw) - 1

    return {
      key,
      month: `${monthNames[monthIndex]} ${year}`,
      count,
    }
  })

  const monthlyScore = Array.from(monthlyScoreMap.entries()).map(
    ([key, value]) => {
      const [year, monthRaw] = key.split('-')
      const monthIndex = Number(monthRaw) - 1

      return {
        key,
        month: `${monthNames[monthIndex]} ${year}`,
        score:
          value.count > 0 ? Math.round(value.total / value.count) : 0,
      }
    }
  )

  const statusLabel = (value: string) => {
    if (value === 'tamamlandi') return 'Tamamlandı'
    if (value === 'needs_attention') return 'Diqqət tələb edir'
    if (value === 'planlanan') return 'Planlanan'
    return value || '-'
  }

  const status = Array.from(statusMap.entries()).map(([name, value]) => ({
    name: statusLabel(name),
    value,
  }))

  return {
    yearly,
    monthly,
    monthlyScore,
    status,
  }
}
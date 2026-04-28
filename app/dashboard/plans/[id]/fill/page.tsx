import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChecklistForm from '@/components/audit/checklist-form'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function FillAuditPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Planı çək
  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('*, audit_templates(id, title)')
    .eq('id', id)
    .single()

  if (planError || !plan) {
    return <div className="p-8 text-red-600">Plan tapılmadı.</div>
  }

  // 2. Şablonun olub-olmadığını yoxla
  if (!plan.audit_templates) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-xl font-bold">Xəta</h2>
        <p>Bu audit planı üçün şablon təyin olunmayıb.</p>
      </div>
    )
  }

  // 3. İSTİFADƏÇİLƏRİ ÇƏK (Bura vacib idi!)
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name')

  // 4. Şablona aid olan sualları çək
  const { data: questions } = await supabase
    .from('template_questions')
    .select(`
      id, 
      question_text, 
      template_sections!inner(template_id)
    `)
    .eq('template_sections.template_id', plan.audit_templates.id)
    .order('sort_order', { ascending: true })

  // 5. Əvvəlki cavabları çək
  const { data: existingAnswers } = await supabase
    .from('audit_answers')
    .select('question_id, answer')
    .eq('plan_id', id)

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold text-slate-900">{plan.title}</h1>
        <p className="text-slate-500 mt-2">
           Şablon: <span className="font-medium text-slate-700">{plan.audit_templates?.title}</span>
        </p>
      </div>

      <ChecklistForm 
        questions={questions || []} 
        planId={id} 
        initialAnswers={existingAnswers || []} 
        users={users || []} 
      />
    </div>
  )
}
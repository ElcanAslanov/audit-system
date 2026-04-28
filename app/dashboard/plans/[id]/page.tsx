import { createClient } from '@/lib/supabase/server'
import ChecklistForm from '@/components/audit/checklist-form'
import { notFound } from 'next/navigation'

export default async function AuditPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  // 1. Planı və ona bağlı şablonu çəkirik
  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select(`
      *,
      audit_templates (
        id,
        title
      )
    `)
    .eq('id', params.id)
    .single()

  if (planError || !plan) {
    notFound()
  }

  // 2. Şablona aid bütün sualları bölmələr üzərindən çəkirik
  const { data: questions, error: qError } = await supabase
    .from('template_questions')
    .select(`
      *,
      template_sections!inner (
        template_id
      )
    `)
    .eq('template_sections.template_id', plan.audit_templates.id)

  if (qError) {
    console.error("Suallar çəkilərkən xəta:", qError.message)
  }

  // 3. Əgər bu audit planı üzrə daha əvvəl cavablar yazılıbsa, onları gətiririk
  const { data: existingAnswers } = await supabase
    .from('audit_answers')
    .select('*')
    .eq('plan_id', params.id)

  // 4. Form üçün istifadəçi siyahısını çəkirik (Xətanı aradan qaldırır)
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role')

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Audit: {plan.title}</h1>
        <div className="flex gap-4 mt-2 text-sm text-gray-500">
          <p>Şablon: <span className="font-medium text-gray-700">{plan.audit_templates.title}</span></p>
          <p>•</p>
          <p>Yaradılma: <span className="font-medium text-gray-700">{new Date(plan.created_at).toLocaleDateString('az-AZ')}</span></p>
        </div>
      </div>
      
      <ChecklistForm 
        questions={questions || []} 
        planId={params.id} 
        initialAnswers={existingAnswers || []} 
        users={users || []} // İndi users dəyişəni tanımlıdır
      />
    </div>
  )
}
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ChecklistForm from '@/components/audit/checklist-form'

type PageProps = {
  params: Promise<{ id: string }>
}

function statusLabel(value?: string | null) {
  if (value === 'tamamlandi') return 'Tamamlandı'
  if (value === 'needs_attention') return 'Diqqət tələb edir'
  if (value === 'planlanan') return 'Planlanan'
  return value || '-'
}

function statusClass(value?: string | null) {
  if (value === 'tamamlandi') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (value === 'needs_attention') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

export default async function FillAuditPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select(`
      *,
      companies(name),
      audit_templates(id, title)
    `)
    .eq('id', id)
    .maybeSingle()

  if (planError) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Plan yüklənərkən xəta: {planError.message}
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Plan tapılmadı və ya bu auditə giriş icazəniz yoxdur.
      </div>
    )
  }

  if (!plan.audit_templates) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <h2 className="text-xl font-bold">Xəta</h2>
          <p className="mt-2">Bu audit planı üçün şablon təyin olunmayıb.</p>
        </div>
      </div>
    )
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name')

  const { data: questions } = await supabase
    .from('template_questions')
    .select(`
      id,
      question_text,
      max_score,
      template_sections!inner(
        id,
        title,
        template_id,
        sort_order
      )
    `)
    .eq('template_sections.template_id', plan.audit_templates.id)
    .order('sort_order', { ascending: true })

  const normalizedQuestions = (questions || []).map((question: any) => ({
  ...question,
  template_sections: Array.isArray(question.template_sections)
    ? question.template_sections[0] || null
    : question.template_sections || null,
}))  

  const { data: existingAnswers } = await supabase
    .from('audit_answers')
    .select('question_id, response, comment, score')
    .eq('plan_id', id)

  const normalizedCompany = Array.isArray(plan.companies)
    ? plan.companies[0] || null
    : plan.companies || null

const answeredCount = existingAnswers?.length || 0
const totalQuestions = normalizedQuestions.length

const hasAnswers = answeredCount > 0
const isCompletedOrAttention =
  plan.status === 'tamamlandi' || plan.status === 'needs_attention'

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/dashboard/plans"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Audit planlarına qayıt
          </Link>

          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {plan.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Şablon:{' '}
            <span className="font-semibold text-slate-700">
              {plan.audit_templates?.title}
            </span>{' '}
            • Şirkət:{' '}
            <span className="font-semibold text-slate-700">
              {normalizedCompany?.name || '-'}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
              plan.status
            )}`}
          >
            {statusLabel(plan.status)}
          </span>

          <Link
            href={`/dashboard/plans/${id}`}
            className="inline-flex w-full justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            Detail səhifə
          </Link>
        </div>
      </div>

      {hasAnswers && (
  <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800 shadow-sm sm:p-5">
    <h2 className="font-bold">Bu audit redaktə olunur</h2>
    <p className="mt-2 text-sm leading-6">
      Bu audit üçün artıq {answeredCount} cavab yadda saxlanılıb. Yeni dəyişiklik
      etdikdə cavablar və hesablanmış nəticələr yenilənə bilər.
    </p>
  </section>
)}

{isCompletedOrAttention && (
  <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 shadow-sm sm:p-5">
    <h2 className="font-bold">Diqqət</h2>
    <p className="mt-2 text-sm leading-6">
      Bu auditin statusu “{statusLabel(plan.status)}” olaraq görünür. Cavabları
      dəyişsəniz, score və hesabat məlumatları yenidən hesablana bilər.
    </p>
  </section>
)}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Ümumi sual</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {totalQuestions}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">Cavablanmış</p>
          <p className="mt-2 text-3xl font-black text-blue-700">
            {answeredCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Score</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">
            {plan.score ?? 0}%
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Checklist cavabları
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sualları cavablandırın, şərh əlavə edin və problem olduqda tapıntı
            yaradın.
          </p>
        </div>

     <ChecklistForm
  questions={normalizedQuestions}
  planId={id}
  initialAnswers={existingAnswers || []}
  users={users || []}
/>
      </section>
    </div>
  )
}
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

function normalizeOne(value: any) {
  return Array.isArray(value) ? value[0] || null : value || null
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

  const legacyTemplate = normalizeOne(plan.audit_templates)

  const { data: planTemplates, error: planTemplatesError } = await supabase
    .from('audit_plan_templates')
    .select(`
      template_id,
      audit_templates(id, title)
    `)
    .eq('plan_id', id)

  if (planTemplatesError) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Plan şablonları yüklənərkən xəta: {planTemplatesError.message}
      </div>
    )
  }

  const selectedTemplateIds =
    planTemplates && planTemplates.length > 0
      ? planTemplates
          .map((item: any) => item.template_id)
          .filter(Boolean)
      : legacyTemplate?.id
        ? [legacyTemplate.id]
        : []

  const selectedTemplateNames =
    planTemplates && planTemplates.length > 0
      ? planTemplates
          .map((item: any) => {
            const template = normalizeOne(item.audit_templates)
            return template?.title
          })
          .filter(Boolean)
          .join(', ')
      : legacyTemplate?.title || '-'

  if (selectedTemplateIds.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <h2 className="text-xl font-bold">Xəta</h2>
          <p className="mt-2">Bu audit planı üçün şablon təyin olunmayıb.</p>
          <Link
            href="/dashboard/plans"
            className="mt-5 inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Audit planlarına qayıt
          </Link>
        </div>
      </div>
    )
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name', { ascending: true })

  const { data: questions, error: questionsError } = await supabase
    .from('template_questions')
    .select(`
      id,
      question_text,
      max_score,
      input_type,
      sort_order,
      template_sections!inner(
        id,
        title,
        template_id,
        sort_order,
        audit_templates(id, title)
      )
    `)
    .in('template_sections.template_id', selectedTemplateIds)
    .order('sort_order', { ascending: true })

  if (questionsError) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Sualları oxuyarkən xəta: {questionsError.message}
      </div>
    )
  }

  const normalizedQuestions = (questions || [])
    .map((question: any) => {
      const section = normalizeOne(question.template_sections)
      const template = normalizeOne(section?.audit_templates)

      return {
        ...question,
        template_sections: section
          ? {
              ...section,
              audit_templates: template,
            }
          : null,
      }
    })
    .sort((a: any, b: any) => {
      const sectionA = a.template_sections
      const sectionB = b.template_sections

      const templateTitleA = sectionA?.audit_templates?.title || ''
      const templateTitleB = sectionB?.audit_templates?.title || ''

      if (templateTitleA !== templateTitleB) {
        return templateTitleA.localeCompare(templateTitleB, 'az')
      }

      const sectionOrderA = Number(sectionA?.sort_order || 0)
      const sectionOrderB = Number(sectionB?.sort_order || 0)

      if (sectionOrderA !== sectionOrderB) {
        return sectionOrderA - sectionOrderB
      }

      return Number(a.sort_order || 0) - Number(b.sort_order || 0)
    })

  const { data: existingAnswers } = await supabase
    .from('audit_answers')
    .select('question_id, response, comment, score')
    .eq('plan_id', id)

  const normalizedCompany = normalizeOne(plan.companies)

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
            Şablonlar:{' '}
            <span className="font-semibold text-slate-700">
              {selectedTemplateNames}
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

      {planTemplates && planTemplates.length > 1 && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-800 shadow-sm sm:p-5">
          <h2 className="font-bold">Multi-template audit</h2>
          <p className="mt-2 text-sm leading-6">
            Bu audit planında {planTemplates.length} şablon birləşdirilib.
            Checklist-də bütün seçilmiş şablonlara aid suallar göstərilir.
          </p>
        </section>
      )}

      {hasAnswers && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800 shadow-sm sm:p-5">
          <h2 className="font-bold">Bu audit redaktə olunur</h2>
          <p className="mt-2 text-sm leading-6">
            Bu audit üçün artıq {answeredCount} cavab yadda saxlanılıb. Yeni
            dəyişiklik etdikdə cavablar və hesablanmış nəticələr yenilənə bilər.
          </p>
        </section>
      )}

      {isCompletedOrAttention && (
        <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 shadow-sm sm:p-5">
          <h2 className="font-bold">Diqqət</h2>
          <p className="mt-2 text-sm leading-6">
            Bu auditin statusu “{statusLabel(plan.status)}” olaraq görünür.
            Cavabları dəyişsəniz, score və hesabat məlumatları yenidən
            hesablana bilər.
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
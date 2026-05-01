import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FindingStatusSelect from '@/components/audit/finding-status-select'
import AuditFileLink from '@/components/audit/audit-file-link'

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

function scoreClass(score?: number | null) {
  const value = Number(score || 0)

  if (value >= 80) return 'text-emerald-700'
  if (value >= 50) return 'text-yellow-700'
  return 'text-red-700'
}

function answerLabel(value?: string | null) {
  if (value === 'yes') return 'Bəli'
  if (value === 'no') return 'Xeyr'
  if (value === 'na') return 'N/A'
  return '-'
}

function answerBadgeClass(value?: string | null) {
  if (value === 'yes') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (value === 'no') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'na') return 'border-slate-200 bg-slate-50 text-slate-600'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function severityClass(value?: string | null) {
  if (value === 'high') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'medium') return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

export default async function AuditDetailPage({ params }: PageProps) {
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
        Audit yüklənərkən xəta: {planError.message}
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Audit tapılmadı və ya bu rolda baxış icazəsi yoxdur.
      </div>
    )
  }

  const isCreator = plan.created_by === user.id
const isViewLocked = Boolean(plan.locked_view)
const isEditLocked = Boolean(plan.locked_edit)

if (isViewLocked && !isCreator) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow-sm">
        <h2 className="text-xl font-black">Audit planına giriş kilidlənib</h2>

        <p className="mt-2 text-sm leading-6">
          Bu planı yaradan istifadəçi baxışı bağlayıb. Bu auditə baxmaq və ya
          dəyişiklik etmək mümkün deyil.
        </p>

        <Link
          href="/dashboard/plans"
          className="mt-5 inline-flex rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
        >
          Audit planlarına qayıt
        </Link>
      </div>
    </div>
  )
}

  const { data: planTemplates } = await supabase
    .from('audit_plan_templates')
    .select(`
    template_id,
    audit_templates(id, title)
  `)
    .eq('plan_id', id)

  const selectedTemplateNames =
    planTemplates && planTemplates.length > 0
      ? planTemplates
        .map((item: any) => {
          const template = Array.isArray(item.audit_templates)
            ? item.audit_templates[0] || null
            : item.audit_templates || null

          return template?.title
        })
        .filter(Boolean)
        .join(', ')
      : plan.audit_templates?.title || '-'

  const { data: planTemplateSections } = await supabase
    .from('audit_plan_template_sections')
    .select(`
    section_id,
    template_sections(
      id,
      title,
      sort_order,
      audit_templates(id, title)
    )
  `)
    .eq('plan_id', id)

  const selectedSectionNames =
    planTemplateSections && planTemplateSections.length > 0
      ? planTemplateSections
        .map((item: any) => {
          const section = Array.isArray(item.template_sections)
            ? item.template_sections[0] || null
            : item.template_sections || null

          const template = Array.isArray(section?.audit_templates)
            ? section.audit_templates[0] || null
            : section?.audit_templates || null

          return section?.title
            ? `${template?.title || 'Şablon'} / ${section.title}`
            : null
        })
        .filter(Boolean)
        .join(', ')
      : '-'

  const { data: answers } = await supabase
    .from('audit_answers')
    .select(`
    id,
    response,
    comment,
    score,
    question_id,
    template_questions(
      question_text,
      max_score,
      template_sections(
        id,
        title,
        sort_order,
        audit_templates(id, title)
      )
    )
  `)
    .eq('plan_id', id)

  const { data: findings } = await supabase
    .from('findings')
    .select(`
      id,
      title,
      severity,
      description,
      deadline,
      status,
      assigned_to,
      profiles(full_name)
    `)
    .eq('plan_id', id)

  const hasAnswers = (answers?.length || 0) > 0

  const normalizedCompany = Array.isArray(plan.companies)
    ? plan.companies[0] || null
    : plan.companies || null

  const totalAnswers = answers?.length || 0
  const problemAnswers =
    answers?.filter((answer: any) => answer.response === 'no').length || 0

  const highFindings =
    findings?.filter((finding: any) => finding.severity === 'high').length || 0

  const score = Number(plan.score || 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
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

          <div className="flex flex-col gap-2 sm:flex-row">
           {isEditLocked ? (
  <span className="inline-flex w-full justify-center rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700 sm:w-auto">
    Redaktə kilidlidir
  </span>
) : (
  <Link
    href={`/dashboard/plans/${id}/fill`}
    className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
  >
    Auditi redaktə et
  </Link>
)}

            {hasAnswers ? (
              <Link
                href={`/dashboard/plans/${id}/report`}
                className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
              >
                PDF Hesabat
              </Link>
            ) : (
              <span className="inline-flex w-full justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400 sm:w-auto">
                PDF üçün əvvəl auditi doldurun
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Status</p>
          <p className="mt-2 font-bold text-slate-900">
            {statusLabel(plan.status)}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">Score</p>
          <p className={`mt-2 text-3xl font-black ${scoreClass(score)}`}>
            {score}%
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-700">High Risk</p>
          <p className="mt-2 text-3xl font-black text-red-700">
            {highFindings}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Deadline</p>
          <p className="mt-2 font-bold text-slate-900">
            {plan.due_date || '-'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <p className="text-sm font-semibold text-slate-500">Kilid statusu</p>
  <p
    className={`mt-2 font-bold ${
      isViewLocked
        ? 'text-red-700'
        : isEditLocked
          ? 'text-yellow-700'
          : 'text-emerald-700'
    }`}
  >
    {isViewLocked
      ? 'Baxış və redaktə kilidli'
      : isEditLocked
        ? 'Redaktə kilidli'
        : 'Kilidsiz'}
  </p>
</div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Overview</h2>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Departament
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {plan.department || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Şirkət
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {normalizedCompany?.name || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Şablonlar
                </p>
                <p className="mt-1 font-semibold leading-6 text-slate-900">
                  {selectedTemplateNames}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Seçilmiş bölmələr
                </p>
                <p className="mt-1 font-semibold leading-6 text-slate-900">
                  {selectedSectionNames}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Yaradan
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {plan.created_by || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Qeydlər
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-700">
                  {plan.notes || '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Files</h2>

            <div className="mt-4">
              {plan.file_url ? (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Əlavə olunmuş fayl
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-700">
                      {plan.file_url}
                    </p>
                  </div>

                  <AuditFileLink filePath={plan.file_url} />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Fayl əlavə olunmayıb.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Qısa xülasə</h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Cavablar</p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {totalAnswers}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3">
                <p className="text-xs text-red-700">Problem</p>
                <p className="mt-1 text-2xl font-black text-red-700">
                  {problemAnswers}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Checklist</h2>
                <p className="text-sm text-slate-500">
                  Suallar üzrə cavablar və hesablanmış ballar
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {(answers || []).length === 0 && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Hələ cavab yoxdur.
                </p>
              )}

              {(answers || []).map((answer: any, index: number) => (
                <article
                  key={answer.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Sual #{index + 1}
                      </p>

                      {(() => {
                        const question = Array.isArray(answer.template_questions)
                          ? answer.template_questions[0] || null
                          : answer.template_questions || null

                        const section = Array.isArray(question?.template_sections)
                          ? question.template_sections[0] || null
                          : question?.template_sections || null

                        const template = Array.isArray(section?.audit_templates)
                          ? section.audit_templates[0] || null
                          : section?.audit_templates || null

                        return (
                          <>
                            <p className="mt-1 text-xs font-semibold text-blue-600">
                              {template?.title || 'Şablon'} / {section?.title || 'Bölmə'}
                            </p>

                            <h3 className="mt-1 font-bold text-slate-900">
                              {question?.question_text || 'Sual'}
                            </h3>
                          </>
                        )
                      })()}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${answerBadgeClass(
                          answer.response
                        )}`}
                      >
                        {answerLabel(answer.response)}
                      </span>

                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {answer.score ?? 0} /{' '}
                        {(() => {
                          const question = Array.isArray(answer.template_questions)
                            ? answer.template_questions[0] || null
                            : answer.template_questions || null

                          return question?.max_score ?? '-'
                        })()}
                      </span>
                    </div>
                  </div>

                  {answer.comment && (
                    <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                      {answer.comment}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Findings</h2>
                <p className="text-sm text-slate-500">
                  Tapıntılar, risklər və icra statusları
                </p>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {findings?.length || 0} tapıntı
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {(findings || []).length === 0 && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Tapıntı yoxdur.
                </p>
              )}

              {(findings || []).map((finding: any, index: number) => (
                <article
                  key={finding.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Tapıntı #{index + 1}
                      </p>

                      <h3 className="mt-1 font-bold text-slate-900">
                        {finding.title}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase ${severityClass(
                        finding.severity
                      )}`}
                    >
                      {finding.severity || 'low'}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {finding.description || '-'}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                        Status
                      </p>
                      <FindingStatusSelect
                        findingId={finding.id}
                        planId={id}
                        currentStatus={finding.status}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Deadline
                      </p>
                      <p className="mt-1 font-bold text-slate-900">
                        {finding.deadline || '-'}
                      </p>
                    </div>

                    

                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Cavabdeh
                      </p>
                      <p className="mt-1 font-bold text-slate-900">
                        {finding.profiles?.full_name || '-'}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
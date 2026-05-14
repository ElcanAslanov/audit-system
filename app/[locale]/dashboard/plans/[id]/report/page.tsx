import {createClient} from '@/lib/supabase/server'
import {redirect} from 'next/navigation'
import {Link} from '@/i18n/routing'
import {getTranslations} from 'next-intl/server'
import PrintReportButton from '@/components/audit/print-report-button'
import AuditQuestionModal from '@/components/audit/audit-question-modal'
import ScrollToAnswer from '@/components/audit/scroll-to-answer'

type PageProps = {
  params: Promise<{id: string}>
  searchParams?: Promise<{answer?: string}>
}

function normalizeOne(value: any) {
  return Array.isArray(value) ? value[0] || null : value || null
}

function answerBadgeClass(value?: string | null) {
  if (value === 'yes') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (value === 'no') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'na') return 'border-slate-200 bg-slate-50 text-slate-600'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function riskBadgeClass(value?: string | null) {
  if (value === 'high') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'medium') return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function commentTypeLabel(value?: string | null) {
  if (value === 'question') return 'Sual'
  if (value === 'comment') return 'Rəy'
  return '-'
}

function commentStatusLabel(value?: string | null) {
  if (value === 'open') return 'Açıq'
  if (value === 'answered') return 'Cavablandırılıb'
  if (value === 'closed') return 'Bağlanıb'
  return value || '-'
}

function commentStatusClass(value?: string | null) {
  if (value === 'open') return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  if (value === 'answered') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (value === 'closed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function priorityLabel(value?: string | null) {
  if (value === 'low') return 'Aşağı'
  if (value === 'normal') return 'Normal'
  if (value === 'high') return 'Yüksək'
  if (value === 'urgent') return 'Təcili'
  return '-'
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const raw = String(value)
  const dateTimeMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/
  )

  if (dateTimeMatch) {
    const [, year, month, day, hour, minute] = dateTimeMatch
    return `${day}.${month}.${year} ${hour}:${minute}`
  }

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    return `${day}.${month}.${year}`
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return raw
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}.${month}.${year}`
}

export default async function AuditReportPage({params, searchParams}: PageProps) {
  const t = await getTranslations('auditReport')

  const answerLabel = (value?: string | null) => {
    if (value === 'yes') return t('yes')
    if (value === 'no') return t('no')
    if (value === 'na') return t('na')
    return '-'
  }

  const statusLabel = (value?: string | null) => {
    if (value === 'tamamlandi') return t('completed')
    if (value === 'needs_attention') return t('needsAttention')
    if (value === 'planlanan') return t('planned')
    if (value === 'aciq') return t('open')
    if (value === 'icrada') return t('inProgress')
    if (value === 'hell_olundu') return t('resolved')
    return value || '-'
  }

  const {id} = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const highlightedAnswerId = String(resolvedSearchParams?.answer || '').trim()

  const supabase = await createClient()

  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const {data: plan, error: planError} = await supabase
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
        {t('loadError', {message: planError.message})}
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        {t('notFound')}
      </div>
    )
  }

  const {data: profile} = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = profile?.role === 'admin'
  const isCreator = plan.created_by === user.id
  const canManageLock = isAdmin || isCreator

  const isViewLocked = Boolean(plan.locked_view)
  const isEditLocked = Boolean(plan.locked_edit)

  if (isViewLocked && !canManageLock) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow-sm">
          <h2 className="text-xl font-black">{t('lockedTitle')}</h2>

          <p className="mt-2 text-sm leading-6">
            {t('lockedDescription')}
          </p>

          <Link
            href="/dashboard/plans"
            className="mt-5 inline-flex rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            {t('backToPlans')}
          </Link>
        </div>
      </div>
    )
  }

  const legacyTemplate = normalizeOne(plan.audit_templates)

  const {data: planTemplates} = await supabase
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
            const template = normalizeOne(item.audit_templates)
            return template?.title
          })
          .filter(Boolean)
          .join(', ')
      : legacyTemplate?.title || '-'

  const {data: planTemplateSections} = await supabase
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
            const section = normalizeOne(item.template_sections)
            const template = normalizeOne(section?.audit_templates)

            return section?.title
              ? `${template?.title || t('templateFallback')} / ${section.title}`
              : null
          })
          .filter(Boolean)
          .join(', ')
      : '-'

  const {data: answers} = await supabase
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
        sort_order,
        template_sections(
          title,
          sort_order,
          audit_templates(title)
        )
      )
    `)
    .eq('plan_id', id)

  if (!answers || answers.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-800 shadow-sm">
          <h1 className="text-xl font-bold">{t('notReadyTitle')}</h1>
          <p className="mt-2 text-sm leading-6">
            {t('notReadyDescription')}
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {isEditLocked ? (
              <span className="inline-flex w-full justify-center rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm font-semibold text-yellow-700 sm:w-auto">
                {t('editLocked')}
              </span>
            ) : (
              <Link
                href={`/dashboard/plans/${id}/fill`}
                className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
              >
                {t('fillAudit')}
              </Link>
            )}

            <Link
              href={`/dashboard/plans/${id}`}
              className="inline-flex w-full justify-center rounded-lg border border-yellow-200 bg-white px-4 py-2.5 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-100 sm:w-auto"
            >
              {t('backToDetail')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const {data: findings} = await supabase
    .from('findings')
    .select(`
      id,
      title,
      severity,
      description,
      deadline,
      status,
      profiles(full_name)
    `)
    .eq('plan_id', id)
    .order('deadline', {ascending: true, nullsFirst: false})

  const {data: assignedAuditors} = await supabase
    .from('plan_assignments')
    .select(`
      user_id,
      profiles(full_name)
    `)
    .eq('plan_id', id)

  const auditorOptions = (assignedAuditors || [])
    .map((item: any) => {
      const assignedProfile = normalizeOne(item.profiles)

      return {
        id: item.user_id,
        full_name: assignedProfile?.full_name || null,
      }
    })
    .filter((item: any) => item.id)

  const {data: auditComments} = await supabase
    .from('audit_comments')
    .select(`
      id,
      plan_id,
      answer_id,
      question_id,
      sender_id,
      recipient_id,
      type,
      status,
      priority,
      message,
      parent_id,
      created_at
    `)
    .eq('plan_id', id)
    .is('parent_id', null)
    .order('created_at', {ascending: false})

  const commentUserIds = Array.from(
    new Set(
      (auditComments || [])
        .flatMap((comment: any) => [comment.sender_id, comment.recipient_id])
        .filter(Boolean)
    )
  )

  const profilesById = new Map<string, any>()

  if (commentUserIds.length > 0) {
    const {data: commentProfiles} = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', commentUserIds)

    ;(commentProfiles || []).forEach((item: any) => {
      profilesById.set(item.id, item)
    })
  }

  const commentsByAnswerId = new Map<string, any[]>()

  ;(auditComments || []).forEach((comment: any) => {
    if (!comment.answer_id) return

    const senderProfile = profilesById.get(comment.sender_id)

    const normalizedComment = {
      ...comment,
      sender_name: senderProfile?.full_name || '-',
    }

    const existing = commentsByAnswerId.get(comment.answer_id) || []
    existing.push(normalizedComment)
    commentsByAnswerId.set(comment.answer_id, existing)
  })

  const normalizedCompany = normalizeOne(plan.companies)

  const normalizedAnswers = (answers || [])
    .map((answer: any) => {
      const question = normalizeOne(answer.template_questions)
      const section = normalizeOne(question?.template_sections)
      const template = normalizeOne(section?.audit_templates)

      return {
        ...answer,
        template_questions: question
          ? {
              ...question,
              template_sections: section
                ? {
                    ...section,
                    audit_templates: template,
                  }
                : null,
            }
          : null,
      }
    })
    .sort((a: any, b: any) => {
      const qa = a.template_questions
      const qb = b.template_questions

      const templateA = qa?.template_sections?.audit_templates?.title || ''
      const templateB = qb?.template_sections?.audit_templates?.title || ''

      if (templateA !== templateB) return templateA.localeCompare(templateB, 'az')

      const sectionA = Number(qa?.template_sections?.sort_order || 0)
      const sectionB = Number(qb?.template_sections?.sort_order || 0)

      if (sectionA !== sectionB) return sectionA - sectionB

      return Number(qa?.sort_order || 0) - Number(qb?.sort_order || 0)
    })

  const highlightedAnswerExists = highlightedAnswerId
    ? normalizedAnswers.some((answer: any) => answer.id === highlightedAnswerId)
    : false

  const highFindings =
    findings?.filter((finding: any) => finding.severity === 'high').length || 0

  const mediumFindings =
    findings?.filter((finding: any) => finding.severity === 'medium').length || 0

  const lowFindings =
    findings?.filter((finding: any) => finding.severity === 'low').length || 0

  const totalQuestions = normalizedAnswers.length
  const negativeAnswers =
    normalizedAnswers.filter((answer: any) => answer.response === 'no').length ||
    0

  const earnedScore = normalizedAnswers
    .filter((answer: any) => answer.response !== 'na')
    .reduce((sum: number, answer: any) => sum + Number(answer.score || 0), 0)

  const possibleScore = normalizedAnswers
    .filter((answer: any) => answer.response !== 'na')
    .reduce((sum: number, answer: any) => {
      return sum + Number(answer.template_questions?.max_score || 10)
    }, 0)

  const score = Number(plan.score || 0)

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 lg:p-8 print:min-h-0 print:bg-white print:p-0">
      {highlightedAnswerExists && (
  <ScrollToAnswer answerId={highlightedAnswerId} />
)}

      <div className="mx-auto mb-4 flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link
          href={`/dashboard/plans/${id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← {t('backToAuditDetail')}
        </Link>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500 sm:text-sm">
            {t('printHint')}
          </p>

          <PrintReportButton />
        </div>
      </div>

      <main
        id="audit-report-print-area"
        className="mx-auto max-w-5xl bg-white print:m-0 print:max-w-none"
      >
        <article className="print-report overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm print:w-full print:rounded-none print:border-0 print:shadow-none">
          <section className="relative overflow-hidden bg-slate-950 px-5 py-8 text-white sm:px-8 lg:px-10 print:px-8 print:py-7">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-blue-600/30" />
            <div className="absolute bottom-0 right-16 h-20 w-20 rounded-t-full bg-emerald-500/20" />

            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between print:flex-row">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">
                  {t('reportLabel')}
                </p>

                <h1 className="mt-3 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl print:text-3xl">
                  {plan.title}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  {t('reportDescription')}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-left backdrop-blur sm:min-w-40 sm:text-right print:min-w-40 print:text-right">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  {t('totalScore')}
                </p>

                <p className="mt-1 text-4xl font-black text-white">{score}%</p>

                <p className="mt-1 text-xs text-slate-300">
                  {statusLabel(plan.status)}
                </p>
              </div>
            </div>
          </section>

          <div className="space-y-8 p-5 sm:p-8 lg:p-10 print:p-8">
            {highlightedAnswerId && (
              <section
                className={`print:hidden rounded-2xl border p-4 ${
                  highlightedAnswerExists
                    ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {highlightedAnswerExists ? (
                  <>
                    <p className="text-sm font-black">
                      Bildirişdən açılan audit cavabı seçilib.
                    </p>
                    <p className="mt-1 text-xs font-semibold">
                      Səhifə həmin sual/cavab blokuna yönləndirilir.
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-black">
                    Bildirişdə göstərilən cavab bu hesabatda tapılmadı.
                  </p>
                )}
              </section>
            )}

            <section className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5 print:grid-cols-5">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  {t('company')}
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {normalizedCompany?.name || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  {t('department')}
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {plan.department || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  {t('templates')}
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {selectedTemplateNames}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  {t('selectedSections')}
                </p>
                <p className="mt-1 font-bold leading-6 text-slate-900">
                  {selectedSectionNames}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  {t('deadline')}
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {formatDate(plan.due_date)}
                </p>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {t('resultSummary')}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {t('resultSummaryDescription')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
                <div className="print-card rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-semibold text-blue-700">
                    {t('score')}
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-800">
                    {score}%
                  </p>
                </div>

                <div className="print-card rounded-2xl border border-red-100 bg-red-50 p-5">
                  <p className="text-sm font-semibold text-red-700">
                    {t('highRisk')}
                  </p>
                  <p className="mt-2 text-3xl font-black text-red-700">
                    {highFindings}
                  </p>
                </div>

                <div className="print-card rounded-2xl border border-yellow-100 bg-yellow-50 p-5">
                  <p className="text-sm font-semibold text-yellow-700">
                    {t('mediumRisk')}
                  </p>
                  <p className="mt-2 text-3xl font-black text-yellow-700">
                    {mediumFindings}
                  </p>
                </div>

                <div className="print-card rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm font-semibold text-emerald-700">
                    {t('lowRisk')}
                  </p>
                  <p className="mt-2 text-3xl font-black text-emerald-700">
                    {lowFindings}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 print:grid-cols-3">
                <div className="print-card rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">
                    {t('checklistQuestionCount')}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {totalQuestions}
                  </p>
                </div>

                <div className="print-card rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">
                    {t('problemAnswers')}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {negativeAnswers}
                  </p>
                </div>

                <div className="print-card rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">{t('points')}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {earnedScore} / {possibleScore}
                  </p>
                </div>
              </div>
            </section>

            {plan.notes && (
              <section className="print-card rounded-2xl border border-slate-200 p-5">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {t('generalNotes')}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {plan.notes}
                </p>
              </section>
            )}

            <section className="report-page-break-before">
              <div className="mb-4">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {t('checklistAnswers')}
                </h2>
                <p className="text-sm text-slate-500">
                  {t('checklistAnswersDescription')}
                </p>
              </div>

              <div className="overflow-visible rounded-2xl border border-slate-200">
                <div className="hidden bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 sm:grid sm:grid-cols-12 print:grid">
                  <div className="col-span-5">{t('question')}</div>
                  <div className="col-span-2">{t('answer')}</div>
                  <div className="col-span-2">{t('points')}</div>
                  <div className="col-span-3">{t('comment')}</div>
                </div>

                <div className="divide-y divide-slate-200">
                  {normalizedAnswers.map((answer: any, index: number) => {
                    const question = answer.template_questions
                    const section = question?.template_sections
                    const template = section?.audit_templates
                    const answerComments = commentsByAnswerId.get(answer.id) || []
                    const isHighlighted = answer.id === highlightedAnswerId

                    return (
                      <div
                        key={answer.id}
                        id={`answer-${answer.id}`}
                        className={`print-row scroll-mt-24 grid grid-cols-1 gap-3 p-4 transition sm:grid-cols-12 print:grid-cols-12 ${
                          isHighlighted
                            ? 'border-l-4 border-yellow-400 bg-yellow-50 ring-2 ring-yellow-200'
                            : ''
                        }`}
                      >
                        <div className="sm:col-span-5 print:col-span-5">
                          <p className="text-xs font-bold text-slate-400">
                            #{index + 1}
                            {template?.title ? ` • ${template.title}` : ''}
                            {section?.title ? ` • ${section.title}` : ''}
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {question?.question_text || t('questionFallback')}
                          </p>
                        </div>

                        <div className="sm:col-span-2 print:col-span-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${answerBadgeClass(
                              answer.response
                            )}`}
                          >
                            {answerLabel(answer.response)}
                          </span>
                        </div>

                        <div className="sm:col-span-2 print:col-span-2">
                          <p className="font-bold text-blue-700">
                            {answer.score ?? 0} / {question?.max_score ?? '-'}
                          </p>
                        </div>

                        <div className="sm:col-span-3 print:col-span-3">
                          <p className="whitespace-pre-wrap text-sm leading-5 text-slate-600">
                            {answer.comment || '-'}
                          </p>

                          <AuditQuestionModal
                            planId={id}
                            answerId={answer.id}
                            questionId={answer.question_id}
                            auditors={auditorOptions}
                          />

                          {answerComments.length > 0 && (
                            <div className="mt-3 space-y-2 print:hidden">
                              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                Müzakirələr: {answerComments.length}
                              </p>

                              {answerComments.slice(0, 5).map((comment: any) => (
                                <div
                                  key={comment.id}
                                  className={`rounded-xl border p-3 ${
                                    isHighlighted
                                      ? 'border-yellow-200 bg-white'
                                      : 'border-slate-200 bg-slate-50'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-black text-slate-700">
                                      {commentTypeLabel(comment.type)}
                                    </span>

                                    <span
                                      className={`rounded-full border px-2 py-0.5 text-[11px] font-black ${commentStatusClass(
                                        comment.status
                                      )}`}
                                    >
                                      {commentStatusLabel(comment.status)}
                                    </span>

                                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-black text-slate-600">
                                      {priorityLabel(comment.priority)}
                                    </span>
                                  </div>

                                  <p className="mt-2 text-xs font-bold text-slate-500">
                                    {comment.sender_name} •{' '}
                                    {formatDate(comment.created_at)}
                                  </p>

                                  <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700">
                                    {comment.message}
                                  </p>
                                </div>
                              ))}

                              {answerComments.length > 5 && (
                                <p className="text-xs font-bold text-blue-600">
                                  +{answerComments.length - 5} əlavə müzakirə
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            <section
              className={
                (findings || []).length > 0 ? 'report-page-break-before' : ''
              }
            >
              <div className="mb-4">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {t('findings')}
                </h2>
                <p className="text-sm text-slate-500">
                  {t('findingsDescription')}
                </p>
              </div>

              {(findings || []).length === 0 ? (
                <p className="rounded-xl border border-slate-200 p-4 text-slate-500">
                  {t('noFindings')}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {(findings || []).map((finding: any, index: number) => (
                    <div
                      key={finding.id}
                      className="print-card rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:flex-row">
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">
                            {t('findingNumber', {number: index + 1})}
                          </p>
                          <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                            {finding.title}
                          </h3>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase ${riskBadgeClass(
                            finding.severity
                          )}`}
                        >
                          {finding.severity || 'low'}
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {finding.description || '-'}
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-4 print:grid-cols-4">
                        <div>
                          <p className="text-xs uppercase text-slate-500">
                            {t('status')}
                          </p>
                          <p className="font-bold text-slate-900">
                            {statusLabel(finding.status)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase text-slate-500">
                            {t('deadline')}
                          </p>
                          <p className="font-bold text-slate-900">
                            {formatDate(finding.deadline)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase text-slate-500">
                            {t('risk')}
                          </p>
                          <p className="font-bold text-slate-900">
                            {finding.severity || '-'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase text-slate-500">
                            {t('responsible')}
                          </p>
                          <p className="font-bold text-slate-900">
                            {finding.profiles?.full_name || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section
              className={`grid grid-cols-1 gap-6 border-t border-slate-200 pt-8 sm:grid-cols-2 print:grid-cols-2 ${
                (findings || []).length > 0 ? 'report-page-break-before' : ''
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t('auditorSignature')}
                </p>
                <div className="mt-16 border-t border-slate-300 pt-2 text-xs text-slate-500">
                  {t('nameSurnameSignature')}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t('managerApproval')}
                </p>
                <div className="mt-16 border-t border-slate-300 pt-2 text-xs text-slate-500">
                  {t('nameSurnameSignature')}
                </div>
              </div>
            </section>

            <footer className="border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
              {t('footer')}
            </footer>
          </div>
        </article>
      </main>
    </div>
  )
}
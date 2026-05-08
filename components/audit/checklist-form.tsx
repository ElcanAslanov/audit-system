'use client'

import { useEffect, useMemo, useState } from 'react'
import { useActionState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  addCustomQuestion,
  saveAuditAnswers,
} from '@/app/[locale]/dashboard/plans/actions'
import AddFindingForm from '@/components/add-finding-form'
import CompleteAuditButton from '@/components/audit/complete-audit-button'
import FindingDeleteButton from '@/components/audit/finding-delete-button'
import FindingFileDeleteButton from '@/components/audit/finding-file-delete-button'
import { createClient } from '@/lib/supabase/client'

interface Question {
  id: string
  question_text: string
  max_score?: number | null
  is_custom?: boolean
  created_by?: string | null
  created_by_name?: string | null
  template_sections?: {
    id?: string
    title?: string
    sort_order?: number | null
    audit_templates?: {
      id?: string
      title?: string
    } | null
  } | null
}

interface Answer {
  question_id?: string | null
  custom_question_id?: string | null
  response?: string | null
  comment?: string | null
  score?: number | null
}

interface Finding {
  id: string
  plan_id?: string | null
  question_id?: string | null
  title?: string | null
  severity?: string | null
  description?: string | null
  deadline?: string | null
  status?: string | null
  custom_question_id?: string | null
  assigned_to?: string | null
  files?: {
    name: string
    path: string
    size?: number
    type?: string
  }[] | null
  profiles?: {
    full_name?: string | null
  } | null
}

interface User {
  id: string
  full_name: string
}

interface ChecklistFormProps {
  questions: Question[]
  planId: string
  initialAnswers?: Answer[]
  initialFindings?: Finding[]
  users: User[]
}

function answerClass(value?: string | null) {
  if (value === 'yes') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (value === 'no') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'na') return 'border-slate-200 bg-slate-50 text-slate-600'
  return 'border-slate-200 bg-white text-slate-500'
}

function severityClass(value?: string | null) {
  if (value === 'high') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'medium') return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const raw = String(value)
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (match) {
    const [, year, month, day] = match
    return `${day}.${month}.${year}`
  }

  return raw
}

export default function ChecklistForm({
  questions,
  planId,
  initialAnswers = [],
  initialFindings = [],
  users,
}: ChecklistFormProps) {
  const t = useTranslations('checklistForm')
const locale = useLocale()

  const answerLabel = (value?: string | null) => {
    if (value === 'yes') return t('yes')
    if (value === 'no') return t('no')
    if (value === 'na') return t('na')
    return t('notSelected')
  }

  const severityLabel = (value?: string | null) => {
    if (value === 'high') return t('highRisk')
    if (value === 'medium') return t('mediumRisk')
    if (value === 'low') return t('lowRisk')
    return value || '-'
  }

  const findingStatusLabel = (value?: string | null) => {
    if (value === 'aciq') return t('findingStatusOpen')
    if (value === 'icrada') return t('findingStatusInProgress')
    if (value === 'hell_olundu') return t('findingStatusResolved')
    return value || '-'
  }

  const [state, action, pending] = useActionState(saveAuditAnswers, null)
  const [customQuestionState, customQuestionAction, customQuestionPending] =
    useActionState(addCustomQuestion, null)

  const [showCustomQuestionForm, setShowCustomQuestionForm] = useState(false)
  const [activeFinding, setActiveFinding] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const [openFindingIds, setOpenFindingIds] = useState<Record<string, boolean>>({})
  const [deletedFindingIds, setDeletedFindingIds] = useState<string[]>([])
  const [localFindings, setLocalFindings] = useState<Finding[]>(initialFindings)

  useEffect(() => {
    setLocalFindings(
      initialFindings.filter(
        (finding) => !deletedFindingIds.includes(finding.id)
      )
    )
  }, [initialFindings, deletedFindingIds])

  const answerMap = useMemo(() => {
    return new Map(
      initialAnswers.map((answer) => [
        answer.custom_question_id || answer.question_id || '',
        answer,
      ])
    )
  }, [initialAnswers])

  const findingsByQuestion = useMemo(() => {
    const map = new Map<string, Finding[]>()

    localFindings.forEach((finding) => {
      const findingQuestionKey = finding.custom_question_id || finding.question_id

      if (!findingQuestionKey) return

      const current = map.get(findingQuestionKey) || []
      current.push(finding)
      map.set(findingQuestionKey, current)
    })

    return map
  }, [localFindings])

  const toggleFinding = (findingId: string) => {
    setOpenFindingIds((prev) => ({
      ...prev,
      [findingId]: !prev[findingId],
    }))
  }

  const canPreviewInBrowser = (fileType?: string | null, fileName?: string | null) => {
    const type = fileType || ''
    const name = (fileName || '').toLowerCase()

    return (
      type.startsWith('image/') ||
      type === 'application/pdf' ||
      name.endsWith('.pdf') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.webp') ||
      name.endsWith('.gif')
    )
  }

  const openFindingFile = async (
    filePath?: string | null,
    fileName?: string | null,
    fileType?: string | null
  ) => {
    if (!filePath) return

    if (!canPreviewInBrowser(fileType, fileName)) {
      await downloadFindingFile(filePath, fileName)
      return
    }

    const { data, error } = await supabase.storage
      .from('finding-files')
      .createSignedUrl(filePath, 60 * 5)

    if (error || !data?.signedUrl) {
      alert(error?.message || t('fileLinkError'))
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const downloadFindingFile = async (
    filePath?: string | null,
    fileName?: string | null
  ) => {
    if (!filePath) return

    const { data, error } = await supabase.storage
      .from('finding-files')
      .download(filePath)

    if (error || !data) {
      alert(error?.message || t('fileDownloadError'))
      return
    }

    const url = URL.createObjectURL(data)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName || t('fileFallback')
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}

    initialAnswers.forEach((answer) => {
      const answerKey = answer.custom_question_id || answer.question_id

      if (answerKey && answer.response) {
        initial[answerKey] = answer.response
      }
    })

    return initial
  })

  const liveAnsweredCount = questions.filter((question) => {
    return !!selectedAnswers[question.id]
  }).length

  const liveUnansweredCount = Math.max(questions.length - liveAnsweredCount, 0)

  const liveProgressPercent =
    questions.length > 0
      ? Math.round((liveAnsweredCount / questions.length) * 100)
      : 0

  const handleAnswerChange = (questionId: string, value: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))

    setHasUnsavedChanges(true)
  }

  const setAllAnswers = (value: 'yes' | 'na') => {
    const next: Record<string, string> = {}

    questions.forEach((question) => {
      next[question.id] = value
    })

    setSelectedAnswers(next)
    setHasUnsavedChanges(true)
  }

  const clearAllAnswers = () => {
    setSelectedAnswers({})
    setHasUnsavedChanges(true)
  }

  useEffect(() => {
    if (!state) return

    if (state.success) {
      setHasUnsavedChanges(false)
      setToast({
        type: 'success',
        message: t('answersSaved'),
      })
      return
    }

    if (state.error) {
      setToast({
        type: 'error',
        message: state.error,
      })
    }
  }, [state, t])

  useEffect(() => {
    if (!customQuestionState) return

    if (customQuestionState.success) {
      setToast({
        type: 'success',
        message: t('customQuestionAdded'),
      })

      window.setTimeout(() => {
        window.location.reload()
      }, 700)

      return
    }

    if (customQuestionState.error) {
      setToast({
        type: 'error',
        message: customQuestionState.error,
      })
    }
  }, [customQuestionState, t])

  useEffect(() => {
    if (!hasUnsavedChanges) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (!toast) return

    const timer = window.setTimeout(() => {
      setToast(null)
    }, 4500)

    return () => window.clearTimeout(timer)
  }, [toast])

  return (
    <>
      {toast && (
        <div className="fixed right-4 top-4 z-[9999] w-[calc(100%-2rem)] max-w-md">
          <div
            className={`rounded-2xl border p-4 shadow-2xl backdrop-blur ${toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
              : 'border-red-200 bg-red-50/95 text-red-800'
              }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black">
                  {toast.type === 'success' ? t('successTitle') : t('errorTitle')}
                </p>
                <p className="mt-1 text-sm leading-5">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-lg px-2 py-1 text-xs font-bold opacity-70 transition hover:bg-white/60 hover:opacity-100"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      <form action={action} className="space-y-5">
  <input type="hidden" name="locale" value={locale} />
  <input type="hidden" name="plan_id" value={planId} />

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">{t('fillStatus')}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {t('answeredProgress', {
                  answered: liveAnsweredCount,
                  total: questions.length,
                })}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-72">
              <div className="rounded-xl bg-white p-2">
                <p className="font-bold text-slate-900">{questions.length}</p>
                <p className="text-slate-500">{t('total')}</p>
              </div>

              <div className="rounded-xl bg-white p-2">
                <p className="font-bold text-emerald-700">{liveAnsweredCount}</p>
                <p className="text-slate-500">{t('answered')}</p>
              </div>

              <div className="rounded-xl bg-white p-2">
                <p className="font-bold text-red-700">{liveUnansweredCount}</p>
                <p className="text-slate-500">{t('remaining')}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${liveProgressPercent}%` }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => setAllAnswers('yes')}
              className="inline-flex w-full justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
            >
              {t('setAllYes')}
            </button>

            <button
              type="button"
              onClick={() => setAllAnswers('na')}
              className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              {t('setAllNa')}
            </button>

            <button
              type="button"
              onClick={clearAllAnswers}
              className="inline-flex w-full justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto"
            >
              {t('clearSelections')}
            </button>

            <button
              type="button"
              onClick={() => setShowCustomQuestionForm(true)}
              className="inline-flex w-full justify-center rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 sm:w-auto"
            >
              {t('addCustomQuestion')}
            </button>
          </div>
        </div>

        {state?.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {t('answersSaved')}
          </div>
        )}

        {questions.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
            {t('noQuestions')}
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q: Question, index: number) => {
            const isCustomQuestion = Boolean(q.is_custom)
            const savedAnswer = answerMap.get(q.id)
            const questionFindings = findingsByQuestion.get(q.id) || []

            const answerName = isCustomQuestion
              ? `answer_custom_${q.id}`
              : `answer_${q.id}`

            const scoreName = isCustomQuestion
              ? `score_custom_${q.id}`
              : `score_${q.id}`

            const commentName = isCustomQuestion
              ? `comment_custom_${q.id}`
              : `comment_${q.id}`

            const templateTitle =
              q.template_sections?.audit_templates?.title || t('templateFallback')
            const sectionTitle = q.template_sections?.title || t('sectionFallback')

            const savedComment = savedAnswer?.comment || ''

            const currentValue = selectedAnswers[q.id] || ''

            const maxScore = Number(q.max_score || 10)
            const savedScore =
              savedAnswer?.score !== undefined && savedAnswer?.score !== null
                ? Number(savedAnswer.score)
                : ''

            return (
              <article
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 sm:p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      {t('questionNumber', { number: index + 1 })}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {t('template')}: {templateTitle}
                      </span>

                      <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        {t('section')}: {sectionTitle}
                      </span>
                    </div>

                    {isCustomQuestion && (
                      <p className="mt-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                        {t('addedByAuditor', {
                          name: q.created_by_name || t('auditorFallback'),
                        })}
                      </p>
                    )}

                    <h3 className="mt-1 text-base font-bold leading-6 text-slate-900 sm:text-lg">
                      {q.question_text}
                    </h3>

                    <p className="mt-2 text-xs text-slate-500">
                      {t('maxScore', { score: q.max_score ?? 10 })}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${answerClass(
                      currentValue
                    )}`}
                  >
                    {answerLabel(currentValue)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                    <input
                      type="radio"
                      name={answerName}
                      value="yes"
                      checked={currentValue === 'yes'}
                      onChange={() => handleAnswerChange(q.id, 'yes')}
                      className="h-4 w-4"
                    />
                    {t('yes')}
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700 transition hover:bg-red-100">
                    <input
                      type="radio"
                      name={answerName}
                      value="no"
                      checked={currentValue === 'no'}
                      onChange={() => {
                        handleAnswerChange(q.id, 'no')
                        setActiveFinding(q.id)
                      }}
                      className="h-4 w-4"
                    />
                    {t('yesProblem')}
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    <input
                      type="radio"
                      name={answerName}
                      value="na"
                      checked={currentValue === 'na'}
                      onChange={() => handleAnswerChange(q.id, 'na')}
                      className="h-4 w-4"
                    />
                    {t('na')}
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      {t('givenScore')}
                    </label>

                    <input
                      type="number"
                      name={scoreName}
                      min={0}
                      max={maxScore}
                      step="0.5"
                      defaultValue={savedScore}
                      onChange={() => setHasUnsavedChanges(true)}
                      placeholder={`0 - ${maxScore}`}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      {t('maximumScore', { score: maxScore })}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <p className="text-xs font-semibold uppercase text-blue-700">
                      {t('evaluation')}
                    </p>
                    <p className="mt-1 text-sm text-blue-700">
                      {t('evaluationDescription', { score: maxScore })}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    {t('comment')}
                  </label>

                  <textarea
                    name={commentName}
                    defaultValue={savedComment}
                    onChange={() => setHasUnsavedChanges(true)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder={t('commentPlaceholder')}
                  />
                </div>

                {questionFindings.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/40 p-3">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {t('questionFindings')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t('findingsAdded', {
                            count: questionFindings.length,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {questionFindings.map((finding) => {
                        const isOpen = Boolean(openFindingIds[finding.id])

                        return (
                          <div
                            key={finding.id}
                            className="rounded-xl border border-red-100 bg-white p-3"
                          >
                            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-bold text-slate-900">
                                  {finding.title || t('findingFallback')}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-xs font-bold ${severityClass(
                                      finding.severity
                                    )}`}
                                  >
                                    {severityLabel(finding.severity)}
                                  </span>

                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                                    {t('status')}: {findingStatusLabel(finding.status)}
                                  </span>

                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                                    {t('deadline')}: {formatDate(finding.deadline)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleFinding(finding.id)}
                                  className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                                >
                                  {isOpen ? t('close') : t('viewDetails')}
                                </button>

                                <FindingDeleteButton
                                  findingId={finding.id}
                                  planId={planId}
                                  onDeleted={() => {
                                    setDeletedFindingIds((prev) =>
                                      prev.includes(finding.id) ? prev : [...prev, finding.id]
                                    )

                                    setLocalFindings((prev) =>
                                      prev.filter((item) => item.id !== finding.id)
                                    )

                                    setOpenFindingIds((prev) => {
                                      const next = { ...prev }
                                      delete next[finding.id]
                                      return next
                                    })

                                    setToast({
                                      type: 'success',
                                      message: t('findingDeleted'),
                                    })
                                  }}
                                />
                              </div>
                            </div>

                            {isOpen && (
                              <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div>
                                    <p className="text-xs font-bold uppercase text-slate-400">
                                      {t('responsiblePerson')}
                                    </p>
                                    <p className="mt-1 font-semibold text-slate-700">
                                      {finding.profiles?.full_name || t('notAssigned')}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs font-bold uppercase text-slate-400">
                                      {t('status')}
                                    </p>
                                    <p className="mt-1 font-semibold text-slate-700">
                                      {findingStatusLabel(finding.status)}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-3">
                                  <p className="text-xs font-bold uppercase text-slate-400">
                                    {t('description')}
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-700">
                                    {finding.description || '-'}
                                  </p>
                                </div>

                                <div className="mt-3">
                                  <p className="text-xs font-bold uppercase text-slate-400">
                                    {t('files')}
                                  </p>

                                  {finding.files && finding.files.length > 0 ? (
                                    <div className="mt-2 space-y-2">
                                      {finding.files.map((file, fileIndex) => (
                                        <div
                                          key={`${file.path}-${fileIndex}`}
                                          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-800">
                                              {file.name || t('fileFallback')}
                                            </p>
                                          </div>

                                          <div className="flex flex-wrap gap-2">
                                            <button
                                              type="button"
                                              onClick={() => openFindingFile(file.path, file.name, file.type)}
                                              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                                            >
                                              {t('open')}
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => downloadFindingFile(file.path, file.name)}
                                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                            >
                                              {t('download')}
                                            </button>

                                            <FindingFileDeleteButton
                                              findingId={finding.id}
                                              planId={planId}
                                              filePath={file.path}
                                              fileName={file.name}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-1 text-sm text-slate-500">
                                      {t('noFile')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveFinding(
                        isCustomQuestion ? `custom:${q.id}` : `template:${q.id}`
                      )
                    }
                    className="inline-flex w-full justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto"
                  >
                    {t('addFinding')}
                  </button>

                  {savedAnswer?.score !== undefined && savedAnswer.score !== null && (
                    <p className="text-sm font-semibold text-blue-700">
                      {t('savedScore', { score: savedAnswer.score })}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:-mx-6 sm:flex sm:items-center sm:justify-between sm:gap-3">
          <p
            className={`mb-3 text-sm sm:mb-0 ${hasUnsavedChanges ? 'font-semibold text-orange-700' : 'text-slate-500'
              }`}
          >
            {hasUnsavedChanges ? t('unsavedChanges') : t('saveReminder')}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
            >
              {pending ? t('saving') : t('saveAnswers')}
            </button>

            <CompleteAuditButton
              planId={planId}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </div>
        </div>
      </form>

      {showCustomQuestionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <form action={customQuestionAction} className="space-y-5">
  <input type="hidden" name="locale" value={locale} />
  <input type="hidden" name="plan_id" value={planId} />

              <div className="border-b pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {t('newCustomQuestion')}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {t('newCustomQuestionDescription')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCustomQuestionForm(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    {t('close')}
                  </button>
                </div>
              </div>

              {customQuestionState?.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {customQuestionState.error}
                </div>
              )}

              {customQuestionState?.success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {t('customQuestionAddedReloading')}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {t('questionText')}
                </label>

                <textarea
                  name="question_text"
                  required
                  rows={4}
                  disabled={customQuestionPending || customQuestionState?.success}
                  placeholder={t('questionTextPlaceholder')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {t('customMaxScore')}
                </label>

                <input
                  type="number"
                  name="max_score"
                  min={1}
                  step="0.5"
                  defaultValue={10}
                  disabled={customQuestionPending || customQuestionState?.success}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  {t('customQuestionHelp')}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCustomQuestionForm(false)}
                  disabled={customQuestionPending}
                  className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {t('close')}
                </button>

                <button
                  type="submit"
                  disabled={customQuestionPending || customQuestionState?.success}
                  className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
                >
                  {customQuestionPending
                    ? t('adding')
                    : customQuestionState?.success
                      ? t('added')
                      : t('addQuestion')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <AddFindingForm
              planId={planId}
              questionId={activeFinding.replace('template:', '').replace('custom:', '')}
              questionType={activeFinding.startsWith('custom:') ? 'custom' : 'template'}
              users={users}
              onClose={() => setActiveFinding(null)}
            />
          </div>
        </div>
      )}
    </>
  )
}
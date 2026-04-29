'use client'

import { useMemo, useState, useTransition } from 'react'
import { updateTemplate } from '@/app/dashboard/admin/templates/actions'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type QuestionItem = {
  id: string
  question_text: string
  input_type?: string | null
  sort_order?: number | null
  max_score?: number | null
}

type SectionItem = {
  id: string
  title: string
  sort_order?: number | null
  questions: QuestionItem[]
}

type TemplateData = {
  id: string
  title: string
  sections: SectionItem[]
}

function makeTempId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function isTempId(id?: string | null) {
  return !!id && String(id).startsWith('new_')
}

export default function TemplateEditForm({
  template,
}: {
  template: TemplateData
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(template.title || '')
  const [sections, setSections] = useState<SectionItem[]>(template.sections || [])
  const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([])
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalQuestions = useMemo(() => {
    return sections.reduce(
      (sum, section) => sum + (section.questions?.length || 0),
      0
    )
  }, [sections])

  const addSection = () => {
    setError(null)

    setSections((prev) => [
      ...prev,
      {
        id: makeTempId('new_section'),
        title: '',
        sort_order: prev.length,
        questions: [
          {
            id: makeTempId('new_question'),
            question_text: '',
            input_type: 'yes_no',
            sort_order: 0,
            max_score: 10,
          },
        ],
      },
    ])
  }

  const removeSection = (sectionIndex: number) => {
    setError(null)

    if (sections.length === 1) {
      setError('Ən azı 1 bölmə qalmalıdır.')
      return
    }

    const section = sections[sectionIndex]

    const confirmed = window.confirm(
      'Bu bölməni silmək istədiyinizə əminsiniz? Bölməyə aid suallar da silinəcək.'
    )

    if (!confirmed) return

    if (section.id && !isTempId(section.id)) {
      setDeletedSectionIds((prev) => [...prev, section.id])
    }

    setSections((prev) => prev.filter((_, idx) => idx !== sectionIndex))
  }

  const addQuestion = (sectionIndex: number) => {
    setError(null)

    setSections((prev) => {
      const next = [...prev]
      const section = next[sectionIndex]
      const questions = section.questions || []

      next[sectionIndex] = {
        ...section,
        questions: [
          ...questions,
          {
            id: makeTempId('new_question'),
            question_text: '',
            input_type: 'yes_no',
            sort_order: questions.length,
            max_score: 10,
          },
        ],
      }

      return next
    })
  }

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    setError(null)

    const section = sections[sectionIndex]
    const questions = section.questions || []

    if (questions.length === 1) {
      setError('Hər bölmədə ən azı 1 sual qalmalıdır.')
      return
    }

    const question = questions[questionIndex]

    const confirmed = window.confirm(
      'Bu sualı silmək istədiyinizə əminsiniz?'
    )

    if (!confirmed) return

    if (question.id && !isTempId(question.id)) {
      setDeletedQuestionIds((prev) => [...prev, question.id])
    }

    setSections((prev) => {
      const next = [...prev]
      next[sectionIndex] = {
        ...next[sectionIndex],
        questions: next[sectionIndex].questions.filter(
          (_, idx) => idx !== questionIndex
        ),
      }

      return next
    })
  }

  const updateSection = (
    sectionIndex: number,
    field: keyof SectionItem,
    value: string | number
  ) => {
    setSections((prev) => {
      const next = [...prev]
      next[sectionIndex] = {
        ...next[sectionIndex],
        [field]: value,
      }
      return next
    })
  }

  const updateQuestion = (
    sectionIndex: number,
    questionIndex: number,
    field: keyof QuestionItem,
    value: string | number
  ) => {
    setSections((prev) => {
      const next = [...prev]
      const questions = [...next[sectionIndex].questions]

      questions[questionIndex] = {
        ...questions[questionIndex],
        [field]: value,
      }

      next[sectionIndex] = {
        ...next[sectionIndex],
        questions,
      }

      return next
    })
  }

  const validate = () => {
    if (!title.trim()) {
      return 'Şablon adı boş ola bilməz.'
    }

    for (const section of sections) {
      if (!section.title.trim()) {
        return 'Bölmə adı boş ola bilməz.'
      }

      for (const question of section.questions || []) {
        if (!question.question_text.trim()) {
          return 'Sual mətni boş ola bilməz.'
        }
      }
    }

    return null
  }

  const handleSave = () => {
    setMessage(null)
    setError(null)

    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    const preparedSections = sections.map((section, sectionIndex) => ({
      ...section,
      sort_order: sectionIndex,
      questions: (section.questions || []).map((question, questionIndex) => ({
        ...question,
        sort_order: questionIndex,
      })),
    }))

    const formData = new FormData()
    formData.append('template_id', template.id)
    formData.append('title', title)
    formData.append('sections', JSON.stringify(preparedSections))
    formData.append('deleted_section_ids', JSON.stringify(deletedSectionIds))
    formData.append('deleted_question_ids', JSON.stringify(deletedQuestionIds))

    startTransition(async () => {
      const result = await updateTemplate(null, formData)

      if (!result.success) {
        setError(result.error || 'Şablon yenilənmədi.')
        return
      }

      setMessage('Şablon uğurla yeniləndi.')
      setDeletedSectionIds([])
      setDeletedQuestionIds([])
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Şablon adı
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:col-span-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase text-slate-500">
                Bölmə
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {sections.length}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-medium uppercase text-blue-700">
                Sual
              </p>
              <p className="mt-1 text-2xl font-black text-blue-700">
                {totalQuestions}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        {sections.map((section, sectionIndex) => (
          <section
            key={section.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Bölmə #{sectionIndex + 1}
                </label>

                <input
                  value={section.title || ''}
                  onChange={(e) =>
                    updateSection(sectionIndex, 'title', e.target.value)
                  }
                  placeholder="Bölmə adı"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => addQuestion(sectionIndex)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 sm:w-auto"
                >
                  <Plus size={16} />
                  Sual əlavə et
                </button>

                <button
                  type="button"
                  onClick={() => removeSection(sectionIndex)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto"
                >
                  <Trash2 size={16} />
                  Bölməni sil
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {(section.questions || []).map((question, questionIndex) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                        Sual #{questionIndex + 1}
                      </label>

                      <input
                        value={question.question_text || ''}
                        onChange={(e) =>
                          updateQuestion(
                            sectionIndex,
                            questionIndex,
                            'question_text',
                            e.target.value
                          )
                        }
                        placeholder="Sual mətni"
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="lg:col-span-3">
                      <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                        Cavab tipi
                      </label>

                      <select
                        value={question.input_type || 'yes_no'}
                        onChange={(e) =>
                          updateQuestion(
                            sectionIndex,
                            questionIndex,
                            'input_type',
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="yes_no">Yes / No / N/A</option>
                        <option value="score">Score</option>
                        <option value="text">Text</option>
                      </select>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                        Max score
                      </label>

                      <input
                        type="number"
                        min={1}
                        value={question.max_score ?? 10}
                        onChange={(e) =>
                          updateQuestion(
                            sectionIndex,
                            questionIndex,
                            'max_score',
                            Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-end lg:col-span-2">
                      <button
                        type="button"
                        onClick={() =>
                          removeQuestion(sectionIndex, questionIndex)
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={addSection}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          <Plus size={16} />
          Bölmə əlavə et
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300 sm:w-auto"
        >
          {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isPending ? 'Yadda saxlanılır...' : 'Dəyişiklikləri Yadda Saxla'}
        </button>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { createTemplate } from '@/app/dashboard/admin/templates/actions'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'

type QuestionItem = {
  text: string
  type: string
  weight: number
  max_score: number
}

type SectionItem = {
  title: string
  questions: QuestionItem[]
}

export default function TemplateBuilder() {
  const [sections, setSections] = useState<SectionItem[]>([
    {
      title: '',
      questions: [{ text: '', type: 'yes_no', weight: 1, max_score: 10 }],
    },
  ])

  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: '',
        questions: [{ text: '', type: 'yes_no', weight: 1, max_score: 10 }],
      },
    ])
  }

  const removeSection = (sectionIndex: number) => {
    if (sections.length === 1) {
      setError('Ən azı 1 bölmə qalmalıdır.')
      return
    }

    setSections(sections.filter((_, idx) => idx !== sectionIndex))
  }

  const updateSectionTitle = (sectionIndex: number, title: string) => {
    const next = [...sections]
    next[sectionIndex].title = title
    setSections(next)
  }

  const addQuestion = (sectionIndex: number) => {
    const next = [...sections]
    next[sectionIndex].questions.push({
      text: '',
      type: 'yes_no',
      weight: 1,
      max_score: 10,
    })
    setSections(next)
  }

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    const next = [...sections]

    if (next[sectionIndex].questions.length === 1) {
      setError('Hər bölmədə ən azı 1 sual qalmalıdır.')
      return
    }

    next[sectionIndex].questions = next[sectionIndex].questions.filter(
      (_, idx) => idx !== questionIndex
    )
    setSections(next)
  }

  const updateQuestion = (
    sectionIndex: number,
    questionIndex: number,
    field: keyof QuestionItem,
    value: string | number
  ) => {
    const next = [...sections]
    next[sectionIndex].questions[questionIndex] = {
      ...next[sectionIndex].questions[questionIndex],
      [field]: value,
    }
    setSections(next)
  }

  const resetForm = () => {
    setSections([
      {
        title: '',
        questions: [{ text: '', type: 'yes_no', weight: 1, max_score: 10 }],
      },
    ])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setMessage(null)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('sections', JSON.stringify(sections))

    const res = await createTemplate(null, formData)

    setPending(false)

    if (res.success) {
      setMessage('Şablon uğurla yaradıldı.')
      resetForm()
      return
    }

    setError(res.error || 'Şablon yaradılarkən xəta baş verdi.')
  }

  const totalQuestions = sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Şablon adı
          </label>
          <input
            name="title"
            placeholder="Məs: Maliyyə Audit Şablonu"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
            required
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

      <div className="space-y-5">
        {sections.map((section, sectionIndex) => (
          <section
            key={sectionIndex}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Bölmə #{sectionIndex + 1}
                </label>
                <input
                  placeholder="Bölmə adı"
                  value={section.title}
                  onChange={(e) =>
                    updateSectionTitle(sectionIndex, e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => removeSection(sectionIndex)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto"
              >
                <Trash2 size={16} />
                Bölməni sil
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {section.questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                        Sual #{questionIndex + 1}
                      </label>
                      <input
                        placeholder="Sual mətni"
                        value={question.text}
                        onChange={(e) =>
                          updateQuestion(
                            sectionIndex,
                            questionIndex,
                            'text',
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="lg:col-span-3">
                      <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                        Cavab tipi
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) =>
                          updateQuestion(
                            sectionIndex,
                            questionIndex,
                            'type',
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

                    <div className="grid grid-cols-2 gap-3 lg:col-span-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                          Weight
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={question.weight}
                          onChange={(e) =>
                            updateQuestion(
                              sectionIndex,
                              questionIndex,
                              'weight',
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                          Max
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={question.max_score}
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
                    </div>

                    <div className="flex items-end lg:col-span-1">
                      <button
                        type="button"
                        onClick={() =>
                          removeQuestion(sectionIndex, questionIndex)
                        }
                        className="inline-flex w-full justify-center rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        title="Sualı sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addQuestion(sectionIndex)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 sm:w-auto"
            >
              <Plus size={16} />
              Sual əlavə et
            </button>
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
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300 sm:w-auto"
        >
          {pending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {pending ? 'Yadda saxlanılır...' : 'Şablonu Yadda Saxla'}
        </button>
      </div>
    </form>
  )
}
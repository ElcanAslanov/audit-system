'use client'

import { useRef, useState } from 'react'
import { createTemplate } from '@/app/dashboard/admin/templates/actions'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'

type QuestionItem = {
  text: string
  type: string
  max_score: number
}

type SectionItem = {
  title: string
  questions: QuestionItem[]
}

export default function TemplateBuilder() {
  const formRef = useRef<HTMLFormElement | null>(null)

  const [sections, setSections] = useState<SectionItem[]>([
    {
      title: '',
      questions: [{ text: '', type: 'yes_no', max_score: 10 }],
    },
  ])

  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addSection = () => {
    setError(null)
    setSections([
      ...sections,
      {
        title: '',
        questions: [{ text: '', type: 'yes_no', max_score: 10 }],
      },
    ])
  }

  const removeSection = (sectionIndex: number) => {
    setError(null)

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
    setError(null)

    const next = [...sections]
    next[sectionIndex].questions.push({
      text: '',
      type: 'yes_no',
      max_score: 10,
    })
    setSections(next)
  }

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    setError(null)

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
  formRef.current?.reset()

  setSections([
    {
      title: '',
      questions: [{ text: '', type: 'yes_no', max_score: 10 }],
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
  <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <label className="mb-1 block text-sm font-bold text-slate-700">
            Şablon adı
          </label>
          <input
            name="title"
            placeholder="Məs: Maliyyə Audit Şablonu"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Bölmə</p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {sections.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Sual</p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {totalQuestions}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <section
            key={sectionIndex}
            className="rounded-3xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Bölmə #{sectionIndex + 1}
                </label>

                <input
                  placeholder="Bölmə adı"
                  value={section.title}
                  onChange={(e) =>
                    updateSectionTitle(sectionIndex, e.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => removeSection(sectionIndex)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 sm:w-auto"
              >
                <Trash2 size={16} />
                Bölməni sil
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {section.questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Sual #{questionIndex + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeQuestion(sectionIndex, questionIndex)}
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-2.5 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                      Sil
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                        Sual mətni
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
                        className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </div>

                    <div className="lg:col-span-3">
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
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
                        className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="yes_no">Bəli / Xeyr / N/A</option>
                        <option value="score">Score</option>
                        <option value="text">Text</option>
                      </select>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                        Max bal
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
                        className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addQuestion(sectionIndex)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-600 transition hover:bg-blue-50 sm:w-auto"
            >
              <Plus size={16} />
              Sual əlavə et
            </button>
          </section>
        ))}
      </div>

      <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-3 border-t border-slate-100 bg-white/95 p-4 backdrop-blur sm:-mx-5 sm:-mb-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={addSection}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          <Plus size={16} />
          Bölmə əlavə et
        </button>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 sm:w-auto"
        >
          {pending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {pending ? 'Yadda saxlanılır...' : 'Şablonu yadda saxla'}
        </button>
      </div>
    </form>
  )
}
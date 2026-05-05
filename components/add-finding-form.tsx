'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addFinding, ActionState } from '@/app/dashboard/plans/actions'


function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function displayDateToIso(value: string) {
  const [day, month, year] = value.split('/')

  if (!day || !month || !year || year.length !== 4) return ''

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export default function AddFindingForm({
  planId,
  questionId,
  questionType = 'template',
  users,
  onClose,
}: {
  planId: string
  questionId: string
  questionType?: 'template' | 'custom'
  users: any[]
  onClose: () => void
}) {
  const router = useRouter()
  const initialState: ActionState = { error: null, success: false }
  const [state, formAction, pending] = useActionState(addFinding, initialState)

  const [deadlineDisplay, setDeadlineDisplay] = useState('')

  useEffect(() => {
    if (!state.success) return

    const timer = window.setTimeout(() => {
      onClose()
      router.refresh()
    }, 900)

    return () => window.clearTimeout(timer)
  }, [state.success, onClose, router])

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="question_id" value={questionId} />
      <input type="hidden" name="question_type" value={questionType} />

      <div className="border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Yeni Çatışmazlıq
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Problemli cavab üçün risk, təsvir və cavabdeh şəxs əlavə edin.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Bağla
          </button>
        </div>
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Çatışmazlıq uğurla əlavə edildi. Pəncərə bağlanır...
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Problem başlığı
          </label>
          <input
            name="title"
            required
            disabled={pending || state.success}
            placeholder="Məs: Sənədləşmə natamamdır"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Risk səviyyəsi
          </label>
          <select
            name="severity"
            disabled={pending || state.success}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Deadline
          </label>

          <input
            type="hidden"
            name="deadline"
            value={displayDateToIso(deadlineDisplay)}
          />

          <input
            type="text"
            inputMode="numeric"
            value={deadlineDisplay}
            onChange={(e) => setDeadlineDisplay(formatDateInput(e.target.value))}
            maxLength={10}
            placeholder="GG/AA/İİİİ"
            disabled={pending || state.success}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <p className="mt-1 text-xs text-slate-500">
            Məsələn: 31/12/2026
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Cavabdeh şəxs <span className="text-slate-400">(istəyə bağlı)</span>
          </label>
          <select
            name="assigned_to"
            disabled={pending || state.success}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">Seçilməyib</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>

          <p className="mt-1 text-xs text-slate-500">
            Çatışmazlıqnın icrasına məsul şəxsi seçmək üçündür. Boş saxlaya bilərsiniz.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Təsvir
          </label>
          <textarea
            name="description"
            rows={4}
            disabled={pending || state.success}
            placeholder="Problemin detallı təsvirini yazın..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-semibold text-slate-700">
          Fayllar <span className="text-slate-400">(istəyə bağlı)</span>
        </label>

        <input
          type="file"
          name="files"
          multiple
          disabled={pending || state.success}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        <p className="mt-1 text-xs text-slate-500">
          Şəkil, PDF və ya sənəd əlavə edə bilərsiniz.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Bağla
        </button>

        <button
          type="submit"
          disabled={pending || state.success}
          className="inline-flex w-full justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto"
        >
          {pending ? 'Əlavə edilir...' : state.success ? 'Əlavə edildi' : 'Çatışmazlığı Əlavə Et'}
        </button>
      </div>
    </form>
  )
}
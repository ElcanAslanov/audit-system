'use client'

import { useActionState } from 'react'
import { addFinding, ActionState } from '@/app/dashboard/plans/actions'

export default function AddFindingForm({
  planId,
  questionId,
  users,
  onClose,
}: {
  planId: string
  questionId: string
  users: any[]
  onClose: () => void
}) {
  const initialState: ActionState = { error: null, success: false }
  const [state, formAction, pending] = useActionState(addFinding, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="question_id" value={questionId} />

      <div className="border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Yeni Tapıntı
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
          Tapıntı uğurla əlavə edildi.
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
            placeholder="Məs: Sənədləşmə natamamdır"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Risk səviyyəsi
          </label>
          <select
            name="severity"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
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
            type="date"
            name="deadline"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Cavabdeh şəxs
          </label>
          <select
            name="assigned_to"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Cavabdeh şəxs seçin...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Təsvir
          </label>
          <textarea
            name="description"
            rows={4}
            placeholder="Problemin detallı təsvirini yazın..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          Bağla
        </button>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto"
        >
          {pending ? 'Əlavə edilir...' : 'Tapıntını Əlavə Et'}
        </button>
      </div>
    </form>
  )
}
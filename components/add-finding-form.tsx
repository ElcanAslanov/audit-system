'use client'

import {useActionState, useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {useLocale, useTranslations} from 'next-intl'
import {addFinding, ActionState} from '@/app/[locale]/dashboard/plans/actions'

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
  const t = useTranslations('addFindingForm')
  const locale = useLocale()
  const router = useRouter()
  const initialState: ActionState = {error: null, success: false}
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
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="question_id" value={questionId} />
      <input type="hidden" name="question_type" value={questionType} />

      <div className="border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {t('title')}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {t('close')}
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
          {t('success')}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            {t('problemTitle')}
          </label>
          <input
            name="title"
            required
            disabled={pending || state.success}
            placeholder={t('problemTitlePlaceholder')}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            {t('severity')}
          </label>
          <select
            name="severity"
            disabled={pending || state.success}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="low">{t('lowRisk')}</option>
            <option value="medium">{t('mediumRisk')}</option>
            <option value="high">{t('highRisk')}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            {t('deadline')}
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
            onChange={(event) =>
              setDeadlineDisplay(formatDateInput(event.target.value))
            }
            maxLength={10}
            placeholder={t('datePlaceholder')}
            disabled={pending || state.success}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <p className="mt-1 text-xs text-slate-500">{t('dateExample')}</p>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            {t('responsiblePerson')}{' '}
            <span className="text-slate-400">({t('optional')})</span>
          </label>
          <select
            name="assigned_to"
            disabled={pending || state.success}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">{t('notSelected')}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>

          <p className="mt-1 text-xs text-slate-500">{t('responsibleHelp')}</p>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            {t('description')}
          </label>
          <textarea
            name="description"
            rows={4}
            disabled={pending || state.success}
            placeholder={t('descriptionPlaceholder')}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-semibold text-slate-700">
          {t('files')}{' '}
          <span className="text-slate-400">({t('optional')})</span>
        </label>

        <input
          type="file"
          name="files"
          multiple
          disabled={pending || state.success}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        <p className="mt-1 text-xs text-slate-500">{t('filesHelp')}</p>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {t('close')}
        </button>

        <button
          type="submit"
          disabled={pending || state.success}
          className="inline-flex w-full justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto"
        >
          {pending ? t('adding') : state.success ? t('added') : t('submit')}
        </button>
      </div>
    </form>
  )
}
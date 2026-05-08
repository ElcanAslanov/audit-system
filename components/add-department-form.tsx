'use client'

import {useActionState, useEffect, useRef} from 'react'
import {useRouter} from 'next/navigation'
import {createDepartment} from '@/app/[locale]/dashboard/departments/actions'
import {Loader2, Plus} from 'lucide-react'
import {useLocale, useTranslations} from 'next-intl'

export default function AddDepartmentForm({
  companies,
  onSuccess,
}: {
  companies: any[]
  onSuccess?: () => void
}) {
  const t = useTranslations('addDepartment')
  const locale = useLocale()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [state, action, pending] = useActionState(createDepartment, null)

  useEffect(() => {
    if (!state?.success) return

    formRef.current?.reset()
    router.refresh()
    onSuccess?.()
  }, [state?.success, router, onSuccess])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      {state?.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {t('success')}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-bold text-slate-700">
          {t('company')}
        </label>
        <select
          name="company_id"
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
        >
          <option value="">{t('selectCompany')}</option>
          {companies.map((company: any) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-bold text-slate-700">
          {t('departmentName')}
        </label>
        <input
          name="name"
          required
          placeholder={t('departmentPlaceholder')}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex justify-end">
        <button
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {pending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Plus size={18} />
          )}
          {pending ? t('adding') : t('submit')}
        </button>
      </div>
    </form>
  )
}
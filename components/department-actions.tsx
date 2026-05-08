'use client'

import {useState, useTransition} from 'react'
import {useRouter} from 'next/navigation'
import {
  deleteDepartment,
  updateDepartment,
} from '@/app/[locale]/dashboard/departments/actions'
import {AlertTriangle, Loader2, Pencil, Trash2, X} from 'lucide-react'
import {useLocale, useTranslations} from 'next-intl'

export default function DepartmentActions({
  department,
  companies,
}: {
  department: {
    id: string
    name: string
    company_id: string
  }
  companies: any[]
}) {
  const t = useTranslations('departmentActions')
  const locale = useLocale()
  const router = useRouter()

  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState(department.name || '')
  const [companyId, setCompanyId] = useState(department.company_id || '')
  const [error, setError] = useState<string | null>(null)

  const closeEditModal = () => {
    if (isPending) return
    setEditOpen(false)
    setError(null)
  }

  const closeDeleteModal = () => {
    if (isPending) return
    setDeleteOpen(false)
    setError(null)
  }

  const handleUpdate = () => {
    setError(null)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('company_id', companyId)
    formData.set('locale', locale)

    startTransition(async () => {
      const result = await updateDepartment(department.id, formData)

      if (result?.error) {
        setError(result.error)
        return
      }

      setEditOpen(false)
      router.refresh()
    })
  }

  const handleDelete = () => {
    setError(null)

    startTransition(async () => {
      const result = await deleteDepartment(department.id, locale)

      if (result?.error) {
        setError(result.error)
        return
      }

      setDeleteOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setName(department.name || '')
            setCompanyId(department.company_id || '')
            setError(null)
            setEditOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <Pencil size={15} />
          {t('edit')}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null)
            setDeleteOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && deleteOpen ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
          {t('delete')}
        </button>
      </div>

      {error && !editOpen && !deleteOpen && (
        <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
          {error}
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('closeModal')}
            onClick={closeEditModal}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {t('label')}
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {t('title')}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                aria-label={t('closeModal')}
                title={t('closeModal')}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  {t('company')}
                </label>
                <select
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
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
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder={t('departmentPlaceholder')}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isPending}
                className="inline-flex justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('close')}
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleUpdate}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={closeDeleteModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-red-500">
                    {t('delete')}
                  </p>

                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    {t('deleteConfirm', {name: department.name})}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {t('deleteModalDescription')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isPending}
                aria-label={t('closeModal')}
                title={t('closeModal')}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={17} />
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 bg-slate-50 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isPending}
                className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('cancel')}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}

                {isPending ? t('deleting') : t('confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
'use client'

import {useEffect, useState, useTransition} from 'react'
import {updateUserProfile} from '@/app/[locale]/dashboard/admin/actions'
import {
  Building2,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import {useLocale, useTranslations} from 'next-intl'

export default function EditUserModal({
  user,
  companies,
  onClose,
}: {
  user: any
  companies: any[]
  onClose: () => void
}) {
  const t = useTranslations('editUser')
  const rolesT = useTranslations('roles')
  const locale = useLocale()

  const roleLabel = (role?: string | null) => {
    if (role === 'admin') return rolesT('admin')
    if (role === 'rehber') return rolesT('rehber')
    if (role === 'musahideci') return rolesT('musahideci')
    if (role === 'audit_muavini') return rolesT('audit_muavini')
    if (role === 'auditor') return rolesT('auditor')
    return role || '-'
  }

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    role: user.role || 'auditor',
    company_id: user.company_id || '',
    password: '',
  })

  useEffect(() => {
    setMounted(true)

    requestAnimationFrame(() => {
      setOpen(true)
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClose = () => {
    setOpen(false)

    window.setTimeout(() => {
      setMounted(false)
      onClose()
    }, 250)
  }

  const handleSave = () => {
    setError(null)

    if (!form.full_name.trim()) {
      setError(t('fullNameRequired'))
      return
    }

    if (!form.email.trim()) {
      setError(t('emailRequired'))
      return
    }

    startTransition(async () => {
      const result = await updateUserProfile(user.id, {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        company_id: form.company_id,
        password: form.password.trim(),
        locale,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      handleClose()
    })
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <button
        type="button"
        aria-label={t('closeModal')}
        onClick={handleClose}
        className={`absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-out ${
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-4 scale-95 opacity-0'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {t('label')}
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
              {form.full_name || t('fallbackTitle')}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {t('subtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label={t('closeModal')}
            title={t('closeModal')}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-slate-50 p-4 sm:p-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  {t('fullName')}
                </label>

                <div className="relative">
                  <User
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />
                  <input
                    value={form.full_name}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        full_name: event.target.value,
                      }))
                    }
                    placeholder={t('fullNamePlaceholder')}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  {t('email')}
                </label>

                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    placeholder="user@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  {t('newPassword')}
                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder={t('newPasswordPlaceholder')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  {t('passwordHelp')}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  {t('role')}
                </label>

                <div className="relative">
                  <ShieldCheck
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />

                  <select
                    value={form.role}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        role: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="auditor">{rolesT('auditor')}</option>
                    <option value="audit_muavini">
                      {rolesT('audit_muavini')}
                    </option>
                    <option value="musahideci">{rolesT('musahideci')}</option>
                    <option value="rehber">{rolesT('rehber')}</option>
                    <option value="admin">{rolesT('admin')}</option>
                  </select>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {t('currentRole', {role: roleLabel(user.role)})}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  {t('company')}
                </label>

                <div className="relative">
                  <Building2
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />

                  <select
                    value={form.company_id}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        company_id: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">{t('noCompany')}</option>
                    {companies.map((company: any) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('close')}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {isPending ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
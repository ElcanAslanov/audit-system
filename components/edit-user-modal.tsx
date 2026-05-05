'use client'

import { useEffect, useState, useTransition } from 'react'
import { updateUserProfile } from '@/app/dashboard/admin/actions'
import {
  Building2,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'

function roleLabel(role?: string | null) {
  if (role === 'admin') return 'Admin'
  if (role === 'rehber') return 'Rəhbər'
  if (role === 'musahideci') return 'Müşahidəçi'
  if (role === 'audit_muavini') return 'Audit müavini'
  if (role === 'auditor') return 'Auditor'
  return role || '-'
}

export default function EditUserModal({
  user,
  companies,
  onClose,
}: {
  user: any
  companies: any[]
  onClose: () => void
}) {
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
      setError('Ad soyad boş ola bilməz.')
      return
    }

    if (!form.email.trim()) {
      setError('Email boş ola bilməz.')
      return
    }

    startTransition(async () => {
      const result = await updateUserProfile(user.id, {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        company_id: form.company_id,
        password: form.password.trim(),
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
        aria-label="Modalı bağla"
        onClick={handleClose}
        className={`absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'
          }`}
      />

      <div
        className={`relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-out ${open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-4 scale-95 opacity-0'
          }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              İstifadəçi redaktəsi
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
              {form.full_name || 'İstifadəçi məlumatları'}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ad soyad, email, rol və şirkət məlumatlarını yeniləyin.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
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
                  Ad soyad
                </label>

                <div className="relative">
                  <User
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />
                  <input
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    placeholder="Məs: Elcan Cahan"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Email
                </label>

                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="user@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Yeni şifrə
                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Boş saxlanılsa şifrə dəyişməyəcək"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Şifrəni dəyişmək istəmirsinizsə, bu sahəni boş saxlayın.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Rol
                </label>

                <div className="relative">
                  <ShieldCheck
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />

                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="auditor">Auditor</option>
                    <option value="audit_muavini">Audit müavini</option>
                    <option value="musahideci">Müşahidəçi</option>
                    <option value="rehber">Rəhbər</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Hazırkı rol: {roleLabel(user.role)}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Şirkət
                </label>

                <div className="relative">
                  <Building2
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />

                  <select
                    value={form.company_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        company_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Şirkət seçilməyib</option>
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
                Bağla
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
                {isPending ? 'Yadda saxlanılır...' : 'Yadda saxla'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
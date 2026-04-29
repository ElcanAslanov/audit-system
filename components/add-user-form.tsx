'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createUser } from '@/app/dashboard/admin/actions'
import { Building2, Loader2, Mail, Plus, ShieldCheck, User } from 'lucide-react'

export default function AddUserForm({
  companies,
  onSuccess,
}: {
  companies: any[]
  onSuccess?: () => void
}) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [state, action, pending] = useActionState(createUser, null)

  useEffect(() => {
    if (!state?.success) return

    formRef.current?.reset()
    onSuccess?.()
  }, [state?.success, onSuccess])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          İstifadəçi uğurla yaradıldı.
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
              name="full_name"
              required
              placeholder="Məs: Elcan Cahan"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
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
              name="email"
              required
              placeholder="user@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-slate-700">
            Şifrə
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            placeholder="Minimum 6 simvol"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
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
              name="role"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Rol seçin...</option>
              <option value="admin">Admin</option>
              <option value="rehber">Rəhbər</option>
              {/* <option value="muavin">Müavin</option> */}
              <option value="audit_muavini">Audit müavini</option>
              <option value="auditor">Auditor</option>
            </select>
          </div>
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
              name="company_id"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
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

      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <button
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {pending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Plus size={18} />
          )}
          {pending ? 'Yaradılır...' : 'İstifadəçi yarat'}
        </button>
      </div>
    </form>
  )
}
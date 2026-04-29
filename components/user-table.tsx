'use client'

import { useMemo, useState } from 'react'
import { updateUserRole, deleteUser } from '@/app/dashboard/admin/actions'
import {
  Building2,
  Edit2,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react'
import EditUserModal from './edit-user-modal'

function roleLabel(role?: string | null) {
  if (role === 'admin') return 'Admin'
  if (role === 'rehber') return 'Rəhbər'
  if (role === 'muavin') return 'Müavin'
  if (role === 'audit_muavini') return 'Audit müavini'
  if (role === 'auditor') return 'Auditor'
  return role || '-'
}

function roleClass(role?: string | null) {
  if (role === 'admin') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (role === 'rehber') return 'border-purple-200 bg-purple-50 text-purple-700'
  if (role === 'muavin') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (role === 'audit_muavini') {
    return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

export default function UserTable({
  users,
  companies,
}: {
  users: any[]
  companies: any[]
}) {
  const [search, setSearch] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const companyMap = useMemo(() => {
    return new Map(companies.map((company: any) => [company.id, company.name]))
  }, [companies])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return users

    return users.filter((u) => {
      const fullName = String(u.full_name || '').toLowerCase()
      const role = String(u.role || '').toLowerCase()
      const companyName = String(companyMap.get(u.company_id) || '').toLowerCase()

      return (
        fullName.includes(term) ||
        role.includes(term) ||
        companyName.includes(term)
      )
    })
  }, [users, search, companyMap])

  const handleRoleChange = async (id: string, role: string) => {
    setError(null)
    setLoadingId(id)

    const result = await updateUserRole(id, role)

    if (result?.error) {
      setError(result.error)
    }

    setLoadingId(null)
  }

  const handleDelete = async (id: string, fullName?: string | null) => {
    setError(null)

    const confirmed = window.confirm(
      `"${fullName || 'Adsız istifadəçi'}" istifadəçisini silmək istədiyinizə əminsiniz?`
    )

    if (!confirmed) return

    setLoadingId(id)

    const result = await deleteUser(id)

    if (result?.error) {
      setError(result.error)
    }

    setLoadingId(null)
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            İstifadəçilər
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredUsers.length} istifadəçi göstərilir.
          </p>
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search
            className="absolute left-3 top-3.5 text-slate-400"
            size={18}
          />
          <input
            value={search}
            placeholder="Ad, rol və ya şirkət üzrə axtar..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
            <User size={22} />
          </div>
          <h3 className="mt-4 font-black text-slate-900">
            İstifadəçi tapılmadı
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Axtarış şərtinə uyğun istifadəçi yoxdur.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="p-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    İstifadəçi
                  </th>
                  <th className="p-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    Şirkət
                  </th>
                  <th className="p-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    Rol
                  </th>
                  <th className="p-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                    Əməliyyatlar
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((userItem) => {
                  const companyName =
                    companyMap.get(userItem.company_id) || 'Şirkət seçilməyib'

                  return (
                    <tr
                      key={userItem.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                            <User size={19} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-950">
                              {userItem.full_name || 'Adsız istifadəçi'}
                            </p>
                            
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Building2 size={16} className="text-slate-400" />
                          <span className="truncate">{companyName}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`w-fit rounded-full border px-2.5 py-1 text-xs font-black ${roleClass(
                              userItem.role
                            )}`}
                          >
                            {roleLabel(userItem.role)}
                          </span>

                          <select
                            disabled={loadingId === userItem.id}
                            defaultValue={userItem.role}
                            onChange={(e) =>
                              handleRoleChange(userItem.id, e.target.value)
                            }
                            className="w-full max-w-[190px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="auditor">Auditor</option>
                            <option value="audit_muavini">Audit müavini</option>
                            {/* <option value="muavin">Müavin</option> */}
                            <option value="rehber">Rəhbər</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingUser(userItem)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Edit2 size={16} />
                            Redaktə
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(userItem.id, userItem.full_name)
                            }
                            disabled={loadingId === userItem.id}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {loadingId === userItem.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredUsers.map((userItem) => {
              const companyName =
                companyMap.get(userItem.company_id) || 'Şirkət seçilməyib'

              return (
                <article
                  key={userItem.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="h-1.5 bg-gradient-to-r from-slate-900 via-blue-600 to-cyan-500" />

                  <div className="flex flex-col p-5">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                        <User size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-black text-slate-950">
                              {userItem.full_name || 'Adsız istifadəçi'}
                            </h3>

                            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                              <Building2 size={15} />
                              <span className="truncate">{companyName}</span>
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full border px-2.5 py-1 text-xs font-black ${roleClass(
                              userItem.role
                            )}`}
                          >
                            {roleLabel(userItem.role)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                        <ShieldCheck size={13} />
                        Rol
                      </p>

                      <select
                        disabled={loadingId === userItem.id}
                        defaultValue={userItem.role}
                        onChange={(e) =>
                          handleRoleChange(userItem.id, e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="auditor">Auditor</option>
                        <option value="audit_muavini">Audit müavini</option>
                        {/* <option value="muavin">Müavin</option> */}
                        <option value="rehber">Rəhbər</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUser(userItem)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Edit2 size={16} />
                        Redaktə
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(userItem.id, userItem.full_name)
                        }
                        disabled={loadingId === userItem.id}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loadingId === userItem.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Sil
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          companies={companies}
          onClose={() => setEditingUser(null)}
        />
      )}
    </section>
  )
}
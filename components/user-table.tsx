'use client'

import {useMemo, useState} from 'react'
import {updateUserRole, deleteUser} from '@/app/[locale]/dashboard/admin/actions'
import {
  AlertTriangle,
  Building2,
  Edit2,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react'
import EditUserModal from './edit-user-modal'
import {useLocale, useTranslations} from 'next-intl'

function roleClass(role?: string | null) {
  if (role === 'admin') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (role === 'rehber') return 'border-purple-200 bg-purple-50 text-purple-700'
  if (role === 'muavin') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (role === 'musahideci') return 'border-cyan-200 bg-cyan-50 text-cyan-700'
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
  const t = useTranslations('userTable')
  const rolesT = useTranslations('roles')
  const locale = useLocale()

  const roleLabel = (role?: string | null) => {
    if (role === 'admin') return rolesT('admin')
    if (role === 'rehber') return rolesT('rehber')
    if (role === 'audit_muavini') return rolesT('audit_muavini')
    if (role === 'auditor') return rolesT('auditor')
    if (role === 'musahideci') return rolesT('musahideci')
    return role || '-'
  }

  const [search, setSearch] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
const [editingUser, setEditingUser] = useState<any>(null)
const [deleteTarget, setDeleteTarget] = useState<any>(null)
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

    const result = await updateUserRole(id, role, locale)

    if (result?.error) {
      setError(result.error)
    }

    setLoadingId(null)
  }

 const openDeleteModal = (userItem: any) => {
  setError(null)
  setDeleteTarget(userItem)
}

const closeDeleteModal = () => {
  if (loadingId) return
  setDeleteTarget(null)
}

const handleDeleteConfirm = async () => {
  if (!deleteTarget?.id) return

  setError(null)
  setLoadingId(deleteTarget.id)

  const result = await deleteUser(deleteTarget.id, locale)

  if (result?.error) {
    setError(result.error)
    setLoadingId(null)
    return
  }

  setLoadingId(null)
  setDeleteTarget(null)
}

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('showing', {count: filteredUsers.length})}
          </p>
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search
            className="absolute left-3 top-3.5 text-slate-400"
            size={18}
          />
          <input
            value={search}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            onChange={(event) => setSearch(event.target.value)}
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
            {t('emptyTitle')}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t('emptyDescription')}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="p-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    {t('user')}
                  </th>
                  <th className="p-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    {t('company')}
                  </th>
                  <th className="p-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    {t('role')}
                  </th>
                  <th className="p-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                    {t('actions')}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((userItem) => {
                  const companyName =
                    companyMap.get(userItem.company_id) || t('noCompany')

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
                              {userItem.full_name || t('anonymousUser')}
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
                            onChange={(event) =>
                              handleRoleChange(userItem.id, event.target.value)
                            }
                            className="w-full max-w-[190px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="auditor">{rolesT('auditor')}</option>
                            <option value="audit_muavini">
                              {rolesT('audit_muavini')}
                            </option>
                            <option value="musahideci">
                              {rolesT('musahideci')}
                            </option>
                            <option value="rehber">{rolesT('rehber')}</option>
                            <option value="admin">{rolesT('admin')}</option>
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
                            {t('edit')}
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(userItem)}
                            disabled={loadingId === userItem.id}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {loadingId === userItem.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            {t('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredUsers.map((userItem) => {
              const companyName =
                companyMap.get(userItem.company_id) || t('noCompany')

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
                              {userItem.full_name || t('anonymousUser')}
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
                        {t('role')}
                      </p>

                      <select
                        disabled={loadingId === userItem.id}
                        defaultValue={userItem.role}
                        onChange={(event) =>
                          handleRoleChange(userItem.id, event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="auditor">{rolesT('auditor')}</option>
                        <option value="audit_muavini">
                          {rolesT('audit_muavini')}
                        </option>
                        <option value="musahideci">
                          {rolesT('musahideci')}
                        </option>
                        <option value="rehber">{rolesT('rehber')}</option>
                        <option value="admin">{rolesT('admin')}</option>
                      </select>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUser(userItem)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Edit2 size={16} />
                        {t('edit')}
                      </button>

                      <button
                        type="button"
                        onClick={() => openDeleteModal(userItem)}
                        disabled={loadingId === userItem.id}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loadingId === userItem.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      {deleteTarget && (
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
              {t('deleteConfirm', {
                name: deleteTarget.full_name || t('anonymousUser'),
              })}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {t('deleteModalDescription')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={closeDeleteModal}
          disabled={loadingId === deleteTarget.id}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={t('cancel')}
          title={t('cancel')}
        >
          <X size={17} />
        </button>
      </div>

      <div className="flex flex-col-reverse gap-2 bg-slate-50 p-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={closeDeleteModal}
          disabled={loadingId === deleteTarget.id}
          className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('cancel')}
        </button>

        <button
          type="button"
          onClick={handleDeleteConfirm}
          disabled={loadingId === deleteTarget.id}
          className="inline-flex justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
        >
          {loadingId === deleteTarget.id ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}

          {loadingId === deleteTarget.id ? t('deleting') : t('confirmDelete')}
        </button>
      </div>
    </div>
  </div>
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
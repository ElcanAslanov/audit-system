'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    Check,
    Eye,
    Loader2,
    Plus,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react'
import {
    addPlanViewer,
    removePlanViewer,
} from '@/app/dashboard/plans/actions'

type UserItem = {
    id: string
    full_name?: string | null
    email?: string | null
    role?: string | null
}

type ViewerItem = {
    id: string
    full_name: string
    email?: string | null
    role?: string | null
    type: string
}

type Props = {
    plan: any
    allUsers: UserItem[]
    currentUserId: string
    currentUserRole?: string
}

function normalizeProfile(value: any) {
    return Array.isArray(value) ? value[0] || null : value || null
}

function normalizeAssignments(plan: any): ViewerItem[] {
    return (plan.plan_assignments || [])
        .map((item: any) => {
            const profile = normalizeProfile(item.profiles)

            return profile?.full_name
                ? {
                    id: String(item.user_id || profile.id || profile.full_name),
                    full_name: profile.full_name,
                    email: profile.email || null,
                    role: profile.role || null,
                    type: 'Auditor',
                }
                : null
        })
        .filter(Boolean)
}

function normalizeViewers(plan: any): ViewerItem[] {
    return (plan.audit_plan_viewers || [])
        .map((item: any) => {
            const profile = normalizeProfile(item.profiles)

            return profile?.full_name
                ? {
                    id: String(item.user_id || profile.id || profile.full_name),
                    full_name: profile.full_name,
                    email: profile.email || null,
                    role: profile.role || null,
                    type: 'Əlavə baxış',
                }
                : null
        })
        .filter(Boolean)
}

function initials(name?: string | null, fallback?: string | null) {
    const text = String(name || fallback || '?').trim()
    const parts = text.split(/\s+/).filter(Boolean)

    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }

    return text.charAt(0).toUpperCase()
}

function roleLabel(role?: string | null) {
    if (role === 'admin') return 'Admin'
    if (role === 'auditor') return 'Auditor'
    if (role === 'audit_muavini') return 'Audit müavini'
    if (role === 'rehber') return 'Rəhbər'
    return role || 'İstifadəçi'
}

function PersonCard({
    user,
    tone = 'slate',
    removable = false,
    loading = false,
    onRemove,
}: {
    user: ViewerItem
    tone?: 'slate' | 'blue' | 'emerald'
    removable?: boolean
    loading?: boolean
    onRemove?: () => void
}) {
    const toneClass =
        tone === 'blue'
            ? 'from-blue-600 to-cyan-500'
            : tone === 'emerald'
                ? 'from-emerald-600 to-teal-500'
                : 'from-slate-700 to-slate-500'

    return (
        <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${toneClass} text-sm font-black text-white shadow-sm`}
            >
                {initials(user.full_name, user.email)}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-900">
                    {user.full_name || 'Adsız istifadəçi'}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                        {user.type}
                    </span>

                    {user.role && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                            {roleLabel(user.role)}
                        </span>
                    )}
                </div>
            </div>

            {removable && (
                <button
                    type="button"
                    disabled={loading}
                    onClick={onRemove}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 opacity-80 transition hover:bg-red-100 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="İcazəni sil"
                >
                    {loading ? (
                        <Loader2 size={15} className="animate-spin" />
                    ) : (
                        <Trash2 size={15} />
                    )}
                </button>
            )}
        </div>
    )
}

export default function PlanAccessButton({
    plan,
    allUsers,
    currentUserId,
    currentUserRole,
}: Props) {
    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [localExtraViewers, setLocalExtraViewers] = useState<ViewerItem[]>(() =>
        normalizeViewers(plan)
    )
    const [removingUserId, setRemovingUserId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [userSearch, setUserSearch] = useState('')
    const [message, setMessage] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        setLocalExtraViewers(normalizeViewers(plan))
    }, [plan])

    useEffect(() => {
        if (!open) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }

        document.addEventListener('keydown', onKeyDown)
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = ''
        }
    }, [open])

    const isAdmin = currentUserRole === 'admin'
    const isCreator = plan.created_by === currentUserId
    const canManage = isAdmin || isCreator

    const assignedUsers = useMemo(() => normalizeAssignments(plan), [plan])

    const selectedViewerIds = useMemo(() => {
        return new Set(localExtraViewers.map((item) => String(item.id)))
    }, [localExtraViewers])

    const assignedUserIds = useMemo(() => {
        return new Set(
            (plan.plan_assignments || []).map((item: any) => String(item.user_id))
        )
    }, [plan.plan_assignments])

    const availableUsers = useMemo(() => {
        return (allUsers || []).filter((user: any) => {
            const id = String(user.id)
            return !selectedViewerIds.has(id) && !assignedUserIds.has(id)
        })
    }, [allUsers, selectedViewerIds, assignedUserIds])

    const filteredAvailableUsers = useMemo(() => {
        const keyword = userSearch.trim().toLowerCase()

        if (!keyword) return availableUsers

        return availableUsers.filter((user: any) => {
            const text = `${user.full_name || ''} ${user.email || ''} ${user.role || ''
                }`.toLowerCase()

            return text.includes(keyword)
        })
    }, [availableUsers, userSearch])

    const selectedUsers = useMemo(() => {
        const selectedSet = new Set(selectedUserIds)

        return availableUsers.filter((user: any) =>
            selectedSet.has(String(user.id))
        )
    }, [availableUsers, selectedUserIds])

    const closeModal = () => {
        if (isAdding || removingUserId) return
        setOpen(false)
        setMessage(null)
        setSelectedUserIds([])
        setUserSearch('')
    }

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        )
    }

    const clearSelectedUsers = () => {
        setSelectedUserIds([])
    }

    const handleAddViewer = async () => {
        if (selectedUserIds.length === 0) {
            setMessage('Ən azı 1 istifadəçi seçilməlidir.')
            return
        }

        const usersToAdd = selectedUsers.map((user: any) => ({
            id: String(user.id),
            full_name: user.full_name || user.email || String(user.id),
            email: user.email || null,
            role: user.role || null,
            type: 'Əlavə baxış',
        }))

        setIsAdding(true)
        setMessage(null)

        for (const user of usersToAdd) {
            const result = await addPlanViewer(plan.id, user.id)

            if (result.error) {
                setMessage(result.error)
                setIsAdding(false)
                return
            }
        }

        setLocalExtraViewers((prev) => {
            const existing = new Set(prev.map((item) => item.id))
            const merged = [...prev]

            for (const user of usersToAdd) {
                if (!existing.has(user.id)) merged.push(user)
            }

            return merged
        })

        setSelectedUserIds([])
        setUserSearch('')
        setMessage(null)
        setIsAdding(false)
        setOpen(false)
    }

    const handleRemoveViewer = async (userId: string) => {
        setRemovingUserId(userId)
        setMessage(null)

        const result = await removePlanViewer(plan.id, userId)

        if (result.error) {
            setMessage(result.error)
            setRemovingUserId(null)
            return
        }

        setLocalExtraViewers((prev) =>
            prev.filter((viewer) => String(viewer.id) !== String(userId))
        )

        setSelectedUserIds((prev) =>
            prev.filter((id) => String(id) !== String(userId))
        )

        setRemovingUserId(null)
    }

    const modal =
        open && mounted
            ? createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
                    onClick={closeModal}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-5 sm:p-6">
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                    Plan baxış icazəsi
                                </p>

                                <h3 className="mt-1 text-xl font-black text-slate-950">
                                    Kimlər görə bilir?
                                </h3>

                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                    {plan.title}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isAdding || Boolean(removingUserId)}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="overflow-y-auto bg-slate-50 p-4 sm:p-6">
                            {message && (
                                <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
                                    {message}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                                        <Eye size={16} className="text-slate-500" />
                                        <div>
                                            <h4 className="font-black text-slate-900">
                                                Təyin olunan auditorlar
                                            </h4>
                                            <p className="text-xs font-semibold text-slate-400">
                                                Auditi doldura bilən istifadəçilər
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {assignedUsers.length === 0 && (
                                            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                                                Auditor təyin olunmayıb.
                                            </p>
                                        )}

                                        {assignedUsers.map((user: any) => (
                                            <PersonCard
                                                key={`${user.id}-${user.full_name}`}
                                                user={user}
                                                tone="blue"
                                            />
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                        <div>
                                            <h4 className="font-black text-slate-900">
                                                Əlavə baxış icazəsi
                                            </h4>
                                            <p className="text-xs font-semibold text-slate-400">
                                                Yalnız plana baxa bilən şəxslər
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                                            {localExtraViewers.length}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {localExtraViewers.length === 0 && (
                                            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                                                Əlavə baxış icazəsi verilməyib.
                                            </p>
                                        )}

                                        {localExtraViewers.map((user) => (
                                            <PersonCard
                                                key={`${user.id}-${user.full_name}`}
                                                user={user}
                                                tone="emerald"
                                                removable={canManage}
                                                loading={removingUserId === user.id}
                                                onRemove={() => handleRemoveViewer(user.id)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {canManage ? (
                                <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900">
                                                Əlavə baxış icazəsi ver
                                            </h4>
                                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                                                Axtarın, bir neçə istifadəçi seçin və icazəni bir
                                                kliklə əlavə edin.
                                            </p>
                                        </div>

                                        {selectedUserIds.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={clearSelectedUsers}
                                                disabled={isAdding}
                                                className="w-fit rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                Seçimi təmizlə
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                                        <div className="min-w-0">
                                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                                                <div className="relative">
                                                    <Search
                                                        size={16}
                                                        className="pointer-events-none absolute left-3 top-3 text-slate-400"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={userSearch}
                                                        onChange={(event) =>
                                                            setUserSearch(event.target.value)
                                                        }
                                                        disabled={isAdding}
                                                        placeholder="Ad, email və ya rol üzrə axtar..."
                                                        className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    />
                                                </div>

                                                {selectedUsers.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {selectedUsers.map((user: any) => (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleUserSelection(String(user.id))
                                                                }
                                                                disabled={isAdding}
                                                                className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                title="Seçimdən çıxar"
                                                            >
                                                                <span className="max-w-[180px] truncate">
                                                                    {user.full_name || user.email || user.id}
                                                                </span>
                                                                <X size={13} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
                                                    {availableUsers.length === 0 && (
                                                        <div className="rounded-2xl bg-slate-50 p-4 text-center">
                                                            <p className="text-sm font-bold text-slate-700">
                                                                Əlavə ediləcək istifadəçi yoxdur
                                                            </p>
                                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                                Təyin olunan auditorlar və artıq icazəsi olan
                                                                istifadəçilər siyahıdan çıxarılıb.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {availableUsers.length > 0 &&
                                                        filteredAvailableUsers.length === 0 && (
                                                            <div className="rounded-2xl bg-slate-50 p-4 text-center">
                                                                <p className="text-sm font-bold text-slate-700">
                                                                    Nəticə tapılmadı
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Axtarış sözünü dəyişib yenidən yoxlayın.
                                                                </p>
                                                            </div>
                                                        )}

                                                    {filteredAvailableUsers.map((user: any) => {
                                                        const userId = String(user.id)
                                                        const checked = selectedUserIds.includes(userId)
                                                        const initial = initials(
                                                            user.full_name,
                                                            user.email
                                                        )

                                                        return (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                onClick={() => toggleUserSelection(userId)}
                                                                disabled={isAdding}
                                                                className={`group flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${checked
                                                                        ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm'
                                                                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm'
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-black shadow-sm transition ${checked
                                                                            ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white'
                                                                            : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 group-hover:from-blue-100 group-hover:to-cyan-100 group-hover:text-blue-700'
                                                                        }`}
                                                                >
                                                                    {checked ? <Check size={17} /> : initial}

                                                                    <span
                                                                        className={`absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border text-[10px] transition ${checked
                                                                                ? 'border-white bg-blue-600 text-white'
                                                                                : 'border-white bg-white text-slate-300 group-hover:text-blue-500'
                                                                            }`}
                                                                    >
                                                                        {checked ? <Check size={11} /> : '+'}
                                                                    </span>
                                                                </span>

                                                                <span className="min-w-0 flex-1">
                                                                    <span className="block truncate text-sm font-black text-slate-950">
                                                                        {user.full_name || 'Adsız istifadəçi'}
                                                                    </span>

                                                                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                                                        {user.email && (
                                                                            <span className="max-w-[190px] truncate text-xs font-semibold text-slate-500">
                                                                                {user.email}
                                                                            </span>
                                                                        )}

                                                                        {user.role && (
                                                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-black text-slate-500">
                                                                                {roleLabel(user.role)}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </span>

                                                                <span
                                                                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${checked
                                                                            ? 'border-blue-600 bg-blue-600 text-white'
                                                                            : 'border-slate-300 bg-white text-transparent group-hover:border-blue-300 group-hover:text-blue-500'
                                                                        }`}
                                                                >
                                                                    <Check size={13} />
                                                                </span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>

                                                <p className="mt-2 text-xs font-semibold text-slate-500">
                                                    Seçilən: {selectedUserIds.length}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleAddViewer}
                                            disabled={isAdding || selectedUserIds.length === 0}
                                            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 lg:w-auto lg:self-end"
                                        >
                                            {isAdding ? (
                                                <Loader2
                                                    size={16}
                                                    className="shrink-0 animate-spin"
                                                />
                                            ) : (
                                                <Plus size={16} className="shrink-0" />
                                            )}

                                            <span>
                                                {isAdding
                                                    ? 'Əlavə edilir...'
                                                    : selectedUserIds.length > 0
                                                        ? `${selectedUserIds.length} nəfəri əlavə et`
                                                        : 'Əlavə et'}
                                            </span>
                                        </button>
                                    </div>
                                </section>
                            ) : (
                                <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                                    Baxış icazəsini yalnız admin və ya planı yaradan istifadəçi
                                    dəyişə bilər.
                                </p>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )
            : null

    return (
        <>
            <button
                type="button"
                onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setOpen(true)
                }}
                className="grid h-9 w-9 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                title="Planı kimlər görə bilir?"
            >
                <Users size={16} />
            </button>

            {modal}
        </>
    )
}
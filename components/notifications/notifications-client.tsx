'use client'

import {useMemo, useState, useTransition} from 'react'
import {Link, useRouter} from '@/i18n/routing'
import MarkNotificationReadButton from '@/components/notifications/mark-notification-read-button'
import {ChevronLeft, ChevronRight, Trash2} from 'lucide-react'

type NotificationRow = {
  id: string
  type: string
  title: string
  body: string | null
  related_table: string | null
  related_id: string | null
  related_plan_id: string | null
  is_read: boolean
  created_at: string
  plan_title: string
  plan_department: string | null
  question_text: string | null
  answer_response: string | null
  answer_score: number | null
  answer_comment: string | null
  comment_type: string | null
  report_href: string
}

type Props = {
  initialRows: NotificationRow[]
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
}

function formatDateBaku(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  const parts = new Intl.DateTimeFormat('az-AZ', {
    timeZone: 'Asia/Baku',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || ''

  return `${get('day')}.${get('month')}.${get('year')} ${get('hour')}:${get(
    'minute'
  )}`
}

function notificationTypeLabel(value?: string | null) {
  if (value === 'audit_comment') return 'Audit sualı/rəyi'
  if (value === 'audit_comment_reply') return 'Audit cavabı'
  return value || 'Bildiriş'
}

function commentTypeLabel(value?: string | null) {
  if (value === 'question') return 'Sual'
  if (value === 'comment') return 'Rəy'
  return '-'
}

function answerLabel(value?: string | null) {
  if (value === 'yes') return 'Bəli'
  if (value === 'no') return 'Xeyr'
  if (value === 'na') return 'N/A'
  return value || '-'
}

export default function NotificationsClient({
  initialRows,
  currentPage,
  totalPages,
  total,
  pageSize,
}: Props) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [compact, setCompact] = useState(true)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const unreadCount = useMemo(
    () => rows.filter((item) => !item.is_read).length,
    [rows]
  )

  const visibleRowIds = useMemo(() => rows.map((item) => item.id), [rows])

  const selectedCount = selectedIds.length
  const allVisibleSelected =
    rows.length > 0 && visibleRowIds.every((id) => selectedIds.includes(id))

  const isExpanded = (id: string) => {
  if (expandedIds.includes(id)) return compact
  return !compact
}

  const toggleCard = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    )
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !visibleRowIds.includes(id))
      )
      return
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleRowIds])))
  }

  const handleRead = (id: string) => {
    setRows((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              is_read: true,
            }
          : item
      )
    )

    window.dispatchEvent(new CustomEvent('notifications:changed'))
  }

  const deleteNotification = (id: string) => {
    const previousRows = rows
    const previousSelectedIds = selectedIds

    setRows((prev) => prev.filter((item) => item.id !== id))
    setSelectedIds((prev) => prev.filter((item) => item !== id))
    setExpandedIds((prev) => prev.filter((item) => item !== id))
    window.dispatchEvent(new CustomEvent('notifications:changed'))

    startTransition(async () => {
      const res = await fetch(`/api/notifications/${id}/delete`, {
        method: 'DELETE',
      })

      if (!res.ok) {
  const data = await res.json().catch(() => null)
  alert(data?.error || 'Bildiriş silinmədi.')
  setRows(previousRows)
  setSelectedIds(previousSelectedIds)
  window.dispatchEvent(new CustomEvent('notifications:changed'))
  return
}

      window.dispatchEvent(new CustomEvent('notifications:changed'))
      router.refresh()
    })
  }

  const bulkDelete = () => {
    if (selectedIds.length === 0) return

    const idsToDelete = selectedIds
    const previousRows = rows
    const previousSelectedIds = selectedIds

    setRows((prev) => prev.filter((item) => !idsToDelete.includes(item.id)))
    setSelectedIds([])
    setExpandedIds((prev) => prev.filter((id) => !idsToDelete.includes(id)))
    window.dispatchEvent(new CustomEvent('notifications:changed'))

    startTransition(async () => {
      const res = await fetch('/api/notifications/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: idsToDelete,
        }),
      })

      if (!res.ok) {
  const data = await res.json().catch(() => null)
  alert(data?.error || 'Bildirişlər silinmədi.')
  setRows(previousRows)
  setSelectedIds(previousSelectedIds)
  window.dispatchEvent(new CustomEvent('notifications:changed'))
  return
}

      window.dispatchEvent(new CustomEvent('notifications:changed'))
      router.refresh()
    })
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    router.push(`/dashboard/notifications?page=${page}`)
  }

  const fromItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const toItem = Math.min(currentPage * pageSize, total)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            Bildirişlər
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Audit sualları və sistem bildirişlərini buradan izləyin.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              setCompact((prev) => !prev)
              setExpandedIds([])
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {compact ? 'Bütün kartları böyüt' : 'Bütün kartları kiçilt'}
          </button>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-blue-500">
              Bu səhifədə oxunmamış
            </p>
            <p className="mt-1 text-2xl font-black text-blue-800">
              {unreadCount}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm font-bold text-slate-600">
            {total === 0
              ? 'Bildiriş yoxdur'
              : `${fromItem}-${toItem} göstərilir • Ümumi ${total} bildiriş`}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                className="h-4 w-4 rounded border-slate-300"
              />
              Bu səhifəni seç
            </label>

            <button
              type="button"
              onClick={bulkDelete}
              disabled={selectedCount === 0 || isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Seçilənləri sil {selectedCount > 0 ? `(${selectedCount})` : ''}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1 || isPending}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Əvvəlki
              </button>

              <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages || isPending}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Növbəti
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Bu səhifədə bildiriş yoxdur.
          </div>
        ) : (
          rows.map((item) => {
            const expanded = isExpanded(item.id)

            return (
              <article
                key={item.id}
                onClick={() => toggleCard(item.id)}
                className={`cursor-pointer rounded-2xl border shadow-sm transition hover:shadow-md ${
                  expanded ? 'p-5' : 'p-3'
                } ${
                  item.is_read
                    ? 'border-slate-200 bg-white'
                    : 'border-blue-200 bg-blue-50'
                } ${
                  selectedIds.includes(item.id)
                    ? 'ring-2 ring-blue-300'
                    : ''
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => toggleSelect(item.id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${
                          item.is_read
                            ? 'border-slate-200 bg-slate-50 text-slate-600'
                            : 'border-blue-200 bg-white text-blue-700'
                        }`}
                      >
                        {item.is_read ? 'Oxunub' : 'Yeni'}
                      </span>

                      {expanded && (
                        <>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                            {notificationTypeLabel(item.type)}
                          </span>

                          {item.comment_type && (
                            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                              {commentTypeLabel(item.comment_type)}
                            </span>
                          )}

                          <span className="text-xs font-bold text-slate-400">
                            {formatDateBaku(item.created_at)}
                          </span>
                        </>
                      )}
                    </div>

                    <h2
                      className={`mt-2 truncate font-black text-slate-900 ${
                        expanded ? '' : 'text-sm'
                      }`}
                    >
                      {item.title}
                    </h2>

                    {expanded && (
                      <>
                        <div className="mt-2 rounded-xl border border-slate-200 bg-white/80 p-3">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            Aid olduğu audit raporu
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-900">
                            {item.plan_title}
                          </p>

                          {item.plan_department && (
                            <p className="mt-1 text-xs font-bold text-slate-500">
                              Departament: {item.plan_department}
                            </p>
                          )}
                        </div>

                        {item.question_text && (
                          <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                            <p className="text-xs font-black uppercase tracking-wide text-blue-500">
                              Checklist sualı
                            </p>

                            <p className="mt-1 text-sm font-bold leading-6 text-blue-950">
                              {item.question_text}
                            </p>
                          </div>
                        )}

                        {(item.answer_response || item.answer_comment) && (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                              Həmin sual üzrə audit cavabı
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                                Cavab: {answerLabel(item.answer_response)}
                              </span>

                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                                Bal: {item.answer_score ?? 0}
                              </span>
                            </div>

                            {item.answer_comment && (
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {item.answer_comment}
                              </p>
                            )}
                          </div>
                        )}

                        {item.body && (
                          <div className="mt-2 rounded-xl border border-orange-100 bg-orange-50 p-3">
                            <p className="text-xs font-black uppercase tracking-wide text-orange-500">
                              Bildiriş mətni
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-orange-950">
                              {item.body}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div
                    className="flex shrink-0 flex-col gap-2 sm:items-end"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {item.report_href && (
                      <Link
                        href={item.report_href}
                        className="inline-flex justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                      >
                        Rapora bax
                      </Link>
                    )}

                    {!item.is_read && (
                      <MarkNotificationReadButton
                        id={item.id}
                        onRead={handleRead}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => deleteNotification(item.id)}
                      disabled={isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      <Trash2 size={16} />
                      Sil
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
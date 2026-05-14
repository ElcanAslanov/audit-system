'use client'

import {useMemo, useState} from 'react'
import {Link} from '@/i18n/routing'
import MarkNotificationReadButton from '@/components/notifications/mark-notification-read-button'

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

export default function NotificationsClient({initialRows}: Props) {
  const [rows, setRows] = useState(initialRows)
  const [compact, setCompact] = useState(true)

  const unreadCount = useMemo(
    () => rows.filter((item) => !item.is_read).length,
    [rows]
  )

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
            onClick={() => setCompact((prev) => !prev)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {compact ? 'Kartları böyüt' : 'Kartları kiçilt'}
          </button>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-blue-500">
              Oxunmamış
            </p>
            <p className="mt-1 text-2xl font-black text-blue-800">
              {unreadCount}
            </p>
          </div>
        </div>
      </div>

      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Bildiriş yoxdur.
          </div>
        ) : (
          rows.map((item) => (
            <article
  key={item.id}
  className={`rounded-2xl border shadow-sm transition ${
    compact ? 'p-3' : 'p-5'
  } ${
    item.is_read
      ? 'border-slate-200 bg-white'
      : 'border-blue-200 bg-blue-50'
  }`}
>
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-black ${
            item.is_read
              ? 'border-slate-200 bg-slate-50 text-slate-600'
              : 'border-blue-200 bg-white text-blue-700'
          }`}
        >
          {item.is_read ? 'Oxunub' : 'Yeni'}
        </span>

        {!compact && (
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
          compact ? 'text-sm' : ''
        }`}
      >
        {item.title}
      </h2>

      {!compact && (
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

    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
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
    </div>
  </div>
</article>
          ))
        )}
      </div>
    </div>
  )
}
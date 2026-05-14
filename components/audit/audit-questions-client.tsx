'use client'

import {useMemo, useState, useTransition} from 'react'
import {Link, useRouter} from '@/i18n/routing'

type AuditCommentRow = {
  id: string
  plan_id: string
  answer_id: string | null
  question_id: string | null
  sender_id: string
  recipient_id: string | null
  type: string
  status: string
  priority: string
  message: string
  created_at: string
  sender_name: string
  recipient_name: string
  plan_title: string
  answer_text: string
  replies: {
    id: string
    sender_id: string
    recipient_id: string | null
    message: string
    created_at: string
    sender_name: string
  }[]
}

type Props = {
  currentUserId: string
  comments: AuditCommentRow[]
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${day}.${month}.${year} ${hour}:${minute}`
}

function typeLabel(value?: string | null) {
  if (value === 'question') return 'Sual'
  if (value === 'comment') return 'Rəy'
  return '-'
}

function statusLabel(value?: string | null) {
  if (value === 'open') return 'Açıq'
  if (value === 'answered') return 'Cavablandırılıb'
  if (value === 'closed') return 'Bağlanıb'
  return value || '-'
}

function statusClass(value?: string | null) {
  if (value === 'open') return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  if (value === 'answered') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (value === 'closed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function priorityLabel(value?: string | null) {
  if (value === 'low') return 'Aşağı'
  if (value === 'normal') return 'Normal'
  if (value === 'high') return 'Yüksək'
  if (value === 'urgent') return 'Təcili'
  return '-'
}

export default function AuditQuestionsClient({
  currentUserId,
  comments,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'incoming' | 'sent' | 'all'>('incoming')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    return comments.filter((item) => {
      const byTab =
        tab === 'incoming'
          ? item.recipient_id === currentUserId
          : tab === 'sent'
            ? item.sender_id === currentUserId
            : true

      const byStatus =
        statusFilter === 'all' ? true : item.status === statusFilter

      return byTab && byStatus
    })
  }, [comments, currentUserId, tab, statusFilter])

  const openCount = comments.filter(
    (item) => item.recipient_id === currentUserId && item.status === 'open'
  ).length

  const sentCount = comments.filter(
    (item) => item.sender_id === currentUserId
  ).length

  const submitReply = (commentId: string) => {
    setError('')

    if (!replyText.trim()) {
      setError('Cavab mətni daxil edilməlidir.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/audit/comments/${commentId}/reply`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({message: replyText}),
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          setError(data?.error || 'Cavab göndərilmədi.')
          return
        }

        setReplyText('')
        setActiveReplyId(null)
        router.refresh()
      } catch (err: any) {
        setError(err?.message || 'Cavab göndərilmədi.')
      }
    })
  }

  const closeComment = (commentId: string) => {
    setError('')

    startTransition(async () => {
      try {
        const res = await fetch(`/api/audit/comments/${commentId}/close`, {
          method: 'POST',
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          setError(data?.error || 'Sual bağlanmadı.')
          return
        }

        router.refresh()
      } catch (err: any) {
        setError(err?.message || 'Sual bağlanmadı.')
      }
    })
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5">
          <p className="text-sm font-bold text-yellow-700">Açıq gələn suallar</p>
          <p className="mt-2 text-3xl font-black text-yellow-800">{openCount}</p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-bold text-blue-700">Mən göndərdiklərim</p>
          <p className="mt-2 text-3xl font-black text-blue-800">{sentCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-bold text-slate-500">Ümumi</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {comments.length}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab('incoming')}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                tab === 'incoming'
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              Mənə gələnlər
            </button>

            <button
              type="button"
              onClick={() => setTab('sent')}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                tab === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              Göndərdiklərim
            </button>

            <button
              type="button"
              onClick={() => setTab('all')}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                tab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              Hamısı
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-blue-400"
          >
            <option value="all">Bütün statuslar</option>
            <option value="open">Açıq</option>
            <option value="answered">Cavablandırılıb</option>
            <option value="closed">Bağlanıb</option>
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Sual/rəy tapılmadı.
          </div>
        ) : (
          filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                      {typeLabel(item.type)}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                        item.status
                      )}`}
                    >
                      {statusLabel(item.status)}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                      {priorityLabel(item.priority)}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-black text-slate-900">
                    {item.plan_title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Göndərən: <b>{item.sender_name}</b> • Alan:{' '}
                    <b>{item.recipient_name}</b> • {formatDate(item.created_at)}
                  </p>
                </div>

                <Link
                  href={`/dashboard/plans/${item.plan_id}/report`}
                  className="inline-flex rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                >
                  Rapora bax
                </Link>
              </div>

              {item.answer_text && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase text-slate-400">
                    Bağlı cavab
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {item.answer_text}
                  </p>
                </div>
              )}

              <div className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-800">
                {item.message}
              </div>

              {item.replies.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Cavablar
                  </p>

                  {item.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-xs font-bold text-slate-500">
                        {reply.sender_name} • {formatDate(reply.created_at)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {reply.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {item.status !== 'closed' && (
                <div className="mt-4 flex flex-col gap-3">
                  {activeReplyId === item.id && (
                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      rows={4}
                      placeholder="Cavabınızı yazın..."
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {activeReplyId === item.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReplyId(null)
                            setReplyText('')
                          }}
                          disabled={isPending}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          Ləğv et
                        </button>

                        <button
                          type="button"
                          onClick={() => submitReply(item.id)}
                          disabled={isPending}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {isPending ? 'Göndərilir...' : 'Cavabı göndər'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveReplyId(item.id)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                      >
                        Cavab yaz
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => closeComment(item.id)}
                      disabled={isPending}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      Bağla
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  )
}
'use client'

import {useMemo, useState, useTransition} from 'react'
import {useRouter} from '@/i18n/routing'

type AuditorOption = {
  id: string
  full_name: string | null
}

type AuditQuestionModalProps = {
  planId: string
  answerId?: string | null
  questionId?: string | null
  auditors: AuditorOption[]
}

export default function AuditQuestionModal({
  planId,
  answerId,
  questionId,
  auditors,
}: AuditQuestionModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'question' | 'comment'>('question')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>(
    'normal'
  )
  const [recipientId, setRecipientId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  const normalizedAuditors = useMemo(
    () =>
      (auditors || []).filter((item) => item?.id),
    [auditors]
  )

  const resetAndClose = () => {
    setOpen(false)
    setType('question')
    setPriority('normal')
    setRecipientId('')
    setMessage('')
    setError('')
    setSuccess('')
  }

  const submit = () => {
    setError('')
    setSuccess('')

    if (!recipientId) {
      setError('Auditor seçilməlidir.')
      return
    }

    if (!message.trim()) {
      setError('Mətn daxil edilməlidir.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/audit/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_id: planId,
            answer_id: answerId || null,
            question_id: questionId || null,
            recipient_id: recipientId,
            type,
            priority,
            message,
          }),
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          setError(data?.error || 'Sual/rəy göndərilmədi.')
          return
        }

        setSuccess('Göndərildi.')
        router.refresh()

        setTimeout(() => {
          resetAndClose()
        }, 600)
      } catch (err: any) {
        setError(err?.message || 'Sual/rəy göndərilmədi.')
      }
    })
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={() => {
            setType('question')
            setOpen(true)
          }}
          className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
        >
          Sual ver
        </button>

        <button
          type="button"
          onClick={() => {
            setType('comment')
            setOpen(true)
          }}
          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Rəy bildir
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 print:hidden">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {type === 'question' ? 'Sual ver' : 'Rəy bildir'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bu qeyd seçilmiş audit cavabına bağlanacaq.
                </p>
              </div>

              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Tip
                </label>
                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as 'question' | 'comment')
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400"
                >
                  <option value="question">Sual</option>
                  <option value="comment">Rəy</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Auditor
                </label>
                <select
                  value={recipientId}
                  onChange={(event) => setRecipientId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400"
                >
                  <option value="">Auditor seçin</option>
                  {normalizedAuditors.map((auditor) => (
                    <option key={auditor.id} value={auditor.id}>
                      {auditor.full_name || auditor.id}
                    </option>
                  ))}
                </select>

                {normalizedAuditors.length === 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    Bu audit üçün təyin edilmiş auditor tapılmadı.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Prioritet
                </label>
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target.value as
                        | 'low'
                        | 'normal'
                        | 'high'
                        | 'urgent'
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400"
                >
                  <option value="low">Aşağı</option>
                  <option value="normal">Normal</option>
                  <option value="high">Yüksək</option>
                  <option value="urgent">Təcili</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Mətn
                </label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  placeholder="Sualınızı və ya rəyinizi yazın..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  {success}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetAndClose}
                disabled={isPending}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Bağla
              </button>

              <button
                type="button"
                onClick={submit}
                disabled={isPending}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? 'Göndərilir...' : 'Göndər'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
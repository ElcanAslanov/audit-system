'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import {Link, useRouter} from '@/i18n/routing'
import {Bell, Check, ExternalLink, X} from 'lucide-react'

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string | null
  related_plan_id: string | null
  related_id: string | null
  is_read: boolean
  created_at: string
  report_href: string
}

function formatDateBaku(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const parts = new Intl.DateTimeFormat('az-AZ', {
    timeZone: 'Asia/Baku',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || ''

  return `${get('day')}.${get('month')} ${get('hour')}:${get('minute')}`
}

function notificationTypeLabel(value?: string | null) {
  if (value === 'audit_comment') return 'Sual/Rəy'
  if (value === 'audit_comment_reply') return 'Cavab'
  return 'Bildiriş'
}

export default function NotificationBell() {
  const router = useRouter()
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])

  const unreadCount = useMemo(
    () => items.filter((item) => !item.is_read).length,
    [items]
  )

  const loadNotifications = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/notifications/list?limit=6', {
        cache: 'no-store',
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        setItems(data?.notifications || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()

    const onChanged = () => {
      loadNotifications()
    }

    window.addEventListener('notifications:changed', onChanged)

    return () => {
      window.removeEventListener('notifications:changed', onChanged)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const onClick = (event: MouseEvent) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onClick)

    return () => {
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const markRead = async (id: string) => {
    setItems((prev) =>
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

    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
    })

    if (!res.ok) {
      loadNotifications()
    }
  }

  const openReport = async (item: NotificationItem) => {
    if (!item.is_read) {
      await markRead(item.id)
    }

    setOpen(false)

    if (item.report_href) {
      router.push(item.report_href as any)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) loadNotifications()
        }}
        className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        aria-label="Bildirişlər"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black leading-none text-white ring-2 ring-slate-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-13 z-50 w-[min(92vw,420px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-900">Bildirişlər</p>
              <p className="text-xs font-semibold text-slate-500">
                Oxunmamış: {unreadCount}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Bağla"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {loading && items.length === 0 ? (
              <div className="p-5 text-center text-sm font-semibold text-slate-500">
                Yüklənir...
              </div>
            ) : items.length === 0 ? (
              <div className="p-5 text-center text-sm font-semibold text-slate-500">
                Bildiriş yoxdur.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`mb-2 rounded-2xl border p-3 ${
                    item.is_read
                      ? 'border-slate-200 bg-white'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => openReport(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${
                            item.is_read
                              ? 'border-slate-200 bg-slate-50 text-slate-600'
                              : 'border-blue-200 bg-white text-blue-700'
                          }`}
                        >
                          {item.is_read ? 'Oxunub' : 'Yeni'}
                        </span>

                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black text-slate-600">
                          {notificationTypeLabel(item.type)}
                        </span>

                        <span className="text-[11px] font-bold text-slate-400">
                          {formatDateBaku(item.created_at)}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm font-black leading-5 text-slate-900">
                        {item.title}
                      </p>

                      {item.body && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                          {item.body}
                        </p>
                      )}
                    </button>

                    {!item.is_read && (
                      <button
                        type="button"
                        onClick={() => markRead(item.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        title="Oxundu et"
                        aria-label="Oxundu et"
                      >
                        <Check size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 p-3">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Bütün bildirişlərə bax
              <ExternalLink size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { Link } from '@/i18n/routing'
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Gauge,
  ListChecks,
  X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type Stats = {
  averageScore: string | number
  totalAudits: number
  highRiskCount: number
}

type AuditItem = {
  id?: string
  title?: string
  name?: string
  status?: string
  score?: number | string | null
  result_score?: number | string | null
  due_date?: string | null
  start_date?: string | null
  companies?: {
    name?: string | null
  } | null
  department?: string | null
}

type AuditGroups = {
  completed?: AuditItem[]
  risky?: AuditItem[]
  planned?: AuditItem[]
}

type ModalType = 'performance' | 'risk' | 'completed' | null

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value))
}

function getAuditScore(audit: AuditItem) {
  const value = Number(audit?.score ?? audit?.result_score ?? 0)
  return Number.isFinite(value) ? value : 0
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const raw = String(value)
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (match) {
    const [, year, month, day] = match
    return `${day}.${month}.${year}`
  }

  return raw
}

function statusLabel(value?: string | null) {
  if (value === 'tamamlandi') return 'Tamamlandı'
  if (value === 'needs_attention') return 'Diqqət tələb edir'
  if (value === 'planlanan') return 'Planlanan'
  return value || '-'
}

function scoreTone(score: number, t: ReturnType<typeof useTranslations>) {
  if (score >= 80) {
    return {
      label: t('highPerformance'),
      text: 'text-emerald-700',
      bg: 'bg-emerald-500',
      soft: 'bg-emerald-50',
      border: 'border-emerald-100',
    }
  }

  if (score >= 50) {
    return {
      label: t('mediumPerformance'),
      text: 'text-yellow-700',
      bg: 'bg-yellow-500',
      soft: 'bg-yellow-50',
      border: 'border-yellow-100',
    }
  }

  return {
    label: t('lowPerformance'),
    text: 'text-red-700',
    bg: 'bg-red-500',
    soft: 'bg-red-50',
    border: 'border-red-100',
  }
}

export default function DashboardStats({
  stats,
  auditGroups,
}: {
  stats: Stats
  auditGroups?: AuditGroups
}) {
  const t = useTranslations('dashboardStats')
  const averageScore = clampScore(Number(stats?.averageScore || 0))
  const tone = scoreTone(averageScore, t)

  const [modalType, setModalType] = useState<ModalType>(null)
  const [mounted, setMounted] = useState(false)

  const performanceAudits = useMemo(() => {
    const map = new Map<string, AuditItem>()

    const addAudit = (audit: AuditItem, index: number, group: string) => {
      const key = audit.id || `${group}-${audit.title || audit.name || index}`
      map.set(key, audit)
    }

    ;(auditGroups?.completed || []).forEach((audit, index) =>
      addAudit(audit, index, 'completed')
    )
    ;(auditGroups?.risky || []).forEach((audit, index) =>
      addAudit(audit, index, 'risky')
    )
    ;(auditGroups?.planned || []).forEach((audit, index) =>
      addAudit(audit, index, 'planned')
    )

    return Array.from(map.values())
  }, [auditGroups])

  const performanceTotalScore = performanceAudits.reduce(
    (sum, audit) => sum + getAuditScore(audit),
    0
  )

  const calculatedAverage =
    performanceAudits.length > 0
      ? Math.round(performanceTotalScore / performanceAudits.length)
      : averageScore

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!modalType) return

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModalType(null)
    }

    document.addEventListener('keydown', onEsc)

    return () => {
      document.removeEventListener('keydown', onEsc)
    }
  }, [modalType])

  const modalData = useMemo(() => {
    if (modalType === 'performance') {
      return {
        title: 'Ümumi performans',
        description:
          'Bu göstərici auditlərin score faizlərinin ortalamasıdır. Yəni auditlərin score dəyərləri toplanır və audit sayına bölünür.',
        tone: 'blue',
        items: performanceAudits,
        isPerformance: true,
      }
    }

    if (modalType === 'risk') {
      return {
        title: 'Riskli auditlər',
        description:
          'Statusu “needs_attention” olan və ya nəticə faizi 50%-dən aşağı olan auditlər.',
        tone: 'red',
        items: auditGroups?.risky || [],
        isPerformance: false,
      }
    }

    if (modalType === 'completed') {
      return {
        title: 'Tamamlanmış auditlər',
        description: 'Statusu tamamlanmış olan auditlər.',
        tone: 'emerald',
        items: auditGroups?.completed || [],
        isPerformance: false,
      }
    }

    return null
  }, [auditGroups, modalType, performanceAudits])

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => setModalType('performance')}
          className={`group relative overflow-hidden rounded-3xl border ${tone.border} ${tone.soft} p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
        >
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/60 blur-2xl transition group-hover:scale-125" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm">
                <Gauge size={21} className={tone.text} />
              </div>

              <h3 className={`mt-4 text-sm font-black ${tone.text}`}>
                {t('overallPerformance')}
              </h3>

              <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                {stats?.averageScore ?? 0}%
              </p>

              <p className={`mt-1 text-xs font-bold ${tone.text}`}>
                {tone.label} • Üzərinə basaraq hesablamaya bax
              </p>
            </div>

            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
              {t('score')}
            </span>
          </div>

          <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-white/80">
            <div
              className={`h-full rounded-full ${tone.bg} transition-all duration-700`}
              style={{ width: `${averageScore}%` }}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setModalType('risk')}
          className="group relative overflow-hidden rounded-3xl border border-red-100 bg-red-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/60 blur-2xl transition group-hover:scale-125" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm">
                <AlertTriangle size={21} className="text-red-700" />
              </div>

              <h3 className="mt-4 text-sm font-black text-red-700">
                {t('openRisks')}
              </h3>

              <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                {auditGroups?.risky?.length ?? stats?.highRiskCount ?? 0}
              </p>

              <p className="mt-1 text-xs font-bold text-red-700">
                Üzərinə basaraq siyahıya bax
              </p>
            </div>

            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-red-700 shadow-sm">
              {t('risk')}
            </span>
          </div>

          <div className="relative mt-5 rounded-2xl border border-red-100 bg-white/70 p-3">
            <p className="text-xs leading-5 text-red-700">
              {t('riskDescription')}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setModalType('completed')}
          className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/60 blur-2xl transition group-hover:scale-125" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm">
                <CheckCircle2 size={21} className="text-emerald-700" />
              </div>

              <h3 className="mt-4 text-sm font-black text-emerald-700">
                {t('completedAudits')}
              </h3>

              <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                {auditGroups?.completed?.length ?? stats?.totalAudits ?? 0}
              </p>

              <p className="mt-1 text-xs font-bold text-emerald-700">
                Üzərinə basaraq siyahıya bax
              </p>
            </div>

            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
              {t('done')}
            </span>
          </div>

          <div className="relative mt-5 rounded-2xl border border-emerald-100 bg-white/70 p-3">
            <p className="text-xs leading-5 text-emerald-700">
              {t('completedDescription')}
            </p>
          </div>
        </button>
      </div>

      {mounted &&
        modalData &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:items-center">
            <button
              type="button"
              aria-label="Bağla"
              onClick={() => setModalType(null)}
              className="absolute inset-0 cursor-default"
            />

            <div className="relative z-10 max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <div
                    className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${
                      modalData.tone === 'red'
                        ? 'bg-red-50 text-red-700'
                        : modalData.tone === 'emerald'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {modalData.isPerformance ? (
                      <Calculator size={14} />
                    ) : (
                      <ListChecks size={14} />
                    )}
                    {modalData.items.length} audit
                  </div>

                  <h3 className="text-lg font-black text-slate-950">
                    {modalData.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {modalData.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto p-4">
                {modalData.isPerformance && (
                  <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-black uppercase text-blue-700/70">
                        Audit sayı
                      </p>
                      <p className="mt-1 text-2xl font-black text-blue-900">
                        {modalData.items.length}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase text-slate-500">
                        Score cəmi
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {performanceTotalScore}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-xs font-black uppercase text-emerald-700/70">
                        Ortalama
                      </p>
                      <p className="mt-1 text-2xl font-black text-emerald-900">
                        {calculatedAverage}%
                      </p>
                    </div>
                  </div>
                )}

                {modalData.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                    Bu bölmə üzrə audit tapılmadı.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {modalData.items.map((audit: AuditItem, index: number) => {
                      const score = getAuditScore(audit)

                      return (
                        <Link
                          key={audit.id || `${audit.title}-${index}`}
                          href={`/dashboard/plans/${audit.id}`}
                          onClick={() => setModalType(null)}
                          className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-black text-slate-950">
                                {audit.title || audit.name || '-'}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {audit.department || '-'} •{' '}
                                {audit.companies?.name || '-'}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                {statusLabel(audit.status)}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-black ${
                                  score < 50
                                    ? 'bg-red-50 text-red-700'
                                    : score < 80
                                      ? 'bg-yellow-50 text-yellow-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {score}%
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                            <span className="rounded-full bg-slate-50 px-2.5 py-1">
                              Başlama: {formatDate(audit.start_date)}
                            </span>
                            <span className="rounded-full bg-slate-50 px-2.5 py-1">
                              Son tarix: {formatDate(audit.due_date)}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
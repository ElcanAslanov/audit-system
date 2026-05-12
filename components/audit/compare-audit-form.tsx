'use client'

import dynamic from 'next/dynamic'
import {useMemo, useState, useTransition} from 'react'
import {useTranslations} from 'next-intl'
import {getAuditCompareData} from '@/app/[locale]/dashboard/compare/actions'

const CompareResultSection = dynamic(
  () => import('@/components/audit/compare-result-section'),
  {
    ssr: false,
    loading: () => <CompareResultSkeleton />,
  }
)

type Plan = {
  id: string
  title: string
  department?: string | null
  status?: string | null
  score?: number | null
  created_at?: string | null
  questionIds?: string[]
  sectionIds?: string[]
  companies?: {
    id?: string | null
    name?: string | null
  } | null
}

type CompareResult = {
  left: any
  right: any
}

function hasIntersection(a?: string[], b?: string[]) {
  const left = new Set(a || [])

  for (const value of b || []) {
    if (left.has(value)) return true
  }

  return false
}

function hasComparableComposition(left?: Plan, right?: Plan) {
  if (!left || !right) return true

  return hasIntersection(left.questionIds, right.questionIds)
}

export default function CompareAuditForm({plans}: {plans: Plan[]}) {
  const t = useTranslations('compareAudit')

  const statusLabel = (value?: string | null) => {
    if (value === 'tamamlandi') return t('completed')
    if (value === 'needs_attention') return t('needsAttention')
    if (value === 'planlanan') return t('planned')
    return value || '-'
  }

  const answerLabel = (value?: string | null) => {
    if (value === 'yes') return t('yes')
    if (value === 'no') return t('no')
    if (value === 'na') return t('na')
    return '-'
  }

  const [leftId, setLeftId] = useState('')
  const [rightId, setRightId] = useState('')
  const [result, setResult] = useState<CompareResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedLeftPlan = useMemo(
    () => plans.find((plan) => plan.id === leftId) || null,
    [plans, leftId]
  )

  const selectedRightPlan = useMemo(
    () => plans.find((plan) => plan.id === rightId) || null,
    [plans, rightId]
  )

  const availableRightPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (plan.id === leftId) return false
      if (!selectedLeftPlan) return true

      return hasComparableComposition(selectedLeftPlan, plan)
    })
  }, [plans, leftId, selectedLeftPlan])

  const availableLeftPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (plan.id === rightId) return false
      if (!selectedRightPlan) return true

      return hasComparableComposition(plan, selectedRightPlan)
    })
  }, [plans, rightId, selectedRightPlan])

  const handleCompare = () => {
    setError(null)
    setResult(null)

    if (!leftId || !rightId) {
      setError(t('selectTwoAudits'))
      return
    }

    if (leftId === rightId) {
      setError(t('sameAuditError'))
      return
    }

    startTransition(async () => {
      const response = await getAuditCompareData(leftId, rightId)

      if (!response.success) {
        setError(response.error || t('compareDataError'))
        return
      }

      setResult({
        left: response.left,
        right: response.right,
      })
    })
  }

  const handleReset = () => {
    setLeftId('')
    setRightId('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
       <div className="lg:col-span-5">
  <label
    htmlFor="left-audit-select"
    className="mb-1 block text-sm font-semibold text-slate-700"
  >
    {t('firstAudit')}
  </label>

  <select
    id="left-audit-select"
    name="left_audit_id"
    value={leftId}
    onChange={(event) => {
      const nextLeftId = event.target.value
      const nextLeftPlan =
        plans.find((plan) => plan.id === nextLeftId) || null
      const currentRightPlan =
        plans.find((plan) => plan.id === rightId) || null

      setLeftId(nextLeftId)

      if (
        nextLeftPlan &&
        currentRightPlan &&
        !hasComparableComposition(nextLeftPlan, currentRightPlan)
      ) {
        setRightId('')
        setResult(null)
      }
    }}
    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
  >
    <option value="">{t('selectAudit')}</option>
    {availableLeftPlans.map((plan) => (
      <option key={plan.id} value={plan.id}>
        {plan.title} — {plan.companies?.name || '-'} — {plan.score ?? 0}%
      </option>
    ))}
  </select>
</div>

<div className="flex items-end justify-center lg:col-span-2">
  <div className="mb-[1px] rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500">
    VS
  </div>
</div>

<div className="lg:col-span-5">
  <label
    htmlFor="right-audit-select"
    className="mb-1 block text-sm font-semibold text-slate-700"
  >
    {t('secondAudit')}
  </label>

  <select
    id="right-audit-select"
    name="right_audit_id"
    value={rightId}
    onChange={(event) => {
      const nextRightId = event.target.value
      const nextRightPlan =
        plans.find((plan) => plan.id === nextRightId) || null
      const currentLeftPlan =
        plans.find((plan) => plan.id === leftId) || null

      setRightId(nextRightId)

      if (
        nextRightPlan &&
        currentLeftPlan &&
        !hasComparableComposition(currentLeftPlan, nextRightPlan)
      ) {
        setLeftId('')
        setResult(null)
      }
    }}
    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
  >
    <option value="">{t('selectAudit')}</option>
    {availableRightPlans.map((plan) => (
      <option key={plan.id} value={plan.id}>
        {plan.title} — {plan.companies?.name || '-'} — {plan.score ?? 0}%
      </option>
    ))}
  </select>
</div>
        </div>

        {((rightId && availableLeftPlans.length === 0) ||
          (leftId && availableRightPlans.length === 0)) && (
          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              {rightId && availableLeftPlans.length === 0 && (
                <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800">
                  {t('noComparableWithSecond')}
                </p>
              )}
            </div>

            <div className="hidden lg:col-span-2 lg:block" />

            <div className="lg:col-span-5">
              {leftId && availableRightPlans.length === 0 && (
                <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800">
                  {t('noComparableWithFirst')}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={!leftId && !rightId && !result && !error}
            onClick={handleCompare}
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300 sm:w-auto"
          >
            {isPending ? t('comparing') : t('compare')}
          </button>

          <button
            type="button"
            disabled={!leftId && !rightId && !result && !error}
            onClick={handleReset}
            className="w-full rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {t('reset')}
          </button>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </section>

      {result && (
        <CompareResultSection
          result={result}
          statusLabel={statusLabel}
          answerLabel={answerLabel}
        />
      )}
    </div>
  )
}

function CompareResultSkeleton() {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
          />
        ))}
      </div>

      <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
    </section>
  )
}
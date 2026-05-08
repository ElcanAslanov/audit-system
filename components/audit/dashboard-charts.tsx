'use client'

import {useEffect, useMemo, useState} from 'react'
import type {ReactNode} from 'react'
import {useTranslations} from 'next-intl'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ChartData = {
  yearly: {year: string; count: number}[]
  monthly: {key: string; month: string; count: number}[]
  monthlyScore: {key: string; month: string; score: number}[]
  status: {name: string; value: number}[]
}

const pieColors = ['#2563eb', '#16a34a', '#dc2626', '#64748b']

function ChartBox({children}: {children: ReactNode}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReady(true)
    }, 80)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="relative h-[288px] min-h-[288px] w-full min-w-0 overflow-hidden">
      {!ready ? (
        <div className="h-full w-full rounded-2xl bg-slate-50" />
      ) : (
        <ResponsiveContainer width="99%" height={288}>
          {children as any}
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function DashboardCharts({data}: {data: ChartData}) {
  const t = useTranslations('dashboardCharts')

  const localizedStatus = useMemo(() => {
    return (data.status || []).map((item) => {
      const raw = String(item.name || '').toLowerCase()

      let name = item.name

      if (
        raw === 'tamamlandi' ||
        raw === 'tamamlandı' ||
        raw === 'completed'
      ) {
        name = t('completed')
      } else if (
        raw === 'needs_attention' ||
        raw === 'diqqət tələb edir' ||
        raw === 'needs attention'
      ) {
        name = t('needsAttention')
      } else if (
        raw === 'planlanan' ||
        raw === 'planned'
      ) {
        name = t('planned')
      }

      return {
        ...item,
        name,
      }
    })
  }, [data.status, t])

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="w-full min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-black text-slate-950">
            {t('yearlyAuditCount')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('yearlyAuditCountSubtitle')}
          </p>
        </div>

        <ChartBox>
          <BarChart data={data.yearly}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#2563eb" />
          </BarChart>
        </ChartBox>
      </section>

      <section className="w-full min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-black text-slate-950">
            {t('monthlyAuditCount')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('monthlyAuditCountSubtitle')}
          </p>
        </div>

        <ChartBox>
          <AreaChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{fontSize: 11}}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#2563eb"
              fill="#dbeafe"
              strokeWidth={3}
            />
          </AreaChart>
        </ChartBox>
      </section>

      <section className="w-full min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-black text-slate-950">
            {t('monthlyAverageScore')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('monthlyAverageScoreSubtitle')}
          </p>
        </div>

        <ChartBox>
          <AreaChart data={data.monthlyScore}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{fontSize: 11}}
            />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#16a34a"
              fill="#dcfce7"
              strokeWidth={3}
            />
          </AreaChart>
        </ChartBox>
      </section>

      <section className="w-full min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-black text-slate-950">
            {t('statusDistribution')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('statusDistributionSubtitle')}
          </p>
        </div>

        <ChartBox>
          <PieChart>
            <Pie
              data={localizedStatus}
              dataKey="value"
              nameKey="name"
              outerRadius={95}
              label
            >
              {localizedStatus.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={pieColors[index % pieColors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartBox>
      </section>
    </div>
  )
}
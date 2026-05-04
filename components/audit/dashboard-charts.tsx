'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
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
  yearly: { year: string; count: number }[]
  monthly: { key: string; month: string; count: number }[]
  monthlyScore: { key: string; month: string; score: number }[]
  status: { name: string; value: number }[]
}

const pieColors = ['#2563eb', '#16a34a', '#dc2626', '#64748b']

function ChartBox({ children }: { children: ReactNode }) {
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

export default function DashboardCharts({ data }: { data: ChartData }) {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="w-full min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-black text-slate-950">
            İllər üzrə audit sayı
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Hər il yaradılmış audit planlarının sayı
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
            Aylar üzrə audit sayı
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Aylıq yaradılmış audit planlarının sayı
          </p>
        </div>

        <ChartBox>
          <AreaChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
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
            Aylar üzrə orta score
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Tamamlanmış auditlərin aylıq orta performansı
          </p>
        </div>

        <ChartBox>
          <AreaChart data={data.monthlyScore}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
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
            Status bölgüsü
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Audit planlarının statuslara görə bölgüsü
          </p>
        </div>

        <ChartBox>
          <PieChart>
            <Pie
              data={data.status}
              dataKey="value"
              nameKey="name"
              outerRadius={95}
              label
            >
              {data.status.map((_, index) => (
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
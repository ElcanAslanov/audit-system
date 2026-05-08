import DashboardStats from '@/components/DashboardStats'
import TrendAnalysis from '@/components/TrendAnalysis'
import RecentAudits from '@/components/RecentAudits'
import DashboardCharts from '@/components/audit/dashboard-charts'
import {
  getAuditChartData,
  getDashboardStats,
  getMonthlyTrend,
  getRecentAudits,
} from '@/app/actions/audit-actions'
import {getTranslations} from 'next-intl/server'

export default async function DashboardPage() {
  const t = await getTranslations('dashboardHome')

  const [stats, trends, recentAudits, chartData] = await Promise.all([
    getDashboardStats(),
    getMonthlyTrend(),
    getRecentAudits(),
    getAuditChartData(),
  ])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-950">
              {t('generalStats')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('generalStatsSubtitle')}
            </p>
          </div>

          <DashboardStats stats={stats} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <RecentAudits audits={recentAudits} />
        </section>

        <DashboardCharts data={chartData} />

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <TrendAnalysis trends={trends} />
        </section>
      </div>
    </div>
  )
}
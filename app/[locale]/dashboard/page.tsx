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
import { getTranslations } from 'next-intl/server'

function getAuditStatus(audit: any) {
  return String(audit?.status || '').toLowerCase()
}

function getAuditScore(audit: any) {
  return Number(audit?.score ?? audit?.result_score ?? 0)
}

function isCompletedAudit(audit: any) {
  const status = getAuditStatus(audit)
  return status === 'tamamlandi' || status === 'completed'
}

function isRiskyAudit(audit: any) {
  const status = getAuditStatus(audit)
  const score = getAuditScore(audit)

  return (
    status === 'needs_attention' ||
    status === 'riskli' ||
    status === 'risky' ||
    score < 50
  )
}

function isPlannedAudit(audit: any) {
  const status = getAuditStatus(audit)
  return status === 'planlanan' || status === 'planned'
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboardHome')

  const [stats, trends, recentAudits, chartData] = await Promise.all([
    getDashboardStats(),
    getMonthlyTrend(),
    getRecentAudits(),
    getAuditChartData(),
  ])

  const audits = Array.isArray(recentAudits) ? recentAudits : []

  const auditGroups = {
    completed: audits.filter(isCompletedAudit),
    risky: audits.filter(isRiskyAudit),
    planned: audits.filter(isPlannedAudit),
  }

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

          <DashboardStats stats={stats} auditGroups={auditGroups} />
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
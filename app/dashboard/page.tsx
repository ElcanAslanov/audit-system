import { getUserProfile } from '@/lib/actions'
import DashboardStats from '../../components/DashboardStats'
import TrendAnalysis from '../../components/TrendAnalysis'
import RecentAudits from '../../components/RecentAudits'
import DashboardCharts from '@/components/audit/dashboard-charts'
import {
  getAuditChartData,
  getDashboardStats,
  getMonthlyTrend,
  getRecentAudits,
} from '@/app/actions/audit-actions'
import { CalendarDays, ShieldCheck } from 'lucide-react'

function roleLabel(role?: string | null) {
  if (role === 'admin') return 'Administrator'
  if (role === 'rehber') return 'Rəhbər'
  if (role === 'muavin') return 'Müavin'
  if (role === 'audit_muavini') return 'Audit müavini'
  if (role === 'auditor') return 'Auditor'
  return role || '-'
}

function greetingName(fullName?: string | null) {
  if (!fullName) return 'İstifadəçi'
  return fullName.split(' ')[0] || fullName
}

function todayAz() {
  return new Date().toLocaleDateString('az-AZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default async function DashboardPage() {
  const profile = await getUserProfile()

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
              Ümumi göstəricilər
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Score, risk və tamamlanmış auditlərin xülasəsi
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
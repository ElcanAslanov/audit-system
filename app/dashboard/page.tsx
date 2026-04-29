import { getUserProfile } from '@/lib/actions'
import { createClient } from '@/lib/supabase/server'
import DashboardStats from '../../components/DashboardStats'
import TrendAnalysis from '../../components/TrendAnalysis'
import CriticalAlerts from '../../components/CriticalAlerts'
import RecentAudits from '../../components/RecentAudits'
import RiskSummary from '../../components/RiskSummary'
import {
  getDashboardStats,
  getMonthlyTrend,
  getRecentAudits,
  getRiskSummary,
} from '@/app/actions/audit-actions'
import QuickActions from '../../components/QuickActions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const profile = await getUserProfile()

const { data: criticalAudits } = await supabase
  .from('audit_plans')
  .select('id, title, status, score, department, due_date')
  .or('status.eq.needs_attention,score.lt.50')
  .order('created_at', { ascending: false })
  .limit(5)

  const [stats, trends, recentAudits, riskSummary] = await Promise.all([
    getDashboardStats(),
    getMonthlyTrend(),
    getRecentAudits(),
    getRiskSummary(),
  ])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          İdarə Paneli
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Audit performansı, risklər və son fəaliyyətlər üzrə ümumi görünüş.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
     <div className="space-y-6 xl:col-span-4">
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <h2 className="text-lg font-bold text-slate-900">Profil</h2>
    <p className="mt-2 text-slate-600">{profile?.full_name}</p>
    <p className="text-sm font-semibold uppercase text-blue-600">
      {profile?.role}
    </p>
  </div>

  <QuickActions />

  <CriticalAlerts alerts={criticalAudits || []} />

  <RiskSummary summary={riskSummary} />
</div>

        <div className="space-y-6 xl:col-span-8">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Ümumi Analitika
            </h2>
            <DashboardStats stats={stats} />
          </section>

          <TrendAnalysis trends={trends} />

          <RecentAudits audits={recentAudits} />
        </div>
      </div>
    </div>
  )
}
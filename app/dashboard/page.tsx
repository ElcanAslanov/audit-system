import { getUserProfile } from '@/lib/actions';
import { createClient } from '@/lib/supabase/server';
import DashboardStats from '../../components/DashboardStats';
import TrendAnalysis from '../../components/TrendAnalysis';
import CriticalAlerts from '../../components/CriticalAlerts';

export default async function DashboardPage() {
  const supabase = await createClient();
  const profile = await getUserProfile();

  // 1. Kritik auditləri bazadan çəkirik
  // QEYD: 'audit_plans' cədvəlində 'status' sütunu olduğundan əmin ol
  const { data: criticalAudits } = await supabase
    .from('audit_plans')
    .select('*')
    .eq('status', 'needs_attention');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">İdarə Paneli</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SOL TƏRƏF (Profil və Kritik Xəbərdarlıqlar) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 shadow rounded-lg border">
            <h2 className="text-lg font-bold">Profil</h2>
            <p className="mt-2 text-gray-600">{profile?.full_name}</p>
            <p className="text-blue-600 font-semibold uppercase text-sm">{profile?.role}</p>
          </div>

          {/* Kritik alertlər burada görünəcək */}
          <CriticalAlerts alerts={criticalAudits || []} />
        </div>

        {/* SAĞ TƏRƏF (Analitika və Trendlər) */}
        <div className="lg:col-span-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Ümumi Analitika</h2>
            <DashboardStats />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Aylıq Performans Trendi</h2>
            <TrendAnalysis />
          </section>
        </div>

      </div>
    </div>
  );
}
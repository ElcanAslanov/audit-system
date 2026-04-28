import { createClient } from '@/lib/supabase/server'
import CreatePlanForm from '@/components/create-plan-form'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role

  if (!profile) {
    return <div>Profil tapılmadı.</div>;
  }

  // 1. İstifadəçiləri və Şirkətləri çək
  const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, role')
  const { data: companies } = await supabase.from('companies').select('id, name')
  // YENİ: Şablonları çəkirik
  const { data: templates } = await supabase.from('audit_templates').select('id, title')
  
  // Auditorları filtrlə
  let assignableUsers: any[] = []
  if (allProfiles) {
    if (role === 'audit_muavini') {
      assignableUsers = allProfiles.filter(p => p.role === 'auditor')
    } else if (role === 'admin' || role === 'rehber') {
      assignableUsers = allProfiles.filter(p => p.role !== 'admin')
    }
  }

 // 2. Planları çək (Heç bir əlavə .or və ya .eq lazım deyil!)
// RLS siyasətlərin artıq məlumatları bazada filtrləyir.
let query = supabase
  .from('audit_plans')
  .select(`
    *, 
    companies(name), 
    plan_assignments(profiles(full_name)) 
  `);



const { data: plans, error: planError } = await query;
  
  if (planError) {
    console.error("Planları çəkərkən xəta:", planError);
    return <div>Planları yükləmək mümkün olmadı.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Audit Planları</h1>
      </div>

      {/* Şablonları formaya ötürürük */}
      {(role === 'admin' || role === 'rehber' || role === 'audit_muavini') && (
        <CreatePlanForm 
          companies={companies || []} 
          auditors={assignableUsers} 
          templates={templates || []} 
        />
      )}
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Cari Planlar ({plans?.length || 0})</h2>
        <div className="grid gap-3">
          {plans?.map((plan: any) => (
            <div key={plan.id} className="bg-white p-4 rounded-lg border flex justify-between items-center hover:shadow-sm transition">
              <div>
                <p className="font-bold text-slate-800">{plan.title}</p>
                <p className="text-sm text-slate-500">{plan.department} • {plan.companies?.name}</p>
              </div>
              
              <div className="flex items-center gap-4 text-right">
                <div className="text-sm text-slate-400 mr-4">
                    <p>Son: {plan.due_date}</p>
                    <p className="font-medium text-slate-700">
                      {plan.plan_assignments?.length > 0 
                        ? plan.plan_assignments.map((a: any) => a.profiles?.full_name).join(', ') 
                        : 'Təyin olunmayıb'}
                    </p>
                </div>

                <Link 
                  href={`/dashboard/plans/${plan.id}/fill`} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Auditi Doldur
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
import { createClient } from '@/lib/supabase/server'
import CreatePlanForm from '@/components/create-plan-form'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PlansPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  if (!profile) {
    return <div>Profil tapılmadı.</div>
  }

  // 1. İstifadəçiləri, şirkətləri və şablonları çək
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')

  const { data: templates } = await supabase
    .from('audit_templates')
    .select('id, title')

  // Auditorları role görə filtrlə
  let assignableUsers: any[] = []

  if (allProfiles) {
    if (role === 'audit_muavini') {
      assignableUsers = allProfiles.filter((p: any) => p.role === 'auditor')
    } else if (role === 'admin' || role === 'rehber') {
      assignableUsers = allProfiles.filter((p: any) => p.role !== 'admin')
    }
  }

  // 2. Planları çək
  // RLS siyasətlərin artıq məlumatları bazada filtrləyir.
  const { data: plans, error: planError } = await supabase
    .from('audit_plans')
    .select(`
      *,
      companies(name),
      plan_assignments(profiles(full_name))
    `)

  if (planError) {
    console.error('Planları çəkərkən xəta:', planError)
    return <div>Planları yükləmək mümkün olmadı.</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Audit Planları
        </h1>
      </div>

      {(role === 'admin' || role === 'rehber' || role === 'audit_muavini') && (
        <CreatePlanForm
          companies={companies || []}
          auditors={assignableUsers}
          templates={templates || []}
        />
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Cari Planlar ({plans?.length || 0})
        </h2>

        <div className="grid gap-3">
          {plans?.map((plan: any) => (
            <div
              key={plan.id}
              className="bg-white p-4 rounded-lg border flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:shadow-sm transition"
            >
              <div>
                <p className="font-bold text-slate-800">{plan.title}</p>

                <p className="text-sm text-slate-500">
                  {plan.department || '-'} • {plan.companies?.name || '-'}
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-1">
                    Status: {plan.status || 'planlanan'}
                  </span>

                  <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-1">
                    Score: {plan.score ?? 0}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-4 md:text-right">
                <div className="text-sm text-slate-400 md:mr-2">
                  <p>Son: {plan.due_date || '-'}</p>

                  <p className="font-medium text-slate-700">
                    {plan.plan_assignments?.length > 0
                      ? plan.plan_assignments
                          .map((a: any) => a.profiles?.full_name)
                          .filter(Boolean)
                          .join(', ')
                      : 'Təyin olunmayıb'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/plans/${plan.id}`}
                    className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition"
                  >
                    Bax
                  </Link>

                  <Link
                    href={`/dashboard/plans/${plan.id}/fill`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                  >
                    Auditi Doldur
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {(!plans || plans.length === 0) && (
            <div className="bg-white border rounded-lg p-6 text-center text-slate-500">
              Hələ audit planı yoxdur.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
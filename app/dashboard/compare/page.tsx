import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CompareAuditForm from '@/components/audit/compare-audit-form'

export default async function ComparePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: plans, error } = await supabase
    .from('audit_plans')
    .select('id, title, department, status, score, created_at, companies(name)')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Auditlər yüklənərkən xəta: {error.message}
      </div>
    )
  }

  const normalizedPlans = (plans || []).map((plan: any) => ({
    ...plan,
    companies: Array.isArray(plan.companies)
      ? plan.companies[0] || null
      : plan.companies || null,
  }))

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="border-b pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Audit Müqayisəsi
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          İki audit seçərək score, risk və checklist nəticələrini müqayisə edin.
        </p>
      </div>

      <CompareAuditForm plans={normalizedPlans} />
    </div>
  )
}
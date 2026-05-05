import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import TemplateEditForm from '@/components/admin/template-edit-form'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TemplateEditPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .maybeSingle()

const role = String(profile?.role || '').toLowerCase()
const canManageTemplates = ['admin', 'rehber', 'audit_muavini'].includes(role)

if (!profile || !canManageTemplates) {
  return (
    <div className="p-4 text-red-600 sm:p-6 lg:p-8">
      Bu səhifəyə giriş icazəniz yoxdur.
    </div>
  )
}
  const { data: template, error } = await supabase
    .from('audit_templates')
    .select(`
      id,
      title,
      template_sections(
        id,
        title,
        sort_order,
        template_questions(
          id,
          question_text,
          input_type,
          sort_order,
          max_score
        )
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Şablon yüklənərkən xəta: {error.message}
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Şablon tapılmadı və ya giriş icazəniz yoxdur.
      </div>
    )
  }

  const { data: usedPlans } = await supabase
    .from('audit_plans')
    .select('id, title, status')
    .eq('template_id', id)
    .order('created_at', { ascending: false })

  const sections = [...(template.template_sections || [])]
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((section: any) => ({
      ...section,
      questions: [...(section.template_questions || [])].sort(
        (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
      ),
    }))

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href={`/dashboard/admin/templates/${id}`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Şablon preview səhifəsinə qayıt
          </Link>

          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Şablonu redaktə et
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Şablon adı, bölmə adları və sual məlumatlarını yeniləyin.
          </p>
        </div>

        <Link
          href="/dashboard/admin/templates"
          className="inline-flex w-full justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          Bütün şablonlar
        </Link>
      </div>

      {(usedPlans?.length || 0) > 0 && (
        <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 shadow-sm sm:p-5">
          <h2 className="font-bold">Diqqət: bu şablon istifadə olunub</h2>

          <p className="mt-2 text-sm leading-6">
            Bu şablon {usedPlans?.length || 0} audit planında istifadə olunub.
            Sualları və bölmələri dəyişmək həmin auditlərin checklist
            görünüşünə təsir edə bilər.
          </p>

          <div className="mt-4 rounded-xl border border-yellow-200 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase text-yellow-700">
              İstifadə olunan audit planları
            </p>

            <div className="mt-2 space-y-2">
              {usedPlans?.slice(0, 5).map((plan: any) => (
                <Link
                  key={plan.id}
                  href={`/dashboard/plans/${plan.id}`}
                  className="block rounded-lg border border-yellow-100 bg-white px-3 py-2 text-sm transition hover:bg-yellow-50"
                >
                  <span className="font-semibold">{plan.title}</span>
                  <span className="ml-2 text-xs text-yellow-700">
                    {plan.status || '-'}
                  </span>
                </Link>
              ))}
            </div>

            {(usedPlans?.length || 0) > 5 && (
              <p className="mt-2 text-xs text-yellow-700">
                və daha {usedPlans!.length - 5} plan...
              </p>
            )}
          </div>
        </section>
      )}

      <TemplateEditForm
        template={{
          id: template.id,
          title: template.title,
          sections,
        }}
      />
    </div>
  )
}
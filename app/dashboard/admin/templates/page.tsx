import TemplateBuilder from '@/components/admin/template-builder'
import TemplateDeleteButton from '@/components/admin/template-delete-button'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function TemplatesPage() {
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

  if (!profile || !['admin', 'rehber', 'audit_muavini'].includes(profile.role)) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Bu səhifəyə giriş icazəniz yoxdur.
      </div>
    )
  }

  const { data: templates, error } = await supabase
    .from('audit_templates')
    .select(`
      id,
      title,
      created_at,
      template_sections(
        id,
        title,
        template_questions(id)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Şablonlar yüklənərkən xəta: {error.message}
      </div>
    )
  }

  const templateList = templates || []

  const totalSections = templateList.reduce(
    (sum: number, template: any) => sum + (template.template_sections?.length || 0),
    0
  )

  const totalQuestions = templateList.reduce((sum: number, template: any) => {
    const count =
      template.template_sections?.reduce(
        (sectionSum: number, section: any) =>
          sectionSum + (section.template_questions?.length || 0),
        0
      ) || 0

    return sum + count
  }, 0)

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/dashboard/plans"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Audit planlarına qayıt
          </Link>

          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Audit Şablonları
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Audit checklist-ləri üçün şablonlar yaradın, bölmələr və suallar
            əlavə edin.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex w-full justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          Dashboard
        </Link>
      </div>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Şablon sayı</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {templateList.length}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">Bölmə sayı</p>
          <p className="mt-2 text-3xl font-black text-blue-700">
            {totalSections}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Sual sayı</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">
            {totalQuestions}
          </p>
        </div>
      </section>

       <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 border-b pb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Yeni Audit Şablonu Yarat
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Şablon adı, bölmələr və suallar daxil edin. Sonra bu şablonu audit
            planında seçə bilərsiniz.
          </p>
        </div>

        <TemplateBuilder />
      </section>



      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Mövcud Şablonlar ({templateList.length})
            </h2>
            <p className="text-sm text-slate-500">
              Yaradılmış audit şablonları və onların struktur xülasəsi
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4">
          {templateList.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Hələ şablon yoxdur.
            </div>
          )}

          {templateList.map((template: any) => {
            const sectionCount = template.template_sections?.length || 0
            const questionCount =
              template.template_sections?.reduce(
                (sum: number, section: any) =>
                  sum + (section.template_questions?.length || 0),
                0
              ) || 0

            return (
              <article
                key={template.id}
                className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/20 sm:p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-extrabold text-slate-900">
                      {template.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Yaradılma tarixi:{' '}
                      {template.created_at
                        ? new Date(template.created_at).toLocaleDateString('az-AZ')
                        : '-'}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase text-slate-500">
                          Bölmə
                        </p>
                        <p className="mt-1 text-2xl font-black text-slate-900">
                          {sectionCount}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase text-slate-500">
                          Sual
                        </p>
                        <p className="mt-1 text-2xl font-black text-slate-900">
                          {questionCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-start sm:justify-end">
                    <Link
                      href={`/dashboard/admin/templates/${template.id}`}
                      className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                    >
                      Bax
                    </Link>

                    <TemplateDeleteButton templateId={template.id} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

     
    </div>
  )
}
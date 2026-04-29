import TemplateDeleteButton from '@/components/admin/template-delete-button'
import TemplateCreateModal from '@/components/admin/template-create-modal'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowLeft,
  ClipboardList,
  Eye,
  FileText,
  Layers3,
  ListChecks,
} from 'lucide-react'

function formatDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('az-AZ')
}

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
    (sum: number, template: any) =>
      sum + (template.template_sections?.length || 0),
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/dashboard/plans"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
              >
                <ArrowLeft size={16} />
                Audit planlarına qayıt
              </Link>

            

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Audit Şablonları
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Audit checklist-ləri üçün şablonlar yaradın, bölmələr və
                suallar əlavə edin.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <TemplateCreateModal />

              <Link
                href="/dashboard/plans"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                <ClipboardList size={16} />
                Planlara bax
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-500">Şablon sayı</p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {templateList.length}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <FileText size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-blue-700">Bölmə sayı</p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {totalSections}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                <Layers3 size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-emerald-700">Sual sayı</p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {totalQuestions}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <ListChecks size={20} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Mövcud Şablonlar
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {templateList.length} şablon göstərilir.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {templateList.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center sm:col-span-2 xl:col-span-3">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
                  <FileText size={22} />
                </div>

                <h3 className="mt-4 font-black text-slate-900">
                  Hələ şablon yoxdur
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Yeni şablon yaratdıqdan sonra burada görünəcək.
                </p>
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
                  className="flex min-h-[230px] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex h-full flex-col gap-5">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-lg font-black text-slate-950">
                        {template.title}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Yaradılma tarixi: {formatDate(template.created_at)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase text-slate-500">
                          Bölmə
                        </p>
                        <p className="mt-1 text-2xl font-black text-slate-950">
                          {sectionCount}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase text-slate-500">
                          Sual
                        </p>
                        <p className="mt-1 text-2xl font-black text-slate-950">
                          {questionCount}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex w-full flex-col gap-2 sm:flex-row">
                      <Link
                        href={`/dashboard/admin/templates/${template.id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye size={16} />
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
    </div>
  )
}
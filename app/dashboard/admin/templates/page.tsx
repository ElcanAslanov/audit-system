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
      <div className="p-8 text-red-600">
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
      <div className="p-8 text-red-600">
        Şablonlar yüklənərkən xəta: {error.message}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="border-b pb-6">
        <h1 className="text-2xl font-bold">Audit Şablonları</h1>
        <p className="text-slate-500 mt-2">
          Şablon yaradın, bölmələr və suallar əlavə edin.
        </p>
      </div>

      <section className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Yeni Audit Şablonu Yarat</h2>
        <TemplateBuilder />
      </section>

      <section className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">
          Mövcud Şablonlar ({templates?.length || 0})
        </h2>

        <div className="space-y-3">
          {(!templates || templates.length === 0) && (
            <p className="text-slate-500">Hələ şablon yoxdur.</p>
          )}

          {templates?.map((template: any) => {
            const sectionCount = template.template_sections?.length || 0
            const questionCount =
              template.template_sections?.reduce(
                (sum: number, section: any) =>
                  sum + (section.template_questions?.length || 0),
                0
              ) || 0

            return (
              <div
                key={template.id}
                className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-slate-900">
                    {template.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Bölmə: {sectionCount} • Sual: {questionCount}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-start sm:justify-end">
                  <Link
                    href={`/dashboard/admin/templates/${template.id}`}
                    className="w-full sm:w-auto text-center text-sm border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-md"
                  >
                    Bax
                  </Link>

                  <TemplateDeleteButton templateId={template.id} />
                </div>
              </div>
            )
          })}
        </div>
      </section>


    </div>
  )
}
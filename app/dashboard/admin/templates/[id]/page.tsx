import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: template, error } = await supabase
    .from('audit_templates')
    .select(`
      id,
      title,
      created_at,
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
    .single()

  if (error || !template) {
    return <div className="p-8 text-red-600">Şablon tapılmadı.</div>
  }

  const sections = [...(template.template_sections || [])].sort(
    (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
  )

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="border-b pb-6">
        <Link
          href="/dashboard/admin/templates"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Şablonlara qayıt
        </Link>

        <h1 className="text-2xl font-bold mt-3">{template.title}</h1>

        <p className="text-slate-500 mt-2">
          Bu səhifə şablonun preview görünüşüdür.
        </p>
      </div>

      <div className="space-y-4">
        {sections.length === 0 && (
          <p className="text-slate-500">Bu şablonda bölmə yoxdur.</p>
        )}

        {sections.map((section: any) => {
          const questions = [...(section.template_questions || [])].sort(
            (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
          )

          return (
            <section key={section.id} className="bg-white border rounded-xl p-5">
              <h2 className="text-lg font-bold">{section.title}</h2>

              <div className="mt-4 space-y-3">
                {questions.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Bu bölmədə sual yoxdur.
                  </p>
                )}

                {questions.map((q: any, index: number) => (
                  <div key={q.id} className="border rounded-lg p-3">
                    <p className="font-medium">
                      {index + 1}. {q.question_text}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      Tip: {q.input_type || 'yes_no'} • Max score:{' '}
                      {q.max_score ?? 10}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
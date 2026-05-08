import {createClient} from '@/lib/supabase/server'
import {Link} from '@/i18n/routing'
import {redirect} from 'next/navigation'
import {getTranslations} from 'next-intl/server'

type PageProps = {
  params: Promise<{id: string}>
}

export default async function TemplateDetailPage({params}: PageProps) {
  const t = await getTranslations('templateDetail')
  const {id} = await params
  const supabase = await createClient()

  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const {data: profile} = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = String(profile?.role || '').toLowerCase()
  const canViewTemplates = [
    'admin',
    'rehber',
    'audit_muavini',
    'musahideci',
  ].includes(role)
  const canManageTemplates = ['admin', 'rehber', 'audit_muavini'].includes(role)

  if (!profile || !canViewTemplates) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        {t('noPermission')}
      </div>
    )
  }

  const {data: template, error} = await supabase
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
    .maybeSingle()

  if (error) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        {t('loadError', {message: error.message})}
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        {t('notFound')}
      </div>
    )
  }

  const sections = [...(template.template_sections || [])].sort(
    (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
  )

  const questionCount = sections.reduce(
    (sum: number, section: any) =>
      sum + (section.template_questions?.length || 0),
    0
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/dashboard/admin/templates"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← {t('backToTemplates')}
          </Link>

          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {template.title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {canManageTemplates && (
            <Link
              href={`/dashboard/admin/templates/${id}/edit`}
              className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
            >
              {t('edit')}
            </Link>
          )}

          <Link
            href="/dashboard/admin/templates"
            className="inline-flex w-full justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            {t('allTemplates')}
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            {t('sectionCount')}
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {sections.length}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">
            {t('questionCount')}
          </p>
          <p className="mt-2 text-3xl font-black text-blue-700">
            {questionCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">
            {t('createdAt')}
          </p>
          <p className="mt-2 text-lg font-black text-emerald-700">
            {template.created_at
              ? new Date(template.created_at).toLocaleDateString('az-AZ')
              : '-'}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        {sections.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            {t('noSections')}
          </div>
        )}

        {sections.map((section: any, sectionIndex: number) => {
          const questions = [...(section.template_questions || [])].sort(
            (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
          )

          return (
            <article
              key={section.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    {t('sectionNumber', {number: sectionIndex + 1})}
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                    {section.title || t('untitledSection')}
                  </h2>
                </div>

                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {t('questionsCount', {count: questions.length})}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {questions.length === 0 && (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    {t('noQuestions')}
                  </p>
                )}

                {questions.map((q: any, questionIndex: number) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">
                          {t('questionNumber', {number: questionIndex + 1})}
                        </p>

                        <p className="mt-1 font-semibold leading-6 text-slate-900">
                          {q.question_text}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          {q.input_type || 'yes_no'}
                        </span>

                        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          {t('max')}: {q.max_score ?? 10}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FindingStatusSelect from '@/components/audit/finding-status-select'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AuditDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

const { data: plan, error: planError } = await supabase
  .from('audit_plans')
  .select(`
    *,
    companies(name),
    audit_templates(id, title)
  `)
  .eq('id', id)
  .maybeSingle()

 if (planError) {
  return (
    <div className="p-8 text-red-600">
      Audit yüklənərkən xəta: {planError.message}
    </div>
  )
}

if (!plan) {
  return (
    <div className="p-8 text-red-600">
      Audit tapılmadı və ya bu rolda baxış icazəsi yoxdur.
    </div>
  )
}

  const { data: answers } = await supabase
    .from('audit_answers')
    .select(`
      id,
      response,
      comment,
      score,
      question_id,
      template_questions(question_text, max_score)
    `)
    .eq('plan_id', id)

  const { data: findings } = await supabase
    .from('findings')
    .select(`
      id,
      title,
      severity,
      description,
      deadline,
      status,
      assigned_to,
      profiles(full_name)
    `)
    .eq('plan_id', id)

  const statusLabel =
    plan.status === 'tamamlandi'
      ? 'Tamamlandı'
      : plan.status === 'needs_attention'
        ? 'Diqqət tələb edir'
        : plan.status || 'Planlanan'

  const severityClass = (severity?: string | null) => {
    if (severity === 'high') return 'bg-red-50 text-red-700 border-red-200'
    if (severity === 'medium') return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    return 'bg-green-50 text-green-700 border-green-200'
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b pb-6">
        <div>
          <Link
            href="/dashboard/plans"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Audit planlarına qayıt
          </Link>

          <h1 className="text-3xl font-bold text-slate-900 mt-3">
            {plan.title}
          </h1>

          <p className="text-slate-500 mt-2">
            Şablon: {plan.audit_templates?.title || '-'} • Şirkət:{' '}
            {plan.companies?.name || '-'}
          </p>
        </div>

        <div className="text-left md:text-right space-y-2">
          <div className="inline-flex rounded-full border px-3 py-1 text-sm font-medium bg-slate-50 text-slate-700">
            {statusLabel}
          </div>

          <div className="text-3xl font-bold text-blue-700">
            {plan.score ?? 0}%
          </div>

        <div className="flex flex-col sm:flex-row gap-2">
  <Link
    href={`/dashboard/plans/${id}/fill`}
    className="inline-flex justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
  >
    Auditi redaktə et
  </Link>

  <Link
    href={`/dashboard/plans/${id}/report`}
    className="inline-flex justify-center bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm"
  >
    PDF Hesabat
  </Link>
</div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Status</p>
          <p className="font-bold mt-1">{statusLabel}</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Score</p>
          <p className="font-bold mt-1">{plan.score ?? 0}%</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Deadline</p>
          <p className="font-bold mt-1">{plan.due_date || '-'}</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Tapıntı sayı</p>
          <p className="font-bold mt-1">{findings?.length || 0}</p>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Departament</p>
            <p className="font-medium">{plan.department || '-'}</p>
          </div>

          <div>
            <p className="text-slate-500">Yaradan</p>
            <p className="font-medium">{plan.created_by || '-'}</p>
          </div>

          <div className="md:col-span-2">
            <p className="text-slate-500">Qeydlər</p>
            <p className="font-medium whitespace-pre-wrap">
              {plan.notes || '-'}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Checklist</h2>

        <div className="space-y-3">
          {(answers || []).length === 0 && (
            <p className="text-slate-500">Hələ cavab yoxdur.</p>
          )}

          {(answers || []).map((answer: any) => (
            <div key={answer.id} className="border rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <p className="font-semibold">
                  {answer.template_questions?.question_text || 'Sual'}
                </p>

                <div className="text-sm font-bold text-blue-700">
                  {answer.score ?? 0} / {answer.template_questions?.max_score ?? '-'}
                </div>
              </div>

              <p className="text-sm mt-2">
                Cavab:{' '}
                <span className="font-medium uppercase">
                  {answer.response || '-'}
                </span>
              </p>

              {answer.comment && (
                <p className="text-sm text-slate-600 mt-2">
                  Şərh: {answer.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Findings</h2>

        <div className="space-y-3">
          {(findings || []).length === 0 && (
            <p className="text-slate-500">Tapıntı yoxdur.</p>
          )}

          {(findings || []).map((finding: any) => (
            <div key={finding.id} className="border rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 className="font-bold">{finding.title}</h3>

                <span
                  className={`inline-flex border rounded-full px-3 py-1 text-xs font-semibold ${severityClass(
                    finding.severity
                  )}`}
                >
                  {finding.severity || 'low'}
                </span>
              </div>

              <p className="text-sm text-slate-600 mt-2">
                {finding.description || '-'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
             <div>
  <p className="text-slate-500 mb-1">Status:</p>
  <FindingStatusSelect
    findingId={finding.id}
    planId={id}
    currentStatus={finding.status}
  />
</div>

                <p>
                  <span className="text-slate-500">Deadline:</span>{' '}
                  {finding.deadline || '-'}
                </p>

                <p>
                  <span className="text-slate-500">Cavabdeh:</span>{' '}
                  {finding.profiles?.full_name || '-'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Files</h2>

        {plan.file_url ? (
          <p className="text-sm">
            Fayl path:{' '}
            <span className="font-mono bg-slate-100 px-2 py-1 rounded">
              {plan.file_url}
            </span>
          </p>
        ) : (
          <p className="text-slate-500">Fayl əlavə olunmayıb.</p>
        )}
      </section>
    </div>
  )
}
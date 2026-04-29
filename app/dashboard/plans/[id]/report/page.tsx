import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PrintReportButton from '@/components/audit/print-report-button'

type PageProps = {
  params: Promise<{ id: string }>
}

function answerLabel(value?: string | null) {
  if (value === 'yes') return 'Bəli'
  if (value === 'no') return 'Xeyr'
  if (value === 'na') return 'N/A'
  return '-'
}

function answerBadgeClass(value?: string | null) {
  if (value === 'yes') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (value === 'no') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'na') return 'border-slate-200 bg-slate-50 text-slate-600'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function riskBadgeClass(value?: string | null) {
  if (value === 'high') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'medium') return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function statusLabel(value?: string | null) {
  if (value === 'tamamlandi') return 'Tamamlandı'
  if (value === 'needs_attention') return 'Diqqət tələb edir'
  if (value === 'planlanan') return 'Planlanan'
  return value || '-'
}

export default async function AuditReportPage({ params }: PageProps) {
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
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Hesabat yüklənərkən xəta: {planError.message}
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Audit tapılmadı və ya bu hesabatı görmək icazəniz yoxdur.
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
      status
    `)
    .eq('plan_id', id)

  const highFindings =
    findings?.filter((f: any) => f.severity === 'high').length || 0

  const mediumFindings =
    findings?.filter((f: any) => f.severity === 'medium').length || 0

  const lowFindings =
    findings?.filter((f: any) => f.severity === 'low').length || 0

  const totalQuestions = answers?.length || 0
  const negativeAnswers =
    answers?.filter((a: any) => a.response === 'no').length || 0

  const score = Number(plan.score || 0)

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 lg:p-8 print:min-h-0 print:bg-white print:p-0">
      {/* Bu hissə print/PDF-ə düşməyəcək */}
      <div className="mx-auto mb-4 flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link
          href={`/dashboard/plans/${id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Audit detail səhifəsinə qayıt
        </Link>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500 sm:text-sm">
            PDF üçün düyməyə basın və “Save as PDF” seçin.
          </p>

          <PrintReportButton />
        </div>
      </div>

      {/* Yalnız bu report-area print/PDF-ə düşəcək */}
      <main id="audit-report-print-area" className="mx-auto max-w-5xl print:m-0 print:max-w-none">
        <article className="print-report overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm print:w-full print:rounded-none print:border-0 print:shadow-none">
          {/* Cover / Header */}
          <section className="print-section relative overflow-hidden bg-slate-950 px-5 py-8 text-white sm:px-8 lg:px-10 print:px-8 print:py-7">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-blue-600/30" />
            <div className="absolute bottom-0 right-16 h-20 w-20 rounded-t-full bg-emerald-500/20" />

            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between print:flex-row">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">
                  Audit Hesabatı
                </p>

                <h1 className="mt-3 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl print:text-3xl">
                  {plan.title}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Bu hesabat audit nəticələrinin, checklist cavablarının və
                  tapıntıların ümumi xülasəsini təqdim edir.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-left backdrop-blur sm:min-w-40 sm:text-right print:min-w-40 print:text-right">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Ümumi Score
                </p>

                <p className="mt-1 text-4xl font-black text-white">
                  {score}%
                </p>

                <p className="mt-1 text-xs text-slate-300">
                  {statusLabel(plan.status)}
                </p>
              </div>
            </div>
          </section>

          <div className="space-y-8 p-5 sm:p-8 lg:p-10 print:p-8">
            {/* Meta info */}
            <section className="print-section grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Şirkət
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {plan.companies?.name || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Departament
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {plan.department || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Şablon
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {plan.audit_templates?.title || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Son tarix
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {plan.due_date || '-'}
                </p>
              </div>
            </section>

            {/* KPI cards */}
            <section className="print-section">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Nəticə xülasəsi
                  </h2>
                  <p className="text-sm text-slate-500">
                    Audit performansı və risk göstəriciləri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
                <div className="print-card rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-semibold text-blue-700">Score</p>
                  <p className="mt-2 text-3xl font-black text-blue-800">
                    {score}%
                  </p>
                </div>

                <div className="print-card rounded-2xl border border-red-100 bg-red-50 p-5">
                  <p className="text-sm font-semibold text-red-700">
                    High Risk
                  </p>
                  <p className="mt-2 text-3xl font-black text-red-700">
                    {highFindings}
                  </p>
                </div>

                <div className="print-card rounded-2xl border border-yellow-100 bg-yellow-50 p-5">
                  <p className="text-sm font-semibold text-yellow-700">
                    Medium Risk
                  </p>
                  <p className="mt-2 text-3xl font-black text-yellow-700">
                    {mediumFindings}
                  </p>
                </div>

                <div className="print-card rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm font-semibold text-emerald-700">
                    Low Risk
                  </p>
                  <p className="mt-2 text-3xl font-black text-emerald-700">
                    {lowFindings}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2">
                <div className="print-card rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Checklist sual sayı</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {totalQuestions}
                  </p>
                </div>

                <div className="print-card rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Problemli cavablar</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {negativeAnswers}
                  </p>
                </div>
              </div>
            </section>

            {/* Notes */}
            {plan.notes && (
              <section className="print-card break-inside-avoid rounded-2xl border border-slate-200 p-5">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Ümumi qeydlər
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {plan.notes}
                </p>
              </section>
            )}

            {/* Checklist */}
            <section className="print-section">
              <div className="mb-4">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Checklist cavabları
                </h2>
                <p className="text-sm text-slate-500">
                  Suallar üzrə cavab və bal bölgüsü
                </p>
              </div>

              {(answers || []).length === 0 ? (
                <p className="rounded-xl border border-slate-200 p-4 text-slate-500">
                  Cavab yoxdur.
                </p>
              ) : (
                <div className="overflow-visible rounded-2xl border border-slate-200">
                  <div className="hidden bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 sm:grid sm:grid-cols-12 print:grid">
                    <div className="col-span-6">Sual</div>
                    <div className="col-span-2">Cavab</div>
                    <div className="col-span-2">Bal</div>
                    <div className="col-span-2">Şərh</div>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {(answers || []).map((answer: any, index: number) => (
                      <div
                        key={answer.id}
                        className="print-table-row grid grid-cols-1 gap-3 break-inside-avoid p-4 sm:grid-cols-12 print:grid-cols-12"
                      >
                        <div className="sm:col-span-6 print:col-span-6">
                          <p className="text-xs font-bold text-slate-400">
                            #{index + 1}
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {answer.template_questions?.question_text || 'Sual'}
                          </p>
                        </div>

                        <div className="sm:col-span-2 print:col-span-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${answerBadgeClass(
                              answer.response
                            )}`}
                          >
                            {answerLabel(answer.response)}
                          </span>
                        </div>

                        <div className="sm:col-span-2 print:col-span-2">
                          <p className="font-bold text-blue-700">
                            {answer.score ?? 0} /{' '}
                            {answer.template_questions?.max_score ?? '-'}
                          </p>
                        </div>

                        <div className="sm:col-span-2 print:col-span-2">
                          <p className="text-sm leading-5 text-slate-600">
                            {answer.comment || '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Findings */}
            <section className="print-section">
              <div className="mb-4">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Tapıntılar
                </h2>
                <p className="text-sm text-slate-500">
                  Risklər, izahlar və icra statusları
                </p>
              </div>

              {(findings || []).length === 0 ? (
                <p className="rounded-xl border border-slate-200 p-4 text-slate-500">
                  Tapıntı yoxdur.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {(findings || []).map((finding: any, index: number) => (
                    <div
                      key={finding.id}
                      className="print-card break-inside-avoid rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:flex-row">
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">
                            Tapıntı #{index + 1}
                          </p>
                          <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                            {finding.title}
                          </h3>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase ${riskBadgeClass(
                            finding.severity
                          )}`}
                        >
                          {finding.severity || 'low'}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {finding.description || '-'}
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3 print:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase text-slate-500">
                            Status
                          </p>
                          <p className="font-bold text-slate-900">
                            {finding.status || '-'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase text-slate-500">
                            Deadline
                          </p>
                          <p className="font-bold text-slate-900">
                            {finding.deadline || '-'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase text-slate-500">
                            Risk
                          </p>
                          <p className="font-bold text-slate-900">
                            {finding.severity || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Signature */}
            <section className="print-section grid grid-cols-1 gap-6 border-t border-slate-200 pt-8 sm:grid-cols-2 print:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Auditor imzası
                </p>
                <div className="mt-10 border-t border-slate-300 pt-2 text-xs text-slate-500">
                  Ad, soyad və imza
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Rəhbər təsdiqi
                </p>
                <div className="mt-10 border-t border-slate-300 pt-2 text-xs text-slate-500">
                  Ad, soyad və imza
                </div>
              </div>
            </section>

            <footer className="border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
              Hesabat sistem tərəfindən yaradılıb.
            </footer>
          </div>
        </article>
      </main>
    </div>
  )
}
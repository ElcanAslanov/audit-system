import { createClient } from '@/lib/supabase/server'
import DepartmentActions from '@/components/department-actions'
import AddDepartmentModal from '@/components/add-department-modal'
import { Building2, CalendarDays, Factory, Layers3 } from 'lucide-react'

function formatDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('az-AZ')
}

function normalizeOne(value: any) {
  return Array.isArray(value) ? value[0] || null : value || null
}

export default async function DepartmentsPage() {
  const supabase = await createClient()

  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name')
    .order('name', { ascending: true })

  if (companiesError) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Şirkətlər yüklənərkən xəta: {companiesError.message}
      </div>
    )
  }

  const { data: departments, error } = await supabase
    .from('departments')
    .select(`
      id,
      name,
      company_id,
      created_at,
      companies(id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Departamentlər yüklənərkən xəta: {error.message}
      </div>
    )
  }

  const departmentList = (departments || []).map((department: any) => ({
    ...department,
    companies: normalizeOne(department.companies),
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Departament idarəetməsi
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Departamentlər
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Şirkətlərə bağlı departamentləri əlavə edin, redaktə edin və
                siyahını idarə edin.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <AddDepartmentModal companies={companies || []} />

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white">
                    <Factory size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Ümumi departament
                    </p>
                    <p className="text-2xl font-black text-slate-950">
                      {departmentList.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Departament siyahısı
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {departmentList.length} departament göstərilir.
              </p>
            </div>
          </div>

          {departmentList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
                <Layers3 size={22} />
              </div>
              <h3 className="mt-4 font-black text-slate-900">
                Departament yoxdur
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Yeni departament əlavə etdikdən sonra burada görünəcək.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {departmentList.map((department: any) => (
                <article
                  key={department.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                      <Layers3 size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-black text-slate-950">
                        {department.name}
                      </h3>

                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <Building2 size={15} />
                        Şirkət: {department.companies?.name || '-'}
                      </p>

                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays size={15} />
                        Qeydiyyat: {formatDate(department.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <DepartmentActions
                      department={{
                        id: department.id,
                        name: department.name,
                        company_id: department.company_id,
                      }}
                      companies={companies || []}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
import { createClient } from '@/lib/supabase/server'
import AddCompanyForm from '@/components/add-company-form'
import { Building2 } from 'lucide-react'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase.from('companies').select('*')

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Şirkətlər</h1>
        <p className="text-slate-500 mt-2">Sistemə daxil olan şirkətlərin siyahısı.</p>
      </div>

      <AddCompanyForm />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-700">Şirkət Adı</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Qeydiyyat Tarixi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies?.map((company: any) => (
              <tr key={company.id} className="hover:bg-slate-50 transition">
                <td className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Building2 size={16} />
                  </div>
                  {company.name}
                </td>
                <td className="p-4 text-right text-slate-500 text-sm">
                  {new Date(company.created_at).toLocaleDateString('az-AZ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
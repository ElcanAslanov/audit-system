import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { Filter, Search } from 'lucide-react'

type Props = {
  q: string
  status: string
  companyId: string
}

export default async function PlansFilterSection({
  q,
  status,
  companyId,
}: Props) {
  const t = await getTranslations('plans')
  const common = await getTranslations('common')
  const supabase = await createClient()

  const { data: companiesData } = await supabase
    .from('companies')
    .select('id, name')
    .order('name', { ascending: true })

  const companies = companiesData || []

  const selectedCompany = companies.find(
    (company: any) => String(company.id) === String(companyId)
  )

  const hasFilters = Boolean(q || status || companyId)

  const statusLabel = (value?: string | null) => {
    if (value === 'tamamlandi') return t('completed')
    if (value === 'needs_attention') return t('needsAttention')
    if (value === 'planlanan') return t('planned')
    return value || '-'
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Filter size={17} className="text-slate-500" />
            <h2 className="text-lg font-black text-slate-950">
              {t('filters')}
            </h2>
          </div>
        </div>

        {hasFilters && (
          <Link
            href="/dashboard/plans"
            className="text-sm font-bold text-blue-600 hover:underline"
          >
            {t('clearFilters')}
          </Link>
        )}
      </div>

      <form className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <label className="mb-1 block text-sm font-bold text-slate-700">
            {common('search')}
          </label>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <label className="mb-1 block text-sm font-bold text-slate-700">
            {common('status')}
          </label>

          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            <option value="">{t('statusAll')}</option>
            <option value="planlanan">{t('planned')}</option>
            <option value="tamamlandi">{t('completed')}</option>
            <option value="needs_attention">{t('needsAttention')}</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="mb-1 block text-sm font-bold text-slate-700">
            {common('company')}
          </label>

          <select
            name="company_id"
            defaultValue={companyId}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            <option value="">{t('companyAll')}</option>

            {companies.map((company: any) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end lg:col-span-2">
          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            {common('filter')}
          </button>
        </div>
      </form>

      {hasFilters && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {q && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
              {common('search')}: {q}
            </span>
          )}

          {status && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700">
              {common('status')}: {statusLabel(status)}
            </span>
          )}

          {companyId && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
              {common('company')}: {selectedCompany?.name || companyId}
            </span>
          )}
        </div>
      )}
    </section>
  )
}
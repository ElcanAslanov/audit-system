import { createClient } from '@/lib/supabase/server'
import UserTable from '@/components/user-table'
import AddUserModal from '@/components/add-user-modal'
import { redirect } from 'next/navigation'
import { ShieldCheck, Users, Building2 } from 'lucide-react'

export default async function AdminPage() {
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

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true })

  const userList = users || []
  const companyList = companies || []

  const adminCount = userList.filter((u: any) => u.role === 'admin').length
  const auditorCount = userList.filter((u: any) => u.role === 'auditor').length

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Sistem idarəetməsi
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Admin Paneli
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                İstifadəçiləri yaradın, rolları və şirkət bağlantılarını idarə
                edin.
              </p>
            </div>

            <AddUserModal companies={companyList} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  İstifadəçi sayı
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {userList.length}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <Users size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-blue-700">Admin</p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {adminCount}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                <ShieldCheck size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-emerald-700">Auditor</p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {auditorCount}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Building2 size={20} />
              </div>
            </div>
          </div>
        </section>

        <UserTable users={userList} companies={companyList} />
      </div>
    </div>
  )
}
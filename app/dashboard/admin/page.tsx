import { createClient } from '@/lib/supabase/server'
import UserTable from '@/components/user-table'
import AddUserForm from '@/components/add-user-form'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // İstifadəçiləri və Şirkətləri çəkirik
  const { data: users } = await supabase.from('profiles').select('*')
  const { data: companies } = await supabase.from('companies').select('*')

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-extrabold mb-8">Admin Paneli</h1>
      
      <AddUserForm companies={companies || []} />
      
      <UserTable users={users || []} companies={companies || []} />
    </div>
  )
}
'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'


// Yeni istifadəçi yaratma
export async function createUser(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const role = formData.get('role') as string
  const company_id = formData.get('company_id') as string

  // 1. Auth-da istifadəçini yarat
  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name }
  })

  if (authError) return { error: authError.message }

  // 2. Profili yarat və ya mövcudsa yenilə (upsert)
  const { error: dbError } = await supabaseAdmin
    .from('profiles')
    .upsert({ 
      id: data.user.id, // Auth-dan gələn ID ilə profil ID-sini bağlayırıq
      role, 
      full_name, 
      company_id: company_id || null 
    })

  if (dbError) {
    // Profil yaradılmasa, Auth-dakı istifadəçini də silmək olar (isteğe bağlı)
    return { error: `Profil yaradılarkən xəta: ${dbError.message}` }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

// İstifadəçi profilini yeniləmə
export async function updateUserProfile(userId: string, data: { full_name: string, email: string, role: string, company_id: string }) {
  // 1. Auth email-ini yenilə (əgər dəyişibsə)
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email: data.email,
  })
  if (authError) return { error: authError.message }

  // 2. Profil məlumatlarını yenilə
  const { error: dbError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      full_name: data.full_name,
      role: data.role,
      company_id: data.company_id || null
    })
    .eq('id', userId)

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

// İstifadəçi silmə (KRİTİK: Auth və Profil eyni anda silinməlidir)
export async function deleteUser(userId: string) {
  // 1. Əvvəlcə Auth-dan silirik (bu avtomatik profilə də təsir edə bilər, əgər CASCADE varsa)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (authError) return { error: authError.message }

  // 2. Əgər CASCADE yoxdursa, profil cədvəlindən də əllə silirik
  await supabaseAdmin.from('profiles').delete().eq('id', userId)
  
  revalidatePath('/dashboard/admin')
  return { success: true }
}

// Rol yeniləmə
export async function updateUserRole(userId: string, newRole: string) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/admin')
  return { success: true }
}
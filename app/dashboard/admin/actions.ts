'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function cleanString(value: FormDataEntryValue | null) {
  return String(value || '').trim()
}

// Yeni istifadəçi yaratma
export async function createUser(prevState: any, formData: FormData) {
  const email = cleanString(formData.get('email')).toLowerCase()
  const password = cleanString(formData.get('password'))
  const full_name = cleanString(formData.get('full_name'))
  const role = cleanString(formData.get('role'))
  const company_id = cleanString(formData.get('company_id'))

  if (!full_name) {
    return { error: 'Ad soyad boş ola bilməz.' }
  }

  if (!email) {
    return { error: 'Email boş ola bilməz.' }
  }

  if (!password || password.length < 6) {
    return { error: 'Şifrə minimum 6 simvol olmalıdır.' }
  }

  if (!role) {
    return { error: 'Rol seçilməlidir.' }
  }

  // 1. Auth-da istifadəçini yarat
  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!data.user?.id) {
    return { error: 'Auth istifadəçi ID-si tapılmadı.' }
  }

  // 2. Profili yarat və ya mövcudsa yenilə
  const { error: dbError } = await supabaseAdmin.from('profiles').upsert({
    id: data.user.id,
    full_name,
    email,
    role,
    company_id: company_id || null,
  })

  if (dbError) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)

    return {
      error: `Profil yaradılarkən xəta: ${dbError.message}`,
    }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

// İstifadəçi profilini yeniləmə
export async function updateUserProfile(
  userId: string,
  data: {
    full_name: string
    email: string
    role: string
    company_id: string
    password?: string
  }
) {
  const full_name = String(data.full_name || '').trim()
  const email = String(data.email || '').trim().toLowerCase()
  const role = String(data.role || '').trim()
  const company_id = String(data.company_id || '').trim()
  const password = String(data.password || '').trim()

  if (!userId) {
    return { error: 'İstifadəçi ID tapılmadı.' }
  }

  if (!full_name) {
    return { error: 'Ad soyad boş ola bilməz.' }
  }

  if (!email) {
    return { error: 'Email boş ola bilməz.' }
  }

  if (!role) {
    return { error: 'Rol seçilməlidir.' }
  }

  // 1. Auth email və metadata yenilə
 const authUpdatePayload: {
  email: string
  user_metadata: { full_name: string }
  password?: string
} = {
  email,
  user_metadata: { full_name },
}

if (password) {
  if (password.length < 6) {
    return { error: 'Yeni şifrə minimum 6 simvol olmalıdır.' }
  }

  authUpdatePayload.password = password
}

const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
  userId,
  authUpdatePayload
)

  if (authError) {
    return { error: authError.message }
  }

  // 2. Profil məlumatlarını yenilə
  const { error: dbError } = await supabaseAdmin
    .from('profiles')
    .update({
      full_name,
      email,
      role,
      company_id: company_id || null,
    })
    .eq('id', userId)

  if (dbError) {
    return { error: dbError.message }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

// İstifadəçi silmə
export async function deleteUser(userId: string) {
  if (!userId) {
    return { error: 'İstifadəçi ID tapılmadı.' }
  }

  // Əvvəl profil silinsin ki, CASCADE yoxdursa problem qalmasın
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileError) {
    return { error: `Profil silinmədi: ${profileError.message}` }
  }

  // Sonra Auth user silinsin
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (authError) {
    return { error: authError.message }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

// Rol yeniləmə
export async function updateUserRole(userId: string, newRole: string) {
  const role = String(newRole || '').trim()

  if (!userId) {
    return { error: 'İstifadəçi ID tapılmadı.' }
  }

  if (!role) {
    return { error: 'Rol seçilməlidir.' }
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}
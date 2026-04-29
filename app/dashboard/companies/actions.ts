'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCompany(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const name = String(formData.get('name') || '').trim()

  if (!name) {
    return { error: 'Şirkət adı boş ola bilməz.' }
  }

  const { error } = await supabase.from('companies').insert([{ name }])

  if (error) {
    return { error: `Xəta: ${error.message}` }
  }

  revalidatePath('/dashboard/companies')
  return { success: true }
}

export async function updateCompany(companyId: string, formData: FormData) {
  const supabase = await createClient()

  const name = String(formData.get('name') || '').trim()

  if (!companyId) {
    return { error: 'Şirkət ID tapılmadı.' }
  }

  if (!name) {
    return { error: 'Şirkət adı boş ola bilməz.' }
  }

  const { error } = await supabase
    .from('companies')
    .update({ name })
    .eq('id', companyId)

  if (error) {
    return { error: `Şirkət yenilənmədi: ${error.message}` }
  }

  revalidatePath('/dashboard/companies')
  return { success: true }
}

export async function deleteCompany(companyId: string) {
  const supabase = await createClient()

  if (!companyId) {
    return { error: 'Şirkət ID tapılmadı.' }
  }

  const { count: planCount, error: planCheckError } = await supabase
    .from('audit_plans')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)

  if (planCheckError) {
    return {
      error: `Şirkət istifadəsi yoxlanılarkən xəta: ${planCheckError.message}`,
    }
  }

  if ((planCount || 0) > 0) {
    return {
      error:
        `Bu şirkət silinə bilməz, çünki ${planCount} audit planında istifadə olunur. ` +
        'Əvvəl həmin audit planlarını silin və ya başqa şirkətə keçirin.',
    }
  }

  const { error } = await supabase.from('companies').delete().eq('id', companyId)

  if (error) {
    return {
      error: `Şirkət silinə bilmədi: ${error.message}`,
    }
  }

  revalidatePath('/dashboard/companies')
  return { success: true }
}
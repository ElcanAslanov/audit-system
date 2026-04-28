'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCompany(prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string

  if (!name) return { error: 'Şirkət adı boş ola bilməz.' }

  const { error } = await supabase.from('companies').insert([{ name }])

  if (error) return { error: `Xəta: ${error.message}` }
  
  revalidatePath('/dashboard/companies')
  return { success: true }
}
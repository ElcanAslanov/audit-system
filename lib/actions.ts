// lib/actions.ts
'use server'

import { createClient } from '../lib/supabase/server'; // Bunu aşağıda izah edəcəyəm

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
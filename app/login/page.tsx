// app/login/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default function LoginPage() {
  
  async function signIn(formData: FormData) {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return redirect('/login?message=could-not-authenticate-user')
    }

    return redirect('/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form action={signIn} className="flex flex-col gap-4 p-8 border rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4">Daxil Ol</h1>
        
        <input 
          name="email" 
          placeholder="E-poçt" 
          required 
          className="p-2 border rounded"
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Şifrə" 
          required 
          className="p-2 border rounded"
        />
        
        <button 
          type="submit" 
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Giriş
        </button>
      </form>
    </div>
  )
}
import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
import {sendEmail} from '@/lib/send-email'

export async function GET() {
  const supabase = await createClient()

  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json(
      {error: 'Login olmuş istifadəçi email-i tapılmadı.'},
      {status: 401}
    )
  }

  const result = await sendEmail({
    to: user.email,
    subject: 'Audit Sistemi test email',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Audit Sistemi</h2>
        <p>Bu test emailidir.</p>
        <p>Email sistemi uğurla işləyirsə, bu mesajı görməlisiniz.</p>
      </div>
    `,
    text: 'Audit Sistemi test email. Email sistemi işləyir.',
  })

  if (!result.success) {
    return NextResponse.json(
      {error: result.error},
      {status: 500}
    )
  }

  return NextResponse.json({
    success: true,
  })
}
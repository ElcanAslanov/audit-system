import {NextRequest, NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
import {revalidatePath} from 'next/cache'
import {sendEmail} from '@/lib/send-email'

type RouteProps = {
  params: Promise<{id: string}>
}

function cleanText(value: unknown) {
  return String(value || '').trim()
}

export async function POST(req: NextRequest, {params}: RouteProps) {
  const {id} = await params
  const supabase = await createClient()

  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      {error: 'İstifadəçi tapılmadı.'},
      {status: 401}
    )
  }

  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json(
      {error: 'Sorğu məlumatları düzgün deyil.'},
      {status: 400}
    )
  }

  const message = cleanText(body.message)

  if (!message) {
    return NextResponse.json(
      {error: 'Cavab mətni daxil edilməlidir.'},
      {status: 400}
    )
  }

  const {data: parentComment, error: parentError} = await supabase
    .from('audit_comments')
    .select(`
      id,
      plan_id,
      answer_id,
      question_id,
      sender_id,
      recipient_id,
      status
    `)
    .eq('id', id)
    .maybeSingle()

  if (parentError) {
    return NextResponse.json(
      {error: parentError.message},
      {status: 500}
    )
  }

  if (!parentComment) {
    return NextResponse.json(
      {error: 'Sual/rəy tapılmadı.'},
      {status: 404}
    )
  }

  const isSender = parentComment.sender_id === user.id
  const isRecipient = parentComment.recipient_id === user.id

  if (!isSender && !isRecipient) {
    return NextResponse.json(
      {error: 'Bu suala cavab yazmaq icazəniz yoxdur.'},
      {status: 403}
    )
  }

  if (parentComment.status === 'closed') {
    return NextResponse.json(
      {error: 'Bu sual/rəy artıq bağlanıb.'},
      {status: 400}
    )
  }

  const nextRecipientId = isRecipient
    ? parentComment.sender_id
    : parentComment.recipient_id

  const {error: insertError} = await supabase
    .from('audit_comments')
    .insert([
      {
        plan_id: parentComment.plan_id,
        answer_id: parentComment.answer_id,
        question_id: parentComment.question_id,
        sender_id: user.id,
        recipient_id: nextRecipientId,
        type: 'comment',
        status: 'open',
        priority: 'normal',
        message,
        parent_id: parentComment.id,
      },
    ])

  if (insertError) {
    return NextResponse.json(
      {error: insertError.message},
      {status: 500}
    )
  }

  if (nextRecipientId && nextRecipientId !== user.id) {
  const notificationBody =
    message.length > 180 ? `${message.slice(0, 180)}...` : message

  await supabase.from('notifications').insert([
    {
      user_id: nextRecipientId,
      type: 'audit_comment_reply',
      title: 'Audit sualınıza cavab yazılıb',
      body: notificationBody,
      related_table: 'audit_comments',
      related_id: parentComment.id,
      related_plan_id: parentComment.plan_id,
    },
  ])

  const {data: plan} = await supabase
    .from('audit_plans')
    .select('title')
    .eq('id', parentComment.plan_id)
    .maybeSingle()

  const {data: recipientProfile} = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', nextRecipientId)
    .maybeSingle()

  const {data: senderProfile} = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const recipientEmail = recipientProfile?.email
  const recipientName = recipientProfile?.full_name || 'İstifadəçi'
  const senderName = senderProfile?.full_name || user.email || 'Sistem istifadəçisi'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const reportUrl = `${appUrl}/dashboard/plans/${parentComment.plan_id}/report?answer=${parentComment.answer_id}`

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: 'Audit sualınıza cavab yazılıb',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin: 0 0 12px;">Audit sualınıza cavab yazılıb</h2>

          <p>Salam ${recipientName},</p>

          <p>Audit sual/rəy müzakirənizə yeni cavab yazılıb.</p>

          <div style="margin: 16px 0; padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
            <p style="margin: 0 0 6px;"><b>Audit:</b> ${plan?.title || '-'}</p>
            <p style="margin: 0;"><b>Cavab yazan:</b> ${senderName}</p>
          </div>

          <div style="margin: 16px 0; padding: 14px; border-left: 4px solid #2563eb; background: #eff6ff;">
            ${message.replaceAll('\n', '<br />')}
          </div>

          <p>
            <a href="${reportUrl}" style="display: inline-block; padding: 10px 14px; background: #2563eb; color: white; text-decoration: none; border-radius: 10px; font-weight: bold;">
              Rapora bax
            </a>
          </p>
        </div>
      `,
      text: `Audit sualınıza cavab yazılıb\n\nAudit: ${plan?.title || '-'}\nCavab yazan: ${senderName}\n\n${message}\n\n${reportUrl}`,
    })
  }
}

  const nextStatus = isRecipient ? 'answered' : 'open'

  const {error: updateError} = await supabase
    .from('audit_comments')
    .update({
      status: nextStatus,
      answered_at: isRecipient ? new Date().toISOString() : null,
    })
    .eq('id', parentComment.id)

  if (updateError) {
    return NextResponse.json(
      {error: updateError.message},
      {status: 500}
    )
  }

  revalidatePath(`/dashboard/plans/${parentComment.plan_id}/report`)
  revalidatePath(`/dashboard/plans/${parentComment.plan_id}`)
  revalidatePath('/dashboard/audit-questions')
  revalidatePath('/dashboard/notifications')

  return NextResponse.json({
    success: true,
  })
}
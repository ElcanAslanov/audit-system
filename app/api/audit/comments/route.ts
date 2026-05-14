import {NextRequest, NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
import {revalidatePath} from 'next/cache'
import {sendEmail} from '@/lib/send-email'

function cleanText(value: unknown) {
  return String(value || '').trim()
}

function isAllowedType(value: string) {
  return value === 'question' || value === 'comment'
}

function isAllowedPriority(value: string) {
  return ['low', 'normal', 'high', 'urgent'].includes(value)
}

export async function POST(req: NextRequest) {
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

  const planId = cleanText(body.plan_id)
  const answerId = cleanText(body.answer_id)
  const questionId = cleanText(body.question_id)
  const recipientId = cleanText(body.recipient_id)
  const type = cleanText(body.type) || 'question'
  const priority = cleanText(body.priority) || 'normal'
  const message = cleanText(body.message)

  if (!planId) {
    return NextResponse.json(
      {error: 'Audit plan ID tapılmadı.'},
      {status: 400}
    )
  }

  if (!message) {
    return NextResponse.json(
      {error: 'Mətn daxil edilməlidir.'},
      {status: 400}
    )
  }

  if (!isAllowedType(type)) {
    return NextResponse.json(
      {error: 'Tip düzgün deyil.'},
      {status: 400}
    )
  }

  if (!isAllowedPriority(priority)) {
    return NextResponse.json(
      {error: 'Prioritet düzgün deyil.'},
      {status: 400}
    )
  }

  if (!recipientId) {
    return NextResponse.json(
      {error: 'Auditor seçilməlidir.'},
      {status: 400}
    )
  }

  const {data: plan, error: planError} = await supabase
    .from('audit_plans')
    .select('id, title, created_by')
    .eq('id', planId)
    .maybeSingle()

  if (planError) {
    return NextResponse.json(
      {error: planError.message},
      {status: 500}
    )
  }

  if (!plan) {
    return NextResponse.json(
      {error: 'Audit plan tapılmadı.'},
      {status: 404}
    )
  }

  if (answerId) {
    const {data: answer, error: answerError} = await supabase
      .from('audit_answers')
      .select('id, plan_id')
      .eq('id', answerId)
      .eq('plan_id', planId)
      .maybeSingle()

    if (answerError) {
      return NextResponse.json(
        {error: answerError.message},
        {status: 500}
      )
    }

    if (!answer) {
      return NextResponse.json(
        {error: 'Audit cavabı tapılmadı.'},
        {status: 404}
      )
    }
  }

  const {data: assignment, error: assignmentError} = await supabase
    .from('plan_assignments')
    .select('user_id')
    .eq('plan_id', planId)
    .eq('user_id', recipientId)
    .maybeSingle()

  if (assignmentError) {
    return NextResponse.json(
      {error: assignmentError.message},
      {status: 500}
    )
  }

  if (!assignment) {
    return NextResponse.json(
      {error: 'Seçilmiş auditor bu auditə təyin edilməyib.'},
      {status: 400}
    )
  }

  const {data: comment, error: insertError} = await supabase
    .from('audit_comments')
    .insert([
      {
        plan_id: planId,
        answer_id: answerId || null,
        question_id: questionId || null,
        sender_id: user.id,
        recipient_id: recipientId,
        type,
        priority,
        status: 'open',
        message,
      },
    ])
    .select('id')
    .single()

  if (insertError) {
    return NextResponse.json(
      {error: insertError.message},
      {status: 500}
    )
  }

  if (comment?.id && recipientId && recipientId !== user.id) {
  const notificationTitle =
    type === 'question'
      ? 'Sizə audit üzrə sual var'
      : 'Sizə audit üzrə rəy göndərilib'

  const notificationBody =
    message.length > 180 ? `${message.slice(0, 180)}...` : message

  await supabase.from('notifications').insert([
    {
      user_id: recipientId,
      type: 'audit_comment',
      title: notificationTitle,
      body: notificationBody,
      related_table: 'audit_comments',
      related_id: comment.id,
      related_plan_id: planId,
    },
  ])

  const {data: recipientProfile} = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', recipientId)
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
  const reportUrl = `${appUrl}/dashboard/plans/${planId}/report?answer=${answerId}`

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: notificationTitle,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin: 0 0 12px;">${notificationTitle}</h2>

          <p>Salam ${recipientName},</p>

          <p>
            Sizə audit hesabatı üzrə yeni ${
              type === 'question' ? 'sual' : 'rəy'
            } göndərilib.
          </p>

          <div style="margin: 16px 0; padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
            <p style="margin: 0 0 6px;"><b>Audit:</b> ${plan.title || '-'}</p>
            <p style="margin: 0 0 6px;"><b>Göndərən:</b> ${senderName}</p>
            <p style="margin: 0 0 6px;"><b>Tip:</b> ${
              type === 'question' ? 'Sual' : 'Rəy'
            }</p>
            <p style="margin: 0;"><b>Prioritet:</b> ${priority}</p>
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
      text: `${notificationTitle}\n\nAudit: ${plan.title || '-'}\nGöndərən: ${senderName}\n\n${message}\n\n${reportUrl}`,
    })
  }
}

  revalidatePath(`/dashboard/plans/${planId}/report`)
  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath('/dashboard/plans')
  revalidatePath('/dashboard/audit-questions')
  revalidatePath('/dashboard/notifications')

  return NextResponse.json({
    success: true,
    comment_id: comment.id,
  })
}
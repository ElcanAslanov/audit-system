import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
import {revalidatePath} from 'next/cache'

type RouteProps = {
  params: Promise<{id: string}>
}

export async function POST(_req: Request, {params}: RouteProps) {
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

  const {data: comment, error: commentError} = await supabase
    .from('audit_comments')
    .select('id, plan_id, sender_id, recipient_id')
    .eq('id', id)
    .maybeSingle()

  if (commentError) {
    return NextResponse.json(
      {error: commentError.message},
      {status: 500}
    )
  }

  if (!comment) {
    return NextResponse.json(
      {error: 'Sual/rəy tapılmadı.'},
      {status: 404}
    )
  }

  const canClose =
    comment.sender_id === user.id || comment.recipient_id === user.id

  if (!canClose) {
    return NextResponse.json(
      {error: 'Bu sualı bağlamaq icazəniz yoxdur.'},
      {status: 403}
    )
  }

  const {error: updateError} = await supabase
    .from('audit_comments')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json(
      {error: updateError.message},
      {status: 500}
    )
  }

  revalidatePath(`/dashboard/plans/${comment.plan_id}/report`)
  revalidatePath(`/dashboard/plans/${comment.plan_id}`)
  revalidatePath('/dashboard/audit-questions')

  return NextResponse.json({
    success: true,
  })
}
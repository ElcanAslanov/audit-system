import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'

type RouteProps = {
  params: Promise<{id: string}>
}

export async function DELETE(_req: Request, {params}: RouteProps) {
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

  const {data: existing, error: existingError} = await supabase
    .from('notifications')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json(
      {error: existingError.message},
      {status: 500}
    )
  }

  if (!existing) {
    return NextResponse.json(
      {error: 'Bildiriş tapılmadı və ya sizə aid deyil.'},
      {status: 404}
    )
  }

  const {error: deleteError} = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json(
      {error: deleteError.message},
      {status: 500}
    )
  }

  return NextResponse.json({
    success: true,
    deleted_id: id,
  })
}
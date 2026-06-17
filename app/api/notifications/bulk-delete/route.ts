import {NextRequest, NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
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
  const ids = Array.isArray(body?.ids)
    ? body.ids.map((id: any) => String(id).trim()).filter(Boolean)
    : []

  if (ids.length === 0) {
    return NextResponse.json(
      {error: 'Silinəcək bildiriş seçilməyib.'},
      {status: 400}
    )
  }

  const {data: existingRows, error: existingError} = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', user.id)
    .in('id', ids)

  if (existingError) {
    return NextResponse.json(
      {error: existingError.message},
      {status: 500}
    )
  }

  const allowedIds = (existingRows || []).map((item: any) => item.id)

  if (allowedIds.length === 0) {
    return NextResponse.json(
      {error: 'Sizə aid silinəcək bildiriş tapılmadı.'},
      {status: 404}
    )
  }

  const {error: deleteError} = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .in('id', allowedIds)

  if (deleteError) {
    return NextResponse.json(
      {error: deleteError.message},
      {status: 500}
    )
  }

  return NextResponse.json({
    success: true,
    deleted: allowedIds.length,
    deleted_ids: allowedIds,
  })
}
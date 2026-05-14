import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      {
        count: 0,
      },
      {status: 401}
    )
  }

  const {count, error} = await supabase
    .from('notifications')
    .select('id', {count: 'exact', head: true})
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    return NextResponse.json(
      {
        count: 0,
        error: error.message,
      },
      {status: 500}
    )
  }

  return NextResponse.json({
    count: count || 0,
  })
}
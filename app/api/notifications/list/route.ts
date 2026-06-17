import {NextRequest, NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'

function toPositiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) return fallback

  return parsed
}

export async function GET(req: NextRequest) {
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

  const searchParams = req.nextUrl.searchParams
  const limit = Math.min(toPositiveNumber(searchParams.get('limit'), 10), 50)
  const page = toPositiveNumber(searchParams.get('page'), 1)

  const from = (page - 1) * limit
  const to = from + limit - 1

  const {data: notifications, error, count} = await supabase
    .from('notifications')
    .select(
      `
      id,
      type,
      title,
      body,
      related_table,
      related_id,
      related_plan_id,
      is_read,
      created_at
    `,
      {count: 'exact'}
    )
    .eq('user_id', user.id)
    .order('created_at', {ascending: false})
    .range(from, to)

  if (error) {
    return NextResponse.json(
      {error: error.message},
      {status: 500}
    )
  }

  const rows = notifications || []

  const rootCommentIds = Array.from(
    new Set(rows.map((item: any) => item.related_id).filter(Boolean))
  )

  const commentsById = new Map<string, any>()

  if (rootCommentIds.length > 0) {
    const {data: comments} = await supabase
      .from('audit_comments')
      .select('id, answer_id')
      .in('id', rootCommentIds)

    ;(comments || []).forEach((comment: any) => {
      commentsById.set(comment.id, comment)
    })
  }

  const preparedRows = rows.map((item: any) => {
    const comment = item.related_id ? commentsById.get(item.related_id) : null

    const reportHref =
      item.related_plan_id && comment?.answer_id
        ? `/dashboard/plans/${item.related_plan_id}/report?answer=${comment.answer_id}`
        : item.related_plan_id
          ? `/dashboard/plans/${item.related_plan_id}/report`
          : ''

    return {
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      related_table: item.related_table,
      related_id: item.related_id,
      related_plan_id: item.related_plan_id,
      is_read: item.is_read,
      created_at: item.created_at,
      report_href: reportHref,
    }
  })

  return NextResponse.json({
    notifications: preparedRows,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.max(1, Math.ceil((count || 0) / limit)),
    },
  })
}
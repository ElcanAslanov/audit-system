import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'İstifadəçi tapılmadı.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  const path = searchParams.get('path')
  const name = searchParams.get('name') || 'fayl'
  const mode = searchParams.get('mode') || 'open'

  if (!path) {
    return NextResponse.json({ error: 'Fayl yolu tapılmadı.' }, { status: 400 })
  }

  const { data, error } = await supabase.storage
    .from('finding-files')
    .download(path)

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'Fayl yüklənə bilmədi.' },
      { status: 500 }
    )
  }

  const headers = new Headers()
  headers.set('Content-Type', data.type || 'application/octet-stream')

  if (mode === 'download') {
    headers.set(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(name)}`
    )
  } else {
    headers.set(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(name)}`
    )
  }

  return new NextResponse(data, { headers })
}
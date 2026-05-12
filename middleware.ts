import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

function stripLocale(pathname: string) {
  const segment = pathname.split('/')[1]

  if (routing.locales.includes(segment as any)) {
    const withoutLocale = pathname.replace(`/${segment}`, '')
    return withoutLocale || '/'
  }

  return pathname
}

function isLocalePrefixedPath(pathname: string) {
  return (
    pathname.startsWith('/az/') ||
    pathname.startsWith('/en/') ||
    pathname.startsWith('/ru/') ||
    pathname === '/az' ||
    pathname === '/en' ||
    pathname === '/ru'
  )
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const pathWithoutLocale = stripLocale(pathname)

  if (isLocalePrefixedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = pathWithoutLocale
    return NextResponse.redirect(redirectUrl)
  }

  let response =
    intlMiddleware(request) ||
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

  const isPublicAuthPage =
    pathWithoutLocale === '/login' ||
    pathWithoutLocale.startsWith('/login/')

  const isDashboardPage =
    pathWithoutLocale === '/dashboard' ||
    pathWithoutLocale.startsWith('/dashboard/')

  // Login səhifəsi public-dir. Burada Supabase auth yoxlaması etmə.
  // Bu, "Auth session missing!" loglarını və lazımsız document latency-ni azaldır.
  if (isPublicAuthPage) {
    return response
  }

  // Dashboard deyilsə, auth yoxlaması lazım deyil.
  if (!isDashboardPage) {
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env in middleware')
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error && error.message !== 'Auth session missing!') {
      console.error('Supabase getUser error in middleware:', error.message)
    }

    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error('Middleware failed:', error)

    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/(az|ru|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
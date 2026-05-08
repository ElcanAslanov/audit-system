import {createServerClient} from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import {NextResponse, type NextRequest} from 'next/server'
import {routing} from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

function getLocaleFromPath(pathname: string) {
  const segment = pathname.split('/')[1]

  if (routing.locales.includes(segment as any)) {
    return segment
  }

  return routing.defaultLocale
}

function stripLocale(pathname: string) {
  const locale = getLocaleFromPath(pathname)

  if (pathname === `/${locale}`) {
    return '/'
  }

  if (pathname.startsWith(`/${locale}/`)) {
    return pathname.replace(`/${locale}`, '') || '/'
  }

  return pathname
}

function localizedPath(pathname: string, locale: string) {
  if (pathname === '/') return `/${locale}`
  return `/${locale}${pathname}`
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const intlResponse = intlMiddleware(request)

  const locale = getLocaleFromPath(pathname)
  const pathWithoutLocale = stripLocale(pathname)

  let response = intlResponse || NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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
        cookiesToSet.forEach(({name, value}) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })

        cookiesToSet.forEach(({name, value, options}) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  try {
    const {
      data: {user},
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Supabase getUser error in middleware:', error.message)
    }

    if (!user && pathWithoutLocale.startsWith('/dashboard')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = localizedPath('/login', locale)
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    if (user && pathWithoutLocale === '/login') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = localizedPath('/dashboard', locale)
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error('Middleware failed:', error)

    if (pathWithoutLocale.startsWith('/dashboard')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = localizedPath('/login', locale)
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }
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
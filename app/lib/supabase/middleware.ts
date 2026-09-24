import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { MOCK_AUTH_COOKIE } from '../mock/client';

export async function updateSession(request: NextRequest) {
  const isMock =
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT');

  if (isMock) {
    const hasMockToken = request.cookies.get(MOCK_AUTH_COOKIE)?.value;
    if (!hasMockToken && request.nextUrl.pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /dashboard — redirect to /login if not authenticated
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

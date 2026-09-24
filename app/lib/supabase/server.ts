import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createMockClient, MOCK_AUTH_COOKIE } from '../mock/client';
import { mockStore } from '../mock/store';

export async function createClient() {
  const cookieStore = await cookies();

  if (
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT')
  ) {
    const hasAuth = cookieStore.get(MOCK_AUTH_COOKIE)?.value;
    const user = hasAuth ? mockStore.user : null;
    return createMockClient(user) as unknown as ReturnType<typeof createServerClient>;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Component where cookies can't be set.
            // This is fine — middleware will refresh the session.
          }
        },
      },
    }
  );
}

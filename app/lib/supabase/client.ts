import { createBrowserClient } from '@supabase/ssr';
import { createMockClient } from '../mock/client';

export function createClient() {
  if (
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT')
  ) {
    return createMockClient() as unknown as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

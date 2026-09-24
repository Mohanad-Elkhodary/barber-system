import { mockStore, type MockUser } from './store';
import type { Ticket } from '../types';

export const MOCK_AUTH_COOKIE = 'sb-mock-auth-token';

function getAuthCookieValue(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + MOCK_AUTH_COOKIE + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setAuthCookie(value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${MOCK_AUTH_COOKIE}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

function removeAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${MOCK_AUTH_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

export function createMockClient(serverUser: MockUser | null = null) {
  const isBrowser = typeof window !== 'undefined';

  return {
    auth: {
      async getUser() {
        if (serverUser) {
          return { data: { user: serverUser }, error: null };
        }
        const hasToken = getAuthCookieValue();
        if (hasToken) {
          return { data: { user: mockStore.user }, error: null };
        }
        return { data: { user: null }, error: null };
      },

      async signInWithPassword({ email, password }: { email: string; password?: string }) {
        if (email === mockStore.user.email && password === 'password123') {
          setAuthCookie('mock-valid-token');
          return {
            data: { user: mockStore.user, session: { access_token: 'mock-token' } },
            error: null,
          };
        }
        return {
          data: { user: null, session: null },
          error: { message: 'البريد أو كلمة السر غلط' },
        };
      },

      async signOut() {
        removeAuthCookie();
        return { error: null };
      },
    },

    channel(_name: string) {
      return {
        on(_event: string, _filter: Record<string, unknown>, _callback: (payload: unknown) => void) {
          return this;
        },
        subscribe() {
          return {
            unsubscribe() {},
          };
        },
      };
    },

    removeChannel(_channel: unknown) {},

    async rpc(name: string, params?: { p_barber_id?: string }) {
      if (name === 'get_next_ticket_number') {
        const barberId = params?.p_barber_id;
        const barberTickets = mockStore.tickets.filter((t) => t.barber_id === barberId);
        const maxNumber = barberTickets.reduce((max, t) => Math.max(max, t.number), 0);
        return { data: maxNumber + 1, error: null };
      }
      return { data: null, error: null };
    },

    from(table: string) {
      let isSingle = false;
      let countMode = false;
      let limitCount: number | null = null;
      let updatePayload: Record<string, unknown> | null = null;
      let insertPayload: Record<string, unknown> | null = null;
      const serializableFilters: Array<{ type: string; col: string; val: unknown }> = [];

      const queryBuilder = {
        select(_cols?: string, options?: { count?: string; head?: boolean }) {
          if (options?.count === 'exact') {
            countMode = true;
          }
          return queryBuilder;
        },

        insert(data: Record<string, unknown>) {
          insertPayload = data;
          return queryBuilder;
        },

        update(data: Record<string, unknown>) {
          updatePayload = data;
          return queryBuilder;
        },

        eq(col: string, val: unknown) {
          serializableFilters.push({ type: 'eq', col, val });
          return queryBuilder;
        },

        in(col: string, vals: unknown[]) {
          serializableFilters.push({ type: 'in', col, val: vals });
          return queryBuilder;
        },

        lt(col: string, val: number) {
          serializableFilters.push({ type: 'lt', col, val });
          return queryBuilder;
        },

        gte(col: string, val: unknown) {
          serializableFilters.push({ type: 'gte', col, val });
          return queryBuilder;
        },

        order(_col: string, _options?: { ascending?: boolean }) {
          return queryBuilder;
        },

        limit(count: number) {
          limitCount = count;
          return queryBuilder;
        },

        single() {
          isSingle = true;
          return queryBuilder;
        },

        async then(resolve: (res: { data: unknown; error: unknown; count?: number }) => void) {
          // In the browser, sync with the Node server via /api/mock-db
          if (isBrowser) {
            try {
              const res = await fetch('/api/mock-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: insertPayload ? 'insert' : updatePayload ? 'update' : 'select',
                  table,
                  filters: serializableFilters,
                  limitCount,
                  isSingle,
                  countMode,
                  updatePayload,
                  insertPayload,
                }),
              });
              const json = await res.json();
              resolve(json);
              return;
            } catch (err) {
              console.error('Mock DB browser fetch failed', err);
            }
          }

          // On server, execute directly against mockStore
          let dataset: Record<string, unknown>[] = [];
          if (table === 'barbers') dataset = mockStore.barbers as unknown as Record<string, unknown>[];
          if (table === 'tickets') dataset = mockStore.tickets as unknown as Record<string, unknown>[];

          if (insertPayload) {
            const newTicket: Ticket = {
              id: 't-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              barber_id: insertPayload.barber_id as string,
              number: insertPayload.number as number,
              customer_name: insertPayload.customer_name as string,
              phone: insertPayload.phone as string,
              status: (insertPayload.status as Ticket['status']) || 'waiting',
              created_at: new Date().toISOString(),
            };
            mockStore.tickets.push(newTicket);
            const res = isSingle ? newTicket : [newTicket];
            resolve({ data: res, error: null });
            return;
          }

          if (updatePayload) {
            const matches = dataset.filter((item) =>
              serializableFilters.every((f) => {
                if (f.type === 'eq') return item[f.col] === f.val;
                return true;
              })
            );
            for (const item of matches) {
              Object.assign(item, updatePayload);
            }
            resolve({ data: matches, error: null });
            return;
          }

          let filtered = dataset.filter((item) =>
            serializableFilters.every((f) => {
              if (f.type === 'eq') return item[f.col] === f.val;
              if (f.type === 'in') return (f.val as unknown[]).includes(item[f.col]);
              if (f.type === 'lt') return (item[f.col] as number) < (f.val as number);
              if (f.type === 'gte') return (item[f.col] as string) >= (f.val as string);
              return true;
            })
          );

          if (countMode) {
            resolve({ count: filtered.length, data: null, error: null });
            return;
          }

          if (limitCount !== null) {
            filtered = filtered.slice(0, limitCount);
          }

          if (isSingle) {
            resolve({ data: filtered[0] || null, error: null });
            return;
          }

          resolve({ data: filtered, error: null });
        },
      };

      return queryBuilder;
    },
  };
}

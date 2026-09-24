import type { Barber, Ticket } from '../types';

export interface MockUser {
  id: string;
  email: string;
}

const DEFAULT_BARBERS: Barber[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    user_id: 'u1111111-1111-1111-1111-111111111111',
    name: 'مؤمن عطيفه',
    is_online: true,
    created_at: '2026-09-21T00:00:00.000Z',
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    user_id: 'u2222222-2222-2222-2222-222222222222',
    name: 'مهند عطيفه',
    is_online: true,
    created_at: '2026-09-21T01:00:00.000Z',
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    user_id: 'u3333333-3333-3333-3333-333333333333',
    name: 'محمد عطيفه',
    is_online: true,
    created_at: '2026-09-21T02:00:00.000Z',
  },
];

const DEFAULT_TICKETS: Ticket[] = [
  {
    id: 't1111111-1111-1111-1111-111111111111',
    barber_id: 'b1111111-1111-1111-1111-111111111111',
    number: 1,
    status: 'serving',
    customer_name: 'حسن إبراهيم',
    phone: '+201012345670',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 't2222222-2222-2222-2222-222222222222',
    barber_id: 'b1111111-1111-1111-1111-111111111111',
    number: 2,
    status: 'waiting',
    customer_name: 'خالد طارق',
    phone: '+201012345671',
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 't3333333-3333-3333-3333-333333333333',
    barber_id: 'b1111111-1111-1111-1111-111111111111',
    number: 3,
    status: 'waiting',
    customer_name: 'عمر سعيد',
    phone: '+201012345672',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

class MockStore {
  barbers: Barber[] = JSON.parse(JSON.stringify(DEFAULT_BARBERS));
  tickets: Ticket[] = JSON.parse(JSON.stringify(DEFAULT_TICKETS));
  user: MockUser = {
    id: 'u1111111-1111-1111-1111-111111111111',
    email: 'barber@test.com',
  };

  reset() {
    this.barbers = JSON.parse(JSON.stringify(DEFAULT_BARBERS));
    this.tickets = JSON.parse(JSON.stringify(DEFAULT_TICKETS));
  }
}

// Global singleton for NodeJS and browser
const globalAny = globalThis as unknown as { __mock_store__?: MockStore };
if (!globalAny.__mock_store__) {
  globalAny.__mock_store__ = new MockStore();
}

export const mockStore = globalAny.__mock_store__;

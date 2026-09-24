import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/app/lib/mock/store';
import type { Ticket } from '@/app/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, table, filters = [], limitCount, isSingle, countMode, updatePayload, insertPayload } = body;

  let dataset: Record<string, unknown>[] = [];
  if (table === 'barbers') dataset = mockStore.barbers as unknown as Record<string, unknown>[];
  if (table === 'tickets') dataset = mockStore.tickets as unknown as Record<string, unknown>[];

  if (action === 'reset') {
    mockStore.reset();
    return NextResponse.json({ success: true });
  }

  if (action === 'insert') {
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
    return NextResponse.json({ data: isSingle ? newTicket : [newTicket], error: null });
  }

  if (action === 'update') {
    const matches = dataset.filter((item) =>
      filters.every((f: { type: string; col: string; val: unknown }) => {
        if (f.type === 'eq') return item[f.col] === f.val;
        return true;
      })
    );
    for (const item of matches) {
      Object.assign(item, updatePayload);
    }
    return NextResponse.json({ data: matches, error: null });
  }

  // SELECT
  let filtered = dataset.filter((item) =>
    filters.every((f: { type: string; col: string; val: unknown }) => {
      if (f.type === 'eq') return item[f.col] === f.val;
      if (f.type === 'in') return (f.val as unknown[]).includes(item[f.col]);
      if (f.type === 'lt') return (item[f.col] as number) < (f.val as number);
      if (f.type === 'gte') return (item[f.col] as string) >= (f.val as string);
      return true;
    })
  );

  if (countMode) {
    return NextResponse.json({ count: filtered.length, data: null, error: null });
  }

  if (limitCount) {
    filtered = filtered.slice(0, limitCount);
  }

  if (isSingle) {
    return NextResponse.json({ data: filtered[0] || null, error: null });
  }

  return NextResponse.json({ data: filtered, error: null });
}

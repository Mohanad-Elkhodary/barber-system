import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { rateLimit } from '@/app/lib/rate-limit';
import messages from '@/app/lib/i18n/messages';

const t = messages;

/** Validate Egyptian phone in international format: +20 followed by 10 digits */
function isValidPhone(phone: string): boolean {
  return /^\+20(10|11|12|15)\d{8}$/.test(phone);
}

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const isMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

  if (!isMock && !rateLimit(`ip:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: t.errors.rateLimited },
      { status: 429 }
    );
  }

  let body: { barber_id?: string; customer_name?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: t.errors.serverError },
      { status: 400 }
    );
  }

  const { barber_id, customer_name, phone } = body;

  // Validate required fields
  if (!barber_id) {
    return NextResponse.json(
      { success: false, error: t.errors.barberRequired },
      { status: 400 }
    );
  }

  if (!customer_name || customer_name.trim().length < 2) {
    return NextResponse.json(
      { success: false, error: t.errors.nameRequired },
      { status: 400 }
    );
  }

  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json(
      { success: false, error: t.errors.phoneInvalid },
      { status: 400 }
    );
  }

  // Rate limit by phone
  if (!isMock && !rateLimit(`phone:${phone}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: t.errors.rateLimited },
      { status: 429 }
    );
  }

  // Create Supabase client
  const supabase = await createClient();

  // Check barber exists and is online
  const { data: barber } = await supabase
    .from('barbers')
    .select('id, is_online')
    .eq('id', barber_id)
    .single();

  if (!barber) {
    return NextResponse.json(
      { success: false, error: t.errors.barberRequired },
      { status: 404 }
    );
  }

  if (!barber.is_online) {
    return NextResponse.json(
      { success: false, error: t.errors.barberOffline },
      { status: 400 }
    );
  }

  // Check for duplicate active ticket
  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id')
    .eq('phone', phone)
    .in('status', ['waiting', 'serving'])
    .limit(1);

  if (existingTicket && existingTicket.length > 0) {
    return NextResponse.json(
      { success: false, error: t.errors.duplicatePhone },
      { status: 409 }
    );
  }

  // Get next ticket number
  const { data: nextNumberResult } = await supabase
    .rpc('get_next_ticket_number', { p_barber_id: barber_id });

  const ticketNumber = nextNumberResult ?? 1;

  // Create ticket
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      barber_id,
      number: ticketNumber,
      customer_name: customer_name.trim(),
      phone,
      status: 'waiting',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { success: false, error: t.errors.serverError },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: ticket }, { status: 201 });
}

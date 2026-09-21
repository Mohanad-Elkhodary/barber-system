// ============================================================
// TypeScript types for the barber queue system
// ============================================================

export interface Barber {
  id: string;
  user_id: string;
  name: string;
  is_online: boolean;
  created_at: string;
}

export type TicketStatus = 'waiting' | 'serving' | 'done' | 'no_show';

export interface Ticket {
  id: string;
  barber_id: string;
  number: number;
  status: TicketStatus;
  customer_name: string;
  phone: string;
  created_at: string;
}

export interface TicketEvent {
  id: string;
  ticket_id: string;
  event_type: 'created' | 'status_changed';
  old_status: TicketStatus | null;
  new_status: TicketStatus;
  payload: Record<string, unknown>;
  created_at: string;
}

/** Barber card data for the customer home page */
export interface BarberWithQueue extends Barber {
  now_serving: number | null;
  waiting_count: number;
}

/** Booking form data */
export interface BookingFormData {
  barber_id: string;
  customer_name: string;
  phone: string;
}

/** API response shape */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

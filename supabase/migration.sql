-- ============================================================
-- Barber Queue — Supabase Migration
-- Run this against your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'serving', 'done', 'no_show')),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit table for n8n / WhatsApp webhook integration
CREATE TABLE ticket_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created' | 'status_changed'
  old_status TEXT,
  new_status TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_tickets_barber_status ON tickets(barber_id, status);
CREATE INDEX idx_tickets_phone_status ON tickets(phone, status);
CREATE INDEX idx_tickets_barber_created ON tickets(barber_id, created_at);
CREATE INDEX idx_ticket_events_ticket ON ticket_events(ticket_id);
CREATE INDEX idx_barbers_user_id ON barbers(user_id);

-- ============================================================
-- 3. FUNCTIONS
-- ============================================================

-- Get the next ticket number for a barber (resets daily, Cairo timezone)
CREATE OR REPLACE FUNCTION get_next_ticket_number(p_barber_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(number), 0) + 1
  INTO next_num
  FROM tickets
  WHERE barber_id = p_barber_id
    AND created_at >= (now() AT TIME ZONE 'Africa/Cairo')::date::timestamptz;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Check if a phone number already has an active (waiting/serving) ticket
CREATE OR REPLACE FUNCTION has_active_ticket(p_phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tickets
    WHERE phone = p_phone
      AND status IN ('waiting', 'serving')
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. TRIGGERS — emit events for n8n webhook
-- ============================================================

-- Trigger function: on ticket insert
CREATE OR REPLACE FUNCTION fn_ticket_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ticket_events (ticket_id, event_type, new_status, payload)
  VALUES (
    NEW.id,
    'created',
    NEW.status,
    jsonb_build_object(
      'barber_id', NEW.barber_id,
      'customer_name', NEW.customer_name,
      'phone', NEW.phone,
      'number', NEW.number
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: on ticket status change
CREATE OR REPLACE FUNCTION fn_ticket_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_events (ticket_id, event_type, old_status, new_status, payload)
    VALUES (
      NEW.id,
      'status_changed',
      OLD.status,
      NEW.status,
      jsonb_build_object(
        'barber_id', NEW.barber_id,
        'customer_name', NEW.customer_name,
        'phone', NEW.phone,
        'number', NEW.number
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers
CREATE TRIGGER trg_ticket_created
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION fn_ticket_created();

CREATE TRIGGER trg_ticket_status_changed
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION fn_ticket_status_changed();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_events ENABLE ROW LEVEL SECURITY;

-- BARBERS policies
-- Anyone can read barbers
CREATE POLICY "barbers_select_all"
  ON barbers FOR SELECT
  USING (true);

-- Only the barber themselves can update their own row
CREATE POLICY "barbers_update_own"
  ON barbers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- TICKETS policies
-- Anyone can read tickets (needed for customer pages and display)
CREATE POLICY "tickets_select_all"
  ON tickets FOR SELECT
  USING (true);

-- Anyone can insert tickets (customers booking)
CREATE POLICY "tickets_insert_all"
  ON tickets FOR INSERT
  WITH CHECK (true);

-- Only the barber who owns the ticket can update it
CREATE POLICY "tickets_update_own_barber"
  ON tickets FOR UPDATE
  USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );

-- TICKET_EVENTS policies
-- Anyone can read events
CREATE POLICY "ticket_events_select_all"
  ON ticket_events FOR SELECT
  USING (true);

-- Only triggers (SECURITY DEFINER) can insert — no direct inserts allowed
-- No INSERT policy = blocked for normal users

-- ============================================================
-- 6. ENABLE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE barbers;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- ============================================================
-- 7. SEED DATA (optional — create test barbers)
-- After creating auth users in Supabase dashboard, update user_id below
-- ============================================================

-- INSERT INTO barbers (user_id, name, is_online) VALUES
--   ('AUTH_USER_UUID_1', 'مؤمن عطيفه', true),
--   ('AUTH_USER_UUID_2', 'مهند عطيفه', true),
--   ('AUTH_USER_UUID_3', 'محمد عطيفه', true);

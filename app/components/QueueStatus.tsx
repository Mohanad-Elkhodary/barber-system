'use client';

import { useEffect, useState, useCallback, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/app/lib/supabase/client';
import type { Ticket } from '@/app/lib/types';
import messages from '@/app/lib/i18n/messages';

interface QueueStatusProps {
  ticketId: string;
  barberId: string;
  initialTicket: Ticket;
}

export default function QueueStatus({ ticketId, barberId, initialTicket }: QueueStatusProps) {
  const t = messages;
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [nowServing, setNowServing] = useState<number | null>(null);
  const [ahead, setAhead] = useState(0);

  const fetchQueueInfo = useCallback(async () => {
    const supabase = createClient();

    // Get the currently serving ticket for this barber
    const { data: servingTickets } = await supabase
      .from('tickets')
      .select('number')
      .eq('barber_id', barberId)
      .eq('status', 'serving')
      .limit(1);

    if (servingTickets && servingTickets.length > 0) {
      setNowServing(servingTickets[0].number);
    } else {
      setNowServing(null);
    }

    // Count tickets ahead
    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('barber_id', barberId)
      .eq('status', 'waiting')
      .lt('number', ticket.number);

    setAhead(count ?? 0);
  }, [barberId, ticket.number]);

  useEffect(() => {
    startTransition(() => { fetchQueueInfo(); });

    const supabase = createClient();

    // Subscribe to ticket changes for this barber
    const channel = supabase
      .channel(`queue-${barberId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `barber_id=eq.${barberId}`,
        },
        (payload: { new?: Record<string, unknown> }) => {
          // If our ticket was updated
          if (payload.new && (payload.new as unknown as Ticket).id === ticketId) {
            setTicket(payload.new as unknown as Ticket);
          }
          // Refresh queue info on any change
          fetchQueueInfo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barberId, ticketId, fetchQueueInfo]);

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'waiting':
        return <span className="badge badge-waiting">{t.ticket.statusWaiting}</span>;
      case 'serving':
        return <span className="badge badge-serving">{t.ticket.statusServing}</span>;
      case 'done':
        return <span className="badge badge-done">{t.ticket.statusDone}</span>;
      case 'no_show':
        return <span className="badge badge-no-show">{t.ticket.statusNoShow}</span>;
    }
  };

  const getMessage = () => {
    switch (ticket.status) {
      case 'waiting':
        return t.ticket.waitingMessage;
      case 'serving':
        return t.ticket.servingMessage;
      case 'done':
        return t.ticket.doneMessage;
      default:
        return '';
    }
  };

  const isYourTurn = ticket.status === 'serving';

  return (
    <div className="ticket-info animate-fade-in">
      {/* Status badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={ticket.status}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          {getStatusBadge()}
        </motion.div>
      </AnimatePresence>

      {/* Your ticket number */}
      <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
        {t.ticket.yourNumber}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={ticket.number}
          className={`ticket-number ${isYourTurn ? 'animate-glow' : ''}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          {ticket.number}
        </motion.div>
      </AnimatePresence>

      {/* Your turn celebration */}
      {isYourTurn && (
        <motion.div
          className="heading-2 text-gold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          {t.ticket.yourTurn}
        </motion.div>
      )}

      {/* Now serving info */}
      {ticket.status === 'waiting' && (
        <div
          className="card"
          style={{ textAlign: 'center', width: '100%', maxWidth: 300 }}
        >
          <div className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>
            {t.ticket.nowServing}
          </div>
          <div className="now-serving-number" style={{ fontSize: '3rem' }}>
            {nowServing ?? '—'}
          </div>
          <div className="mt-3">
            {ahead > 0 ? (
              <span className="text-secondary">
                {t.ticket.ahead}: {ahead} {ahead === 1 ? t.ticket.person : t.ticket.people}
              </span>
            ) : (
              <span className="text-gold" style={{ fontWeight: 600 }}>
                {t.ticket.noneAhead}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Status message */}
      <motion.p
        className="text-secondary text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ maxWidth: 300 }}
      >
        {getMessage()}
      </motion.p>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback, useTransition, startTransition as reactStartTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/app/lib/supabase/client';
import type { Barber, Ticket } from '@/app/lib/types';
import messages from '@/app/lib/i18n/messages';
import { toggleOnline, serveNext, markDone, markNoShow, logout } from './actions';
import StyleLogo from '@/app/components/StyleLogo';

export default function DashboardPage() {
  const t = messages;
  const [barber, setBarber] = useState<Barber | null>(null);
  const [queue, setQueue] = useState<Ticket[]>([]);
  const [servingTicket, setServingTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [isPending, startTransition] = useTransition();

  // Stats
  const [todayDone, setTodayDone] = useState(0);
  const [todayNoShow, setTodayNoShow] = useState(0);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get barber record
    const { data: barberData } = await supabase
      .from('barbers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!barberData) return;
    setBarber(barberData as Barber);

    // Get today's start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get waiting tickets
    const { data: waitingTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('barber_id', barberData.id)
      .eq('status', 'waiting')
      .order('number', { ascending: true });

    setQueue((waitingTickets as Ticket[]) || []);

    // Get currently serving
    const { data: serving } = await supabase
      .from('tickets')
      .select('*')
      .eq('barber_id', barberData.id)
      .eq('status', 'serving')
      .limit(1);

    setServingTicket(serving && serving.length > 0 ? (serving[0] as Ticket) : null);

    // Get today's stats
    const { count: doneCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('barber_id', barberData.id)
      .eq('status', 'done')
      .gte('created_at', today.toISOString());

    const { count: noShowCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('barber_id', barberData.id)
      .eq('status', 'no_show')
      .gte('created_at', today.toISOString());

    setTodayDone(doneCount ?? 0);
    setTodayNoShow(noShowCount ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    reactStartTransition(() => { fetchData(); });

    const supabase = createClient();

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barbers' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleAction = (action: () => Promise<{ error?: string; success?: boolean }>) => {
    setActionError('');
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        setActionError(result.error);
        setTimeout(() => setActionError(''), 3000);
      }
      fetchData();
    });
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="skeleton" style={{ height: 60, marginBottom: 'var(--space-4)' }} />
          <div className="skeleton" style={{ height: 200, marginBottom: 'var(--space-4)' }} />
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="page-center">
        <p className="text-secondary">{t.common.error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 700 }}>
        {/* Header */}
        <motion.header
          className="header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="logo"><StyleLogo size={36} showText={false} /><span className="logo-text" style={{ fontSize: '1.25rem' }}>{t.dashboard.title}</span></div>
            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
              {t.dashboard.welcome}، {barber.name}
            </p>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => startTransition(() => logout())}
            disabled={isPending}
          >
            {t.dashboard.logout}
          </button>
        </motion.header>

        {/* Online/Offline toggle */}
        <motion.div
          className="card mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className={`badge ${barber.is_online ? 'badge-online' : 'badge-offline'}`}>
                <span className="badge-dot" />
                {barber.is_online ? t.common.online : t.common.offline}
              </span>
            </div>
            <button
              id="toggle-status-btn"
              className={`btn ${barber.is_online ? 'btn-danger' : 'btn-success'}`}
              onClick={() => handleAction(toggleOnline)}
              disabled={isPending}
            >
              {barber.is_online ? t.dashboard.goOffline : t.dashboard.goOnline}
            </button>
          </div>
        </motion.div>

        {/* Error toast */}
        <AnimatePresence>
          {actionError && (
            <motion.div
              className="form-error mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                padding: 'var(--space-3)',
                background: 'var(--red-bg)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {actionError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Currently serving */}
        <motion.div
          className="card mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="heading-3 mb-3">{t.dashboard.currentlyServing}</h2>
          {servingTicket ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="queue-item-number">{servingTicket.number}</span>
                <div>
                  <div>{servingTicket.customer_name}</div>
                  <div className="text-muted" style={{ fontSize: '0.8125rem', direction: 'ltr', textAlign: 'right' }}>
                    {servingTicket.phone}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-success"
                  onClick={() => handleAction(markDone)}
                  disabled={isPending}
                >
                  {t.dashboard.done}
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => handleAction(markNoShow)}
                  disabled={isPending}
                >
                  {t.dashboard.noShow}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-secondary">{t.dashboard.noOneServing}</p>
          )}
        </motion.div>

        {/* Queue */}
        <motion.div
          className="card mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="heading-3">
              {t.dashboard.queue} ({queue.length})
            </h2>
            {!servingTicket && queue.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={() => handleAction(serveNext)}
                disabled={isPending}
              >
                {t.dashboard.next}
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <p className="text-secondary">{t.dashboard.emptyQueue}</p>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {queue.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    className="queue-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="queue-item-number">{ticket.number}</span>
                    <div className="queue-item-name">
                      <div>{ticket.customer_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.8125rem', direction: 'ltr', textAlign: 'right' }}>
                        {ticket.phone}
                      </div>
                    </div>
                    <span className="badge badge-waiting">{t.ticket.statusWaiting}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Today's stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="heading-3 mb-3">{t.dashboard.todayStats}</h2>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{queue.length}</div>
              <div className="stat-label">{t.customer.waiting}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{servingTicket ? 1 : 0}</div>
              <div className="stat-label">{t.dashboard.currentlyServing}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{todayDone}</div>
              <div className="stat-label">{t.dashboard.served}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{todayNoShow}</div>
              <div className="stat-label">{t.dashboard.noShows}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

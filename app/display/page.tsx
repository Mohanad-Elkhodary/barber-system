'use client';

import { useEffect, useState, useCallback, startTransition } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/app/lib/supabase/client';
import type { Barber } from '@/app/lib/types';
import messages from '@/app/lib/i18n/messages';
import TicketDisplay from '@/app/components/TicketDisplay';
import StyleLogo from '@/app/components/StyleLogo';

interface BarberDisplayInfo {
  barber: Barber;
  nowServing: number | null;
  waitingCount: number;
}

export default function DisplayPage() {
  const t = messages;
  const [displayData, setDisplayData] = useState<BarberDisplayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const { data: barbers } = await supabase
      .from('barbers')
      .select('*')
      .eq('is_online', true)
      .order('created_at', { ascending: true });

    if (!barbers) {
      setDisplayData([]);
      setLoading(false);
      return;
    }

    const enriched: BarberDisplayInfo[] = await Promise.all(
      barbers.map(async (barber: Barber) => {
        const { data: serving } = await supabase
          .from('tickets')
          .select('number')
          .eq('barber_id', barber.id)
          .eq('status', 'serving')
          .limit(1);

        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('barber_id', barber.id)
          .eq('status', 'waiting');

        return {
          barber,
          nowServing: serving?.[0]?.number ?? null,
          waitingCount: count ?? 0,
        };
      })
    );

    setDisplayData(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    startTransition(() => { fetchData(); });

    const supabase = createClient();

    const channel = supabase
      .channel('display-realtime')
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

    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(clockInterval);
    };
  }, [fetchData]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="page-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-float" style={{ marginBottom: 'var(--space-3)' }}>
            <StyleLogo size={100} />
          </div>
          <p className="text-secondary mt-3">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)' }}>
      {/* Header bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="logo">
          <StyleLogo size={48} showText />
        </div>
        <div className="text-secondary" style={{ fontSize: '1.5rem', direction: 'ltr' }}>
          {formatTime(currentTime)}
        </div>
      </motion.div>

      {/* Display grid */}
      {displayData.length === 0 ? (
        <div className="page-center">
          <div className="text-center">
            <div className="animate-float" style={{ marginBottom: 'var(--space-4)' }}>
              <StyleLogo size={120} />
            </div>
            <p className="heading-2 text-secondary">{t.customer.noBarbers}</p>
          </div>
        </div>
      ) : (
        <div className="display-grid">
          {displayData.map((item, index) => (
            <motion.div
              key={item.barber.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <TicketDisplay
                number={item.nowServing}
                label={t.display.nowServing}
                barberName={item.barber.name}
                size="xl"
              />
              <div className="text-center mt-3">
                <span className="badge badge-waiting" style={{ fontSize: '1rem', padding: 'var(--space-2) var(--space-3)' }}>
                  {t.display.waitingCount}: {item.waitingCount}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

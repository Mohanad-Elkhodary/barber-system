'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startTransition } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import type { BarberWithQueue, Ticket, Barber } from '@/app/lib/types';
import messages from '@/app/lib/i18n/messages';
import BarberCard from '@/app/components/BarberCard';
import BookingForm from '@/app/components/BookingForm';
import StyleLogo from '@/app/components/StyleLogo';

export default function HomePage() {
  const t = messages;
  const router = useRouter();
  const [barbers, setBarbers] = useState<BarberWithQueue[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBarbers = useCallback(async () => {
    const supabase = createClient();

    // Fetch barbers
    const { data: barberRows } = await supabase
      .from('barbers')
      .select('*')
      .order('created_at', { ascending: true });

    if (!barberRows) {
      setBarbers([]);
      setLoading(false);
      return;
    }

    // Get today's start for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For each barber, get queue info
    const enriched: BarberWithQueue[] = await Promise.all(
      barberRows.map(async (barber: Barber) => {
        // Get now serving
        const { data: servingTickets } = await supabase
          .from('tickets')
          .select('number')
          .eq('barber_id', barber.id)
          .eq('status', 'serving')
          .limit(1);

        // Get waiting count
        const { count: waitingCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('barber_id', barber.id)
          .eq('status', 'waiting');

        return {
          ...barber,
          now_serving: servingTickets?.[0]?.number ?? null,
          waiting_count: waitingCount ?? 0,
        };
      })
    );

    setBarbers(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    startTransition(() => { fetchBarbers(); });

    const supabase = createClient();

    // Real-time: listen to barbers + tickets changes
    const channel = supabase
      .channel('home-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barbers' },
        () => fetchBarbers()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => fetchBarbers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBarbers]);

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  const handleSelect = (id: string) => {
    setSelectedBarberId(id);
    setShowBooking(true);
  };

  const handleBookingSuccess = (ticket: Ticket) => {
    setShowBooking(false);
    setSelectedBarberId(null);
    router.push(`/ticket/${ticket.id}`);
  };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <motion.header
          className="header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="logo">
            <StyleLogo size={46} showText />
          </div>

          <div className="header-actions">
            <Link
              href="/display"
              className="btn-header btn-header-ghost"
              title="شاشة العرض للمحل"
            >
              <span>📺</span>
              <span className="hidden-mobile">شاشة المحل</span>
            </Link>

            <Link
              href="/login"
              className="btn-header btn-header-login"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>دخول الحلاق</span>
            </Link>
          </div>
        </motion.header>

        {/* Hero Section */}
        <motion.div
          className="hero-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Ornamental divider */}
          <div className="hero-ornament">
            <StyleLogo size={64} />
          </div>

          <h1 className="heading-1 mb-3">{t.customer.title}</h1>

          {/* Decorative divider */}
          <div className="hero-divider">
            <span className="hero-divider-dot" />
          </div>

          <p className="text-secondary">{t.customer.subtitle}</p>
        </motion.div>

        {/* Barber grid */}
        {loading ? (
          <div className="grid grid-barbers">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 200 }} />
            ))}
          </div>
        ) : barbers.length === 0 ? (
          <motion.div
            className="text-center text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: 'var(--space-7) 0' }}
          >
            <div className="animate-float" style={{ marginBottom: 'var(--space-4)' }}>
              <StyleLogo size={80} />
            </div>
            <p>{t.customer.noBarbers}</p>
          </motion.div>
        ) : (
          <div className="grid grid-barbers stagger">
            {barbers.map((barber) => (
              <BarberCard
                key={barber.id}
                barber={barber}
                selected={selectedBarberId === barber.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <StyleLogo size={24} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} STYLE Barbershop — جميع الحقوق محفوظة
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Link
              href="/display"
              className="text-secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              📺 شاشة العرض
            </Link>
            <span style={{ color: 'var(--border-glass)' }}>•</span>
            <Link
              href="/login"
              className="text-gold"
              style={{ fontSize: '0.8125rem', fontWeight: 600 }}
            >
              💈 دخول الحلاقين
            </Link>
          </div>
        </footer>
      </div>

      {/* Booking modal */}
      <AnimatePresence>
        {showBooking && selectedBarber && (
          <BookingForm
            barberId={selectedBarber.id}
            barberName={selectedBarber.name}
            onSuccess={handleBookingSuccess}
            onClose={() => {
              setShowBooking(false);
              setSelectedBarberId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import type { BarberWithQueue } from '@/app/lib/types';
import messages from '@/app/lib/i18n/messages';

interface BarberCardProps {
  barber: BarberWithQueue;
  selected: boolean;
  onSelect: (barberId: string) => void;
}

/** Get initials from a name for the avatar */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return name.slice(0, 2);
}

export default function BarberCard({ barber, selected, onSelect }: BarberCardProps) {
  const t = messages;
  const isOnline = barber.is_online;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isOnline ? { y: -4, scale: 1.01 } : undefined}
      whileTap={isOnline ? { scale: 0.98 } : undefined}
      className={`card ${isOnline ? 'card-interactive' : ''} ${selected ? 'card-selected' : ''}`}
      onClick={() => isOnline && onSelect(barber.id)}
      style={{ opacity: isOnline ? 1 : 0.5, cursor: isOnline ? 'pointer' : 'not-allowed' }}
      role="button"
      tabIndex={isOnline ? 0 : -1}
      aria-label={`${barber.name} - ${isOnline ? t.common.online : t.common.offline}`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isOnline) {
          e.preventDefault();
          onSelect(barber.id);
        }
      }}
    >
      {/* Header: avatar + name + status */}
      <div className="barber-card-header">
        <div className="barber-avatar">
          {getInitials(barber.name)}
        </div>
        <div className="barber-card-header-info">
          <h3 className="heading-3">{barber.name}</h3>
          <span className={`badge ${isOnline ? 'badge-online' : 'badge-offline'}`}>
            <span className="badge-dot" />
            {isOnline ? t.common.online : t.common.offline}
          </span>
        </div>
      </div>

      {/* Now serving */}
      <div className="mb-3">
        <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
          {t.customer.nowServing}
        </span>
        <div className="now-serving-number animate-glow">
          {barber.now_serving ?? '—'}
        </div>
      </div>

      {/* Waiting count */}
      <div className="flex items-center gap-2">
        <span className="badge badge-waiting">
          {t.customer.waiting}: {barber.waiting_count}{' '}
          {barber.waiting_count === 1 ? t.customer.person : t.customer.people}
        </span>
      </div>

      {/* Selection indicator */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            top: 12,
            insetInlineEnd: 12,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gold-light), var(--gold-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0d0906',
            fontSize: '0.8rem',
            fontWeight: 700,
            boxShadow: '0 2px 12px rgba(201, 168, 76, 0.4)',
          }}
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  );
}

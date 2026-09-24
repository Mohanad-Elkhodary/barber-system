'use client';

import { motion } from 'framer-motion';

interface TicketDisplayProps {
  number: number | null;
  label: string;
  barberName?: string;
  size?: 'md' | 'xl';
}

export default function TicketDisplay({ number, label, barberName, size = 'md' }: TicketDisplayProps) {
  const numberClass = size === 'xl' ? 'now-serving-number-xl' : 'now-serving-number';

  return (
    <motion.div
      className="display-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      {barberName && (
        <div className="display-barber-name">{barberName}</div>
      )}

      <div className="text-secondary" style={{ fontSize: size === 'xl' ? '1.5rem' : '1rem' }}>
        {label}
      </div>

      <motion.div
        key={number}
        className={`${numberClass} animate-glow`}
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
      >
        {number ?? '—'}
      </motion.div>
    </motion.div>
  );
}

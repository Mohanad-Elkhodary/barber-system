'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import messages from '@/app/lib/i18n/messages';
import type { ApiResponse, Ticket } from '@/app/lib/types';

interface BookingFormProps {
  barberId: string;
  barberName: string;
  onSuccess: (ticket: Ticket) => void;
  onClose: () => void;
}

/** Validate Egyptian mobile: 11 digits starting with 010, 011, 012, or 015 */
function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s|-/g, '');
  return /^01[0125]\d{8}$/.test(cleaned);
}

/** Convert local Egyptian number to international format */
function toInternational(phone: string): string {
  const cleaned = phone.replace(/\s|-/g, '');
  if (cleaned.startsWith('+20')) return cleaned;
  if (cleaned.startsWith('20')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+2${cleaned}`;
  return `+20${cleaned}`;
}

export default function BookingForm({ barberId, barberName, onSuccess, onClose }: BookingFormProps) {
  const t = messages;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; server?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) {
      newErrors.name = t.errors.nameRequired;
    } else if (name.trim().length < 2) {
      newErrors.name = t.errors.nameMin;
    }
    if (!phone.trim()) {
      newErrors.phone = t.errors.phoneRequired;
    } else if (!validatePhone(phone)) {
      newErrors.phone = t.errors.phoneInvalid;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, phone, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barber_id: barberId,
          customer_name: name.trim(),
          phone: toInternational(phone),
        }),
      });

      const data: ApiResponse<Ticket> = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ server: data.error || t.errors.serverError });
        return;
      }

      if (data.data) {
        onSuccess(data.data);
      }
    } catch {
      setErrors({ server: t.errors.serverError });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="modal-content"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-2">{t.booking.title}</h2>
            <button
              className="btn btn-ghost"
              onClick={onClose}
              aria-label={t.common.close}
              type="button"
            >
              ✕
            </button>
          </div>

          <p className="text-secondary mb-4">
            {barberName}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-4">
              {/* Name field */}
              <div className="form-group">
                <label htmlFor="customer-name" className="form-label">
                  {t.booking.name}
                </label>
                <input
                  id="customer-name"
                  type="text"
                  className="form-input"
                  placeholder={t.booking.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  autoComplete="name"
                  dir="rtl"
                />
                {errors.name && (
                  <motion.span
                    className="form-error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.name}
                  </motion.span>
                )}
              </div>

              {/* Phone field */}
              <div className="form-group">
                <label htmlFor="customer-phone" className="form-label">
                  {t.booking.phone}
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  className="form-input"
                  placeholder={t.booking.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  autoComplete="tel"
                />
                <span className="form-hint">{t.booking.phoneHint}</span>
                {errors.phone && (
                  <motion.span
                    className="form-error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.phone}
                  </motion.span>
                )}
              </div>

              {/* Server error */}
              {errors.server && (
                <motion.div
                  className="form-error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--red-bg)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {errors.server}
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={submitting}
              >
                {submitting ? t.booking.submitting : t.booking.submit}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/app/lib/supabase/client';
import StyleLogo from '@/app/components/StyleLogo';
import messages from '@/app/lib/i18n/messages';

export default function LoginPage() {
  const t = messages;
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(t.login.error);
      setSubmitting(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="page-center">
      <motion.div
        className="container-narrow"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          {/* Header */}
          <div className="text-center mb-5">
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 'var(--space-3)',
              }}
            >
              <StyleLogo size={80} />
            </div>
            <h1 className="heading-2">{t.login.title}</h1>
            <div className="hero-divider">
              <span className="hero-divider-dot" />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-4">
              {/* Email */}
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">
                  {t.login.email}
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder={t.login.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="login-password" className="form-label">
                  {t.login.password}
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder={t.login.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  autoComplete="current-password"
                />
              </div>

              {/* Error */}
              {error && (
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
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={submitting}
              >
                {submitting ? t.login.submitting : t.login.submit}
              </button>
            </div>
          </form>
        </div>

        {/* Link back to customer page */}
        <div className="text-center mt-4">
          <Link href="/" className="text-secondary" style={{ fontSize: '0.875rem' }}>
            {t.common.back} ← {t.customer.title}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

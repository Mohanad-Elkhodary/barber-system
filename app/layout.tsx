import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'STYLE Barbershop — احجز دورك',
  description:
    'STYLE — صالون حلاقة راقي. اختار حلاقك، احجز دورك، وتابع الطابور لحظة بلحظة.',
  keywords: ['STYLE', 'ستايل', 'حلاق', 'حجز', 'طابور', 'barber', 'barbershop', 'queue'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body style={{ fontFamily: 'var(--font-cairo), sans-serif' }}>
        {children}
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            padding: '12px 16px',
            position: 'fixed',
            bottom: 0,
            left: 0,
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.04em',
            }}
          >
            Developed by{' '}
            <span style={{ color: 'rgba(212,175,55,0.6)', fontWeight: 600 }}>
              Mohanad Elkhodary
            </span>
          </span>
        </div>
      </body>
    </html>
  );
}

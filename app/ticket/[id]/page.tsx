import { createClient } from '@/app/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Ticket } from '@/app/lib/types';
import QueueStatus from '@/app/components/QueueStatus';
import StyleLogo from '@/app/components/StyleLogo';
import messages from '@/app/lib/i18n/messages';

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  const t = messages;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (!ticket) {
    notFound();
  }

  const typedTicket = ticket as Ticket;

  return (
    <div className="page-center">
      <div className="container-narrow">
        {/* Header */}
        <div className="text-center mb-5">
          <Link
            href="/"
            className="logo"
            style={{
              justifyContent: 'center',
              display: 'flex',
              marginBottom: 'var(--space-4)',
            }}
          >
            <StyleLogo size={64} />
          </Link>
          <h1 className="heading-2">{t.ticket.title}</h1>
          <div className="hero-divider">
            <span className="hero-divider-dot" />
          </div>
        </div>

        <QueueStatus
          ticketId={typedTicket.id}
          barberId={typedTicket.barber_id}
          initialTicket={typedTicket}
        />
      </div>
    </div>
  );
}

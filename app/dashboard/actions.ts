'use server';

import { createClient } from '@/app/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/** Get the barber record for the currently logged-in user */
async function getBarber() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: barber } = await supabase
    .from('barbers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return barber;
}

/** Toggle barber online/offline status */
export async function toggleOnline() {
  const supabase = await createClient();
  const barber = await getBarber();
  if (!barber) return { error: 'لازم تسجل دخول' };

  const { error } = await supabase
    .from('barbers')
    .update({ is_online: !barber.is_online })
    .eq('id', barber.id);

  if (error) return { error: 'حصل مشكلة' };
  revalidatePath('/dashboard');
  return { success: true, is_online: !barber.is_online };
}

/** Start serving the next waiting ticket */
export async function serveNext() {
  const supabase = await createClient();
  const barber = await getBarber();
  if (!barber) return { error: 'لازم تسجل دخول' };

  // Check if there's already someone being served
  const { data: currentServing } = await supabase
    .from('tickets')
    .select('id')
    .eq('barber_id', barber.id)
    .eq('status', 'serving')
    .limit(1);

  if (currentServing && currentServing.length > 0) {
    return { error: 'في حد بيتخدم دلوقتي. لازم تخلص الأول.' };
  }

  // Get next waiting ticket (oldest first)
  const { data: nextTickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('barber_id', barber.id)
    .eq('status', 'waiting')
    .order('number', { ascending: true })
    .limit(1);

  if (!nextTickets || nextTickets.length === 0) {
    return { error: 'مفيش حد في الطابور' };
  }

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'serving' })
    .eq('id', nextTickets[0].id);

  if (error) return { error: 'حصل مشكلة' };
  revalidatePath('/dashboard');
  return { success: true };
}

/** Mark the current serving ticket as done */
export async function markDone() {
  const supabase = await createClient();
  const barber = await getBarber();
  if (!barber) return { error: 'لازم تسجل دخول' };

  const { data: servingTickets } = await supabase
    .from('tickets')
    .select('id')
    .eq('barber_id', barber.id)
    .eq('status', 'serving')
    .limit(1);

  if (!servingTickets || servingTickets.length === 0) {
    return { error: 'مفيش حد بيتخدم دلوقتي' };
  }

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'done' })
    .eq('id', servingTickets[0].id);

  if (error) return { error: 'حصل مشكلة' };
  revalidatePath('/dashboard');
  return { success: true };
}

/** Mark the current serving ticket as no-show */
export async function markNoShow() {
  const supabase = await createClient();
  const barber = await getBarber();
  if (!barber) return { error: 'لازم تسجل دخول' };

  const { data: servingTickets } = await supabase
    .from('tickets')
    .select('id')
    .eq('barber_id', barber.id)
    .eq('status', 'serving')
    .limit(1);

  if (!servingTickets || servingTickets.length === 0) {
    return { error: 'مفيش حد بيتخدم دلوقتي' };
  }

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'no_show' })
    .eq('id', servingTickets[0].id);

  if (error) return { error: 'حصل مشكلة' };
  revalidatePath('/dashboard');
  return { success: true };
}

/** Sign out */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

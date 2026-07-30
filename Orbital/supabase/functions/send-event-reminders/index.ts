import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;

// How far ahead to fetch candidate events before filtering precisely in JS —
// generous enough to cover any reasonable reminder_minutes_before value
// without scanning the whole table.
const LOOKAHEAD_HOURS = 6;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface EventRow {
  id: string;
  user_id: string;
  title: string;
  start_at: string;
  reminder_minutes_before: number;
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const now = Date.now();
  const horizon = new Date(now + LOOKAHEAD_HOURS * 60 * 60 * 1000).toISOString();

  const { data: candidates, error: eventsError } = await supabase
    .from('events')
    .select('id, user_id, title, start_at, reminder_minutes_before')
    .not('reminder_minutes_before', 'is', null)
    .is('reminder_sent_at', null)
    .gt('start_at', new Date(now).toISOString())
    .lte('start_at', horizon);
  if (eventsError) {
    console.error(eventsError);
    return new Response(JSON.stringify({ error: eventsError.message }), { status: 500 });
  }

  // Precise "is this reminder due right now" check happens here rather than
  // in SQL, so the interval arithmetic stays visible and easy to test.
  const due = (candidates ?? []).filter((event: EventRow) => {
    const startMs = new Date(event.start_at).getTime();
    return startMs - event.reminder_minutes_before * 60_000 <= now;
  });

  if (due.length === 0) {
    return new Response(JSON.stringify({ eventsNotified: 0, pushesSent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userIds = [...new Set(due.map((e) => e.user_id))];
  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', userIds);
  if (subsError) {
    console.error(subsError);
    return new Response(JSON.stringify({ error: subsError.message }), { status: 500 });
  }

  const subsByUser = new Map<string, PushSubscriptionRow[]>();
  for (const sub of (subs ?? []) as PushSubscriptionRow[]) {
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push(sub);
    subsByUser.set(sub.user_id, list);
  }

  let notified = 0;
  let sends = 0;

  for (const event of due) {
    const userSubs = subsByUser.get(event.user_id) ?? [];
    const minutes = event.reminder_minutes_before;
    const payload = JSON.stringify({
      title: 'Orbital',
      body: `${event.title} starts in ${minutes} minute${minutes === 1 ? '' : 's'}`,
      url: '/',
    });

    if (userSubs.length > 0) notified++;
    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sends++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('push send failed', err);
        }
      }
    }

    // Stamp regardless of whether the user had any live subscriptions, so a
    // reminder for a since-unsubscribed user doesn't get retried forever.
    await supabase.from('events').update({ reminder_sent_at: new Date().toISOString() }).eq('id', event.id);
  }

  return new Response(JSON.stringify({ eventsNotified: notified, pushesSent: sends }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

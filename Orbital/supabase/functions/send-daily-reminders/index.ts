import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;

const DEADLINE_HORIZON_DAYS = 3;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + DEADLINE_HORIZON_DAYS);
  const horizonStr = horizon.toISOString().slice(0, 10);

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth');
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

  for (const [userId, userSubs] of subsByUser) {
    const [tasksRes, goalsRes, milestonesRes] = await Promise.all([
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('due_date', today).neq('status', 'done'),
      supabase.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active').gte('period_end', today).lte('period_end', horizonStr),
      supabase.from('milestones').select('id', { count: 'exact', head: true }).eq('user_id', userId).neq('status', 'completed').gte('target_date', today).lte('target_date', horizonStr),
    ]);

    const taskCount = tasksRes.count ?? 0;
    const deadlineCount = (goalsRes.count ?? 0) + (milestonesRes.count ?? 0);
    if (taskCount === 0 && deadlineCount === 0) continue;

    const parts: string[] = [];
    if (taskCount > 0) parts.push(`${taskCount} task${taskCount === 1 ? '' : 's'} due today`);
    if (deadlineCount > 0) parts.push(`${deadlineCount} deadline${deadlineCount === 1 ? '' : 's'} coming up`);
    const payload = JSON.stringify({ title: 'Orbital', body: parts.join(' · '), url: '/' });

    notified++;
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
  }

  return new Response(JSON.stringify({ usersNotified: notified, pushesSent: sends }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { timingSafeEqualString } from '../_shared/timingSafeEqual.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface HabitRow {
  id: string;
  user_id: string;
  days_of_week: number[];
}

Deno.serve(async (req) => {
  if (!timingSafeEqualString(req.headers.get('x-cron-secret') ?? '', CRON_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const today = new Date().toISOString().slice(0, 10);
  const weekday = new Date().getUTCDay(); // no per-user timezone handling, v1 — same as elsewhere

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
  const userIds = [...subsByUser.keys()];
  if (userIds.length === 0) {
    return new Response(JSON.stringify({ usersNotified: 0, pushesSent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Habits scheduled for today, per user — filtered against today's logs below to
  // find which ones are still outstanding.
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, user_id, days_of_week')
    .in('user_id', userIds);
  if (habitsError) {
    console.error(habitsError);
    return new Response(JSON.stringify({ error: habitsError.message }), { status: 500 });
  }
  const todaysHabitsByUser = new Map<string, HabitRow[]>();
  for (const habit of (habits ?? []) as HabitRow[]) {
    if (!habit.days_of_week.includes(weekday)) continue;
    const list = todaysHabitsByUser.get(habit.user_id) ?? [];
    list.push(habit);
    todaysHabitsByUser.set(habit.user_id, list);
  }
  const todaysHabitIds = [...todaysHabitsByUser.values()].flat().map((h) => h.id);

  const loggedTodayIds = new Set<string>();
  if (todaysHabitIds.length > 0) {
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .in('habit_id', todaysHabitIds)
      .eq('completed_on', today);
    if (logsError) {
      console.error(logsError);
      return new Response(JSON.stringify({ error: logsError.message }), { status: 500 });
    }
    for (const log of logs ?? []) loggedTodayIds.add(log.habit_id);
  }

  let notified = 0;
  let sends = 0;

  for (const userId of userIds) {
    const { count: taskCount } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('due_date', today)
      .neq('status', 'done');

    const habitsToday = todaysHabitsByUser.get(userId) ?? [];
    const habitCount = habitsToday.filter((h) => !loggedTodayIds.has(h.id)).length;

    if ((taskCount ?? 0) === 0 && habitCount === 0) continue; // fully caught up — no nag

    const parts: string[] = [];
    if ((taskCount ?? 0) > 0) parts.push(`${taskCount} task${taskCount === 1 ? '' : 's'}`);
    if (habitCount > 0) parts.push(`${habitCount} habit${habitCount === 1 ? '' : 's'}`);
    const payload = JSON.stringify({
      title: 'Orbital',
      body: `You've still got ${parts.join(' and ')} to finish today`,
      url: '/',
    });

    notified++;
    for (const sub of subsByUser.get(userId) ?? []) {
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

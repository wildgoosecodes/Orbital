import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { timingSafeEqualString } from '../_shared/timingSafeEqual.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;

// How far ahead/back to fetch candidate blocks before filtering precisely in JS —
// generous enough to cover any block duration without scanning the whole table.
const LOOKAHEAD_HOURS = 6;
const LOOKBACK_MINUTES = 30;
const TRANSITION_MINUTES_BEFORE = 5;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface BlockRow {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  start_at: string;
  end_at: string;
  transition_warning_sent_at: string | null;
  start_checkin_sent_at: string | null;
  end_review_sent_at: string | null;
}

type SentColumn = 'transition_warning_sent_at' | 'start_checkin_sent_at' | 'end_review_sent_at';

interface DueNotification {
  block: BlockRow;
  column: SentColumn;
  body: string;
}

Deno.serve(async (req) => {
  if (!timingSafeEqualString(req.headers.get('x-cron-secret') ?? '', CRON_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const now = Date.now();

  // Block reminders are opt-in (profiles.block_reminders_enabled) — separate from
  // whether the user has push enabled at all.
  const { data: enabledProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .eq('block_reminders_enabled', true);
  if (profilesError) {
    console.error(profilesError);
    return new Response(JSON.stringify({ error: profilesError.message }), { status: 500 });
  }
  const enabledUserIds = (enabledProfiles ?? []).map((p) => p.id as string);
  if (enabledUserIds.length === 0) {
    return new Response(JSON.stringify({ blocksNotified: 0, pushesSent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const lookback = new Date(now - LOOKBACK_MINUTES * 60_000).toISOString();
  const horizon = new Date(now + LOOKAHEAD_HOURS * 60 * 60_000).toISOString();

  // Bounded by end_at on the low side (so a block that hasn't ended yet is always a
  // candidate regardless of how long ago it started) and start_at on the high side.
  const { data: candidates, error: blocksError } = await supabase
    .from('time_blocks')
    .select(
      'id, user_id, title, category, start_at, end_at, transition_warning_sent_at, start_checkin_sent_at, end_review_sent_at',
    )
    .in('user_id', enabledUserIds)
    .gte('end_at', lookback)
    .lte('start_at', horizon)
    .or('transition_warning_sent_at.is.null,start_checkin_sent_at.is.null,end_review_sent_at.is.null');
  if (blocksError) {
    console.error(blocksError);
    return new Response(JSON.stringify({ error: blocksError.message }), { status: 500 });
  }

  // Precise "is this trigger due right now" check happens here rather than in SQL,
  // so the interval arithmetic stays visible and easy to test.
  const due: DueNotification[] = [];
  for (const block of (candidates ?? []) as BlockRow[]) {
    const startMs = new Date(block.start_at).getTime();
    const endMs = new Date(block.end_at).getTime();
    const category = block.category || 'your block';

    if (!block.transition_warning_sent_at && startMs - TRANSITION_MINUTES_BEFORE * 60_000 <= now && now < startMs) {
      due.push({ block, column: 'transition_warning_sent_at', body: `Wrap up — ${block.title} (${category}) begins in 5 minutes` });
    }
    if (!block.start_checkin_sent_at && startMs <= now) {
      due.push({ block, column: 'start_checkin_sent_at', body: `Time for ${category}. Ready to go?` });
    }
    if (!block.end_review_sent_at && endMs <= now) {
      due.push({ block, column: 'end_review_sent_at', body: `Did you finish "${block.title}"? Mark complete or incomplete.` });
    }
  }

  if (due.length === 0) {
    return new Response(JSON.stringify({ blocksNotified: 0, pushesSent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userIds = [...new Set(due.map((d) => d.block.user_id))];
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
  const columnsToStampByBlock = new Map<string, Set<SentColumn>>();

  for (const item of due) {
    const userSubs = subsByUser.get(item.block.user_id) ?? [];
    const url = `/app/calendar?date=${item.block.start_at.slice(0, 10)}`;
    const payload = JSON.stringify({ title: 'Orbital', body: item.body, url });

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

    // Stamp regardless of whether the user had any live subscriptions, so a trigger
    // for a since-unsubscribed user doesn't get retried forever.
    const cols = columnsToStampByBlock.get(item.block.id) ?? new Set<SentColumn>();
    cols.add(item.column);
    columnsToStampByBlock.set(item.block.id, cols);
  }

  const nowIso = new Date().toISOString();
  for (const [blockId, columns] of columnsToStampByBlock) {
    const update: Partial<Record<SentColumn, string>> = {};
    for (const col of columns) update[col] = nowIso;
    await supabase.from('time_blocks').update(update).eq('id', blockId);
  }

  return new Response(JSON.stringify({ blocksNotified: notified, pushesSent: sends }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

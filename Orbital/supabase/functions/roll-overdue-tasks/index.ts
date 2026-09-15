import { createClient } from 'npm:@supabase/supabase-js@2';
import { timingSafeEqualString } from '../_shared/timingSafeEqual.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;

Deno.serve(async (req) => {
  if (!timingSafeEqualString(req.headers.get('x-cron-secret') ?? '', CRON_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('tasks')
    .update({ due_date: today, updated_at: new Date().toISOString() })
    .lt('due_date', today)
    .neq('status', 'done')
    .select('id');

  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ tasksRolled: data?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

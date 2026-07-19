import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOOL_ROUNDS = 6;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are Orbital's assistant, embedded in a personal productivity dashboard for tasks, habits, and goals.
Be concise and conversational — this renders in a narrow chat panel, not a document.
Use the tools to read the user's real data before answering questions about it; never guess at counts or status.
When the user asks you to create, update, complete, or delete something, use the matching tool rather than just describing what you'd do.
Dates are ISO strings (YYYY-MM-DD). Today's date is provided in the first system-turn context if relevant — infer "today"/"tomorrow" from it.
If a request is ambiguous (e.g. which task they mean among several similar ones), ask a short clarifying question instead of guessing.`;

const PERIOD_DAYS: Record<string, number> = { weekly: 7, quarterly: 90, yearly: 365 };

const tools: Anthropic.Tool[] = [
  {
    name: 'list_tasks',
    description: "List the user's tasks, optionally filtered by status.",
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['todo', 'in_progress', 'done'], description: 'Filter by status (omit for all).' },
      },
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        due_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        category: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: "Update a task's status, title, priority, due date, category, or description.",
    input_schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        due_date: { type: 'string' },
        category: { type: 'string' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task permanently.',
    input_schema: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] },
  },
  {
    name: 'list_habits',
    description: "List the user's habits along with whether each was already logged today.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'create_habit',
    description: 'Create a new habit to track.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        frequency: { type: 'string', enum: ['daily', 'weekly'] },
      },
      required: ['name', 'frequency'],
    },
  },
  {
    name: 'log_habit',
    description: "Mark a habit done (or undone) for today. Use completed:false to undo an accidental log.",
    input_schema: {
      type: 'object',
      properties: {
        habit_id: { type: 'string' },
        completed: { type: 'boolean', description: 'Defaults to true.' },
      },
      required: ['habit_id'],
    },
  },
  {
    name: 'delete_habit',
    description: 'Delete a habit and its history permanently.',
    input_schema: { type: 'object', properties: { habit_id: { type: 'string' } }, required: ['habit_id'] },
  },
  {
    name: 'list_goals',
    description: "List the user's goals.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'create_goal',
    description: 'Create a new goal. The period start/end dates are computed automatically from period_type starting today.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        period_type: { type: 'string', enum: ['weekly', 'quarterly', 'yearly'] },
      },
      required: ['title', 'period_type'],
    },
  },
  {
    name: 'update_goal_progress',
    description: 'Set a goal\'s progress percentage (0-100). Reaching 100 marks it completed automatically.',
    input_schema: {
      type: 'object',
      properties: {
        goal_id: { type: 'string' },
        progress: { type: 'number', minimum: 0, maximum: 100 },
      },
      required: ['goal_id', 'progress'],
    },
  },
  {
    name: 'delete_goal',
    description: 'Delete a goal permanently.',
    input_schema: { type: 'object', properties: { goal_id: { type: 'string' } }, required: ['goal_id'] },
  },
];

async function runTool(supabase: SupabaseClient, userId: string, name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'list_tasks': {
      let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (input.status) query = query.eq('status', input.status as string);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
    case 'create_task': {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: input.title,
          description: input.description ?? null,
          priority: input.priority ?? 'medium',
          due_date: input.due_date ?? null,
          category: input.category ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case 'update_task': {
      const { task_id, ...rest } = input as { task_id: string; [k: string]: unknown };
      const { data, error } = await supabase
        .from('tasks')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', task_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case 'delete_task': {
      const { error } = await supabase.from('tasks').delete().eq('id', input.task_id as string);
      if (error) throw error;
      return { deleted: true };
    }
    case 'list_habits': {
      const today = new Date().toISOString().slice(0, 10);
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').order('created_at', { ascending: false }),
        supabase.from('habit_logs').select('habit_id').eq('completed_on', today),
      ]);
      if (habitsRes.error) throw habitsRes.error;
      if (logsRes.error) throw logsRes.error;
      const doneToday = new Set(logsRes.data.map((l: { habit_id: string }) => l.habit_id));
      return habitsRes.data.map((h: { id: string }) => ({ ...h, completed_today: doneToday.has(h.id) }));
    }
    case 'create_habit': {
      const { data, error } = await supabase
        .from('habits')
        .insert({ user_id: userId, name: input.name, frequency: input.frequency, target_per_period: 1 })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case 'log_habit': {
      const today = new Date().toISOString().slice(0, 10);
      const completed = input.completed !== false;
      if (completed) {
        const { error } = await supabase
          .from('habit_logs')
          .upsert({ habit_id: input.habit_id, user_id: userId, completed_on: today }, { onConflict: 'habit_id,completed_on' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', input.habit_id as string)
          .eq('completed_on', today);
        if (error) throw error;
      }
      return { habit_id: input.habit_id, completed_today: completed };
    }
    case 'delete_habit': {
      const { error } = await supabase.from('habits').delete().eq('id', input.habit_id as string);
      if (error) throw error;
      return { deleted: true };
    }
    case 'list_goals': {
      const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    case 'create_goal': {
      const periodType = input.period_type as string;
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + (PERIOD_DAYS[periodType] ?? 7));
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          title: input.title,
          period_type: periodType,
          period_start: start.toISOString().slice(0, 10),
          period_end: end.toISOString().slice(0, 10),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case 'update_goal_progress': {
      const progress = input.progress as number;
      const status = progress >= 100 ? 'completed' : 'active';
      const { data, error } = await supabase
        .from('goals')
        .update({ progress, status, updated_at: new Date().toISOString() })
        .eq('id', input.goal_id as string)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case 'delete_goal': {
      const { error } = await supabase.from('goals').delete().eq('id', input.goal_id as string);
      if (error) throw error;
      return { deleted: true };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages is required' }, 400);
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const conversation: Anthropic.MessageParam[] = [...messages];
    const today = new Date().toISOString().slice(0, 10);

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: `${SYSTEM_PROMPT}\nToday's date is ${today}.`,
        tools,
        messages: conversation,
      });

      conversation.push({ role: 'assistant', content: response.content });

      if (response.stop_reason !== 'tool_use') {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n');
        return json({ reply: text || "I didn't get a response for that — try again?" });
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        try {
          const result = await runTool(supabase, user.id, block.name, block.input as Record<string, unknown>);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
        } catch (err) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
            is_error: true,
          });
        }
      }
      conversation.push({ role: 'user', content: toolResults });
    }

    return json({ reply: "That request needed more steps than I could take at once — try breaking it down?" });
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500);
  }
});

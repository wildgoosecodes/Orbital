import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

const MODEL = 'gemini-flash-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_TOOL_ROUNDS = 6;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are Orbital's assistant, embedded in a personal productivity dashboard for tasks, habits, goals, roadmaps, and calendar events.
Be concise and conversational — this renders in a narrow chat panel, not a document.
Use the tools to read the user's real data before answering questions about it; never guess at counts or status.
When the user asks you to create, update, complete, or delete something, use the matching tool rather than just describing what you'd do.
Dates are ISO strings (YYYY-MM-DD); event times are ISO datetimes (YYYY-MM-DDTHH:mm:ss). Today's date is provided in the first system-turn context if relevant — infer "today"/"tomorrow" from it.
If a request is ambiguous (e.g. which task they mean among several similar ones), ask a short clarifying question instead of guessing.

Tasks vs Events: a Task is a to-do with just a due date, no specific time — use it for things to get done sometime that day. An Event has a specific start time (a meeting, appointment, or timed reminder) and an optional reminder that sends a push notification before it starts — use it whenever the user mentions a time ("at 3pm", "10am tomorrow") or asks to be reminded of something.

The roadmap is a hierarchy: Year Goal → Milestones → Goals (weekly/quarterly/yearly) → Tasks or Habits. Tasks are for one-off deliverables; Habits are for building consistency toward a goal. A Goal, Task, or Habit created without a link up the chain is disconnected from the user's plan — avoid that by default.
When the user asks for planning help (e.g. "help me set my quarterly goals", "what should I work on", "break this down"), call list_roadmap first. Look for Year Goals/Milestones that have no quarterly Goals yet, or Goals with nothing under them, and propose a short numbered list of suggested quarterly Goals and/or Tasks/Habits to fill the gap. Ask the user to confirm (or say which ones) before creating anything beyond one obvious, explicitly-requested item.
When you're helping the user figure out how to work toward a specific Goal, ask whether they want a one-off Task or an ongoing Habit for consistency, then create the matching item with goal_id set to that goal.
Never create more than one Goal, Task, or Habit in a single turn unless the user has already explicitly listed multiple items they want added.`;

const ONBOARDING_SYSTEM_PROMPT = `You are Orbital, an AI assistant whose job is to turn a new user's year into a followable roadmap: one or more Year Goals, each broken into Milestones, each broken into smaller Goals, which then get broken into Tasks or Habits.
This is the user's first conversation with you, right after signing up. Keep it short and warm — 3 to 6 conversational turns, not an interrogation. Ask one focused follow-up at a time (e.g. what's motivating this goal, or roughly when milestones should land) rather than a long list of questions.
Once you have enough to work with (even a rough year goal is enough — don't demand excessive detail), use the tools to actually build the roadmap: call create_year_goal once, then create_milestone 2-4 times for that year goal (spaced sensibly across the year, using target_date), then create_goal 1-3 times per milestone for the first milestone or two (goals for later milestones can be added by the user later). Prefer fewer, meaningful milestones/goals over an exhaustive breakdown. You do not need to ask permission for this first layer — propose a sensible plan and build it; they can edit anything afterward.
Then ask one more short question: for these first goals, would they rather work through concrete tasks, or build a daily/weekly habit for consistency? Based on their answer, create 1-2 starter Tasks (with due_date and goal_id set) or a Habit (with goal_id set) for each of those goals — only for what they actually confirm, don't create both for every goal by default.
After that, send a brief closing message confirming it's ready and that they can see and adjust it on the Yearly Goal Tree tab.
Dates are ISO strings (YYYY-MM-DD). Today's date is provided below.`;

const PERIOD_DAYS: Record<string, number> = { weekly: 7, quarterly: 90, yearly: 365 };

type JsonSchema = {
  type: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: string[];
  description?: string;
  minimum?: number;
  maximum?: number;
  items?: JsonSchema;
};

type ToolDef = {
  name: string;
  description: string;
  input_schema: JsonSchema;
};

const tools: ToolDef[] = [
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
    description: 'Create a new task, optionally linked to a roadmap goal via goal_id.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        due_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        category: { type: 'string' },
        goal_id: { type: 'string', description: 'Optional id of the roadmap goal this task ladders up to.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: "Update a task's status, title, priority, due date, category, description, or linked goal.",
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
        goal_id: { type: 'string' },
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
    description: 'Create a new habit to track. Pass goal_id to tie it to a roadmap goal the user is building consistency toward.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        frequency: { type: 'string', enum: ['daily', 'weekly'] },
        goal_id: { type: 'string', description: 'Optional id of the roadmap goal this habit ladders up to.' },
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
    description: "List the user's goals (standalone and roadmap goals alike).",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'create_goal',
    description: 'Create a new goal. The period start/end dates are computed automatically from period_type starting today. Pass milestone_id to place it under a roadmap milestone.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        period_type: { type: 'string', enum: ['weekly', 'quarterly', 'yearly'] },
        milestone_id: { type: 'string', description: 'Optional id of the milestone this goal belongs to.' },
      },
      required: ['title', 'period_type'],
    },
  },
  {
    name: 'update_goal_progress',
    description: "Set a goal's progress percentage, an integer from 0 to 100. Reaching 100 marks it completed automatically.",
    input_schema: {
      type: 'object',
      properties: {
        goal_id: { type: 'string' },
        progress: { type: 'number', description: 'Integer from 0 to 100.' },
      },
      required: ['goal_id', 'progress'],
    },
  },
  {
    name: 'delete_goal',
    description: 'Delete a goal permanently.',
    input_schema: { type: 'object', properties: { goal_id: { type: 'string' } }, required: ['goal_id'] },
  },
  {
    name: 'list_roadmap',
    description: "List the user's full roadmap: year goals with their nested milestones and goals.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'create_year_goal',
    description: 'Create a top-level year goal — the root of a roadmap.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        year: { type: 'number' },
      },
      required: ['title', 'year'],
    },
  },
  {
    name: 'create_milestone',
    description: 'Create a milestone under a year goal — a checkpoint on the way to it.',
    input_schema: {
      type: 'object',
      properties: {
        year_goal_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        target_date: { type: 'string', description: 'ISO date YYYY-MM-DD this milestone should be reached by.' },
        position: { type: 'number', description: 'Order along the roadmap timeline, 0-based.' },
      },
      required: ['year_goal_id', 'title'],
    },
  },
  {
    name: 'list_events',
    description: "List the user's calendar events, optionally within a date range.",
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'ISO datetime lower bound (inclusive), omit for no lower bound.' },
        to: { type: 'string', description: 'ISO datetime upper bound (exclusive), omit for no upper bound.' },
      },
    },
  },
  {
    name: 'create_event',
    description: 'Create a calendar event with a specific start time — for meetings, appointments, or timed reminders. Distinct from a Task, which has no time-of-day.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        location: { type: 'string' },
        start_at: { type: 'string', description: 'ISO datetime, e.g. 2026-08-01T15:00:00' },
        end_at: { type: 'string', description: 'Optional ISO datetime.' },
        all_day: { type: 'boolean', description: 'Defaults to false.' },
        reminder_minutes_before: { type: 'number', description: 'Minutes before start_at to send a push notification reminder. Omit for no reminder.' },
      },
      required: ['title', 'start_at'],
    },
  },
  {
    name: 'update_event',
    description: "Update an event's title, time, location, description, or reminder.",
    input_schema: {
      type: 'object',
      properties: {
        event_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        location: { type: 'string' },
        start_at: { type: 'string' },
        end_at: { type: 'string' },
        all_day: { type: 'boolean' },
        reminder_minutes_before: { type: 'number' },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'delete_event',
    description: 'Delete a calendar event permanently.',
    input_schema: { type: 'object', properties: { event_id: { type: 'string' } }, required: ['event_id'] },
  },
];

function toGeminiSchema(schema: JsonSchema): Record<string, unknown> {
  const { minimum: _minimum, maximum: _maximum, properties, items, type, ...rest } = schema;
  const out: Record<string, unknown> = { ...rest, type: type.toUpperCase() };
  if (properties) {
    out.properties = Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [key, toGeminiSchema(value)]),
    );
  }
  if (items) out.items = toGeminiSchema(items);
  return out;
}

const GEMINI_TOOLS = [
  {
    functionDeclarations: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: toGeminiSchema(tool.input_schema),
    })),
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
          goal_id: input.goal_id ?? null,
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
        .insert({
          user_id: userId,
          name: input.name,
          frequency: input.frequency,
          target_per_period: 1,
          goal_id: input.goal_id ?? null,
        })
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
          milestone_id: input.milestone_id ?? null,
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
    case 'list_roadmap': {
      const [yearGoalsRes, milestonesRes, goalsRes] = await Promise.all([
        supabase.from('year_goals').select('*').order('created_at', { ascending: false }),
        supabase.from('milestones').select('*').order('position', { ascending: true }),
        supabase.from('goals').select('*').order('created_at', { ascending: false }),
      ]);
      if (yearGoalsRes.error) throw yearGoalsRes.error;
      if (milestonesRes.error) throw milestonesRes.error;
      if (goalsRes.error) throw goalsRes.error;

      const goalsByMilestone = new Map<string, unknown[]>();
      for (const goal of goalsRes.data) {
        if (!goal.milestone_id) continue;
        const list = goalsByMilestone.get(goal.milestone_id) || [];
        list.push(goal);
        goalsByMilestone.set(goal.milestone_id, list);
      }
      const milestonesByYearGoal = new Map<string, unknown[]>();
      for (const milestone of milestonesRes.data) {
        const withGoals = { ...milestone, goals: goalsByMilestone.get(milestone.id) || [] };
        const list = milestonesByYearGoal.get(milestone.year_goal_id) || [];
        list.push(withGoals);
        milestonesByYearGoal.set(milestone.year_goal_id, list);
      }
      return yearGoalsRes.data.map((yg: { id: string }) => ({
        ...yg,
        milestones: milestonesByYearGoal.get(yg.id) || [],
      }));
    }
    case 'create_year_goal': {
      const { data, error } = await supabase
        .from('year_goals')
        .insert({
          user_id: userId,
          title: input.title,
          description: input.description ?? null,
          year: input.year,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case 'create_milestone': {
      const { data, error } = await supabase
        .from('milestones')
        .insert({
          user_id: userId,
          year_goal_id: input.year_goal_id,
          title: input.title,
          description: input.description ?? null,
          target_date: input.target_date ?? null,
          position: input.position ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case 'list_events': {
      let query = supabase.from('events').select('*').order('start_at', { ascending: true });
      if (input.from) query = query.gte('start_at', input.from as string);
      if (input.to) query = query.lt('start_at', input.to as string);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
    case 'create_event': {
      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: userId,
          title: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          start_at: input.start_at,
          end_at: input.end_at ?? null,
          all_day: input.all_day ?? false,
          reminder_minutes_before: input.reminder_minutes_before ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case 'update_event': {
      const { event_id, ...rest } = input as { event_id: string; [k: string]: unknown };
      const { data, error } = await supabase
        .from('events')
        .update({ ...rest, reminder_sent_at: null, updated_at: new Date().toISOString() })
        .eq('id', event_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case 'delete_event': {
      const { error } = await supabase.from('events').delete().eq('id', input.event_id as string);
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

type GeminiPart = {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: unknown };
};

type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

const RETRYABLE_STATUS = new Set([429, 503]);

async function callGemini(body: unknown): Promise<Record<string, unknown>> {
  let lastError = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();

    lastError = `Gemini API error ${res.status}: ${await res.text()}`;
    if (!RETRYABLE_STATUS.has(res.status)) throw new Error(lastError);
  }
  throw new Error(lastError);
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

    const { messages, mode } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages is required' }, 400);
    }

    const conversation: GeminiContent[] = messages.map((m: { role: 'user' | 'assistant'; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const today = new Date().toISOString().slice(0, 10);
    const systemPrompt = mode === 'onboarding' ? ONBOARDING_SYSTEM_PROMPT : SYSTEM_PROMPT;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const data = await callGemini({
        systemInstruction: { parts: [{ text: `${systemPrompt}\nToday's date is ${today}.` }] },
        contents: conversation,
        tools: GEMINI_TOOLS,
      });
      const parts: GeminiPart[] = (data.candidates as { content?: { parts?: GeminiPart[] } }[] | undefined)?.[0]
        ?.content?.parts ?? [];
      conversation.push({ role: 'model', parts });

      const functionCalls = parts.filter((p) => p.functionCall);
      if (functionCalls.length === 0) {
        const text = parts
          .filter((p): p is { text: string } => typeof p.text === 'string')
          .map((p) => p.text)
          .join('\n');
        return json({ reply: text || "I didn't get a response for that — try again?" });
      }

      const responseParts: GeminiPart[] = [];
      for (const part of functionCalls) {
        const call = part.functionCall!;
        try {
          const result = await runTool(supabase, user.id, call.name, call.args ?? {});
          responseParts.push({ functionResponse: { name: call.name, response: { result } } });
        } catch (err) {
          responseParts.push({
            functionResponse: {
              name: call.name,
              response: { error: err instanceof Error ? err.message : String(err) },
            },
          });
        }
      }
      conversation.push({ role: 'user', parts: responseParts });
    }

    return json({ reply: "That request needed more steps than I could take at once — try breaking it down?" });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Gemini API error 429') || message.includes('Gemini API error 503')) {
      return json({ error: "The assistant is getting a lot of requests right now — give it a few seconds and try again." }, 503);
    }
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500);
  }
});

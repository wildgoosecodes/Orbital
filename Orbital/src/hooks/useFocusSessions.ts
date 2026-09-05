import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { FocusSession, FocusSessionStatus } from '../types/database';

export interface LogSessionInput {
  task_id: string;
  planned_minutes: number;
  started_at: string;
  /** Active (non-paused) elapsed milliseconds, from FocusMode's own pause
   *  accounting — NOT derived from wall-clock started_at/ended_at, since
   *  that would count time spent paused as focused time. */
  active_ms: number;
  status: FocusSessionStatus;
}

function lastSessionQueryKey(userId: string, taskId: string) {
  return ['lastFocusSession', userId, taskId] as const;
}

/** Most recent completed focus session for a task — powers the "Previous
 *  focus: N minutes" progressive-disclosure line on NowCard. */
export function useLastSession(userId: string, taskId: string | undefined) {
  const queryKey = lastSessionQueryKey(userId, taskId ?? '');
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('task_id', taskId as string)
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as FocusSession | null;
    },
    enabled: !!userId && !!taskId,
  });
  return { lastSession: data ?? null, loading: isLoading };
}

export function useFocusSessions(userId: string) {
  const queryClient = useQueryClient();

  const logSession = useMutation({
    mutationFn: async (input: LogSessionInput) => {
      const endedAt = new Date();
      const actualMinutes = Math.max(1, Math.round(input.active_ms / 60000));
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: userId,
        task_id: input.task_id,
        planned_minutes: input.planned_minutes,
        started_at: input.started_at,
        ended_at: endedAt.toISOString(),
        actual_minutes: actualMinutes,
        status: input.status,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: lastSessionQueryKey(userId, variables.task_id) });
    },
  });

  return {
    logSession: (input: LogSessionInput) => logSession.mutateAsync(input),
  };
}

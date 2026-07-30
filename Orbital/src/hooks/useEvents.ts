import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Event } from '../types/database';

export interface NewEventInput {
  title: string;
  description?: string;
  location?: string;
  start_at: string;
  end_at?: string;
  all_day?: boolean;
  reminder_minutes_before?: number | null;
}

export async function fetchEvents(): Promise<Event[]> {
  const { data, error } = await supabase.from('events').select('*').order('start_at', { ascending: true });
  if (error) throw error;
  return data;
}

export function eventsQueryKey(userId: string) {
  return ['events', userId] as const;
}

export function useEvents(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = eventsQueryKey(userId);

  const { data: events = [], isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: fetchEvents,
    enabled: !!userId,
  });

  const addEvent = useMutation({
    mutationFn: async (input: NewEventInput) => {
      const { error } = await supabase.from('events').insert({
        user_id: userId,
        title: input.title,
        description: input.description || null,
        location: input.location || null,
        start_at: input.start_at,
        end_at: input.end_at || null,
        all_day: input.all_day ?? false,
        reminder_minutes_before: input.reminder_minutes_before ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: NewEventInput }) => {
      const { error } = await supabase
        .from('events')
        .update({
          title: updates.title,
          description: updates.description || null,
          location: updates.location || null,
          start_at: updates.start_at,
          end_at: updates.end_at || null,
          all_day: updates.all_day ?? false,
          reminder_minutes_before: updates.reminder_minutes_before ?? null,
          // A reminder that's already fired should re-arm if the user pushes
          // the event's time out or changes the reminder offset.
          reminder_sent_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    events,
    loading,
    error: error ? (error as Error).message : null,
    addEvent: (input: NewEventInput) => addEvent.mutateAsync(input),
    updateEvent: (id: string, updates: NewEventInput) => updateEvent.mutateAsync({ id, updates }),
    removeEvent: (id: string) => removeEvent.mutateAsync(id),
  };
}

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { eventsQueryKey } from './useEvents';
import { importFromGoogleCalendar, GOOGLE_CLIENT_ID } from '../lib/googleCalendarImport';

export function useGoogleCalendarImport(userId: string) {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  async function runImport() {
    setImporting(true);
    setError(null);
    setImportedCount(null);
    try {
      const rows = await importFromGoogleCalendar();
      if (rows.length > 0) {
        // Dedup relies on the events table's unique (user_id, google_event_id)
        // constraint — safe to click "Import" more than once.
        const { error: upsertError } = await supabase
          .from('events')
          .upsert(
            rows.map((row) => ({ ...row, user_id: userId })),
            { onConflict: 'user_id,google_event_id' },
          );
        if (upsertError) throw upsertError;
      }
      setImportedCount(rows.length);
      await queryClient.invalidateQueries({ queryKey: eventsQueryKey(userId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  return { importing, error, importedCount, runImport, enabled: !!GOOGLE_CLIENT_ID };
}

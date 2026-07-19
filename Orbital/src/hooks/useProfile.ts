import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../types/database';

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!error) setProfile(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function completeOnboarding() {
    if (!userId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
    await refresh();
  }

  return { profile, loading, completeOnboarding };
}

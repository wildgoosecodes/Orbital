/** Asks the existing assistant-chat edge function for a spoken-style morning briefing. */
async function fetchBriefing(supabase) {
  const { data, error } = await supabase.functions.invoke('assistant-chat', {
    body: {
      messages: [{ role: 'user', content: 'Give me my morning briefing.' }],
      mode: 'briefing',
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.reply;
}

module.exports = { fetchBriefing };

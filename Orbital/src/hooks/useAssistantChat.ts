import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Cap how much history is sent to the model — the full transcript stays visible
// in the UI, but a long-running session shouldn't grow the request payload (and
// Gemini token cost) forever.
const MAX_HISTORY_MESSAGES = 20;

/** Single shared conversation — call this once per Dashboard, not once per
 *  AIAssistantPanel instance, so the desktop-sidebar and mobile-tab panels
 *  (both rendered simultaneously, just CSS-hidden depending on viewport)
 *  show the same conversation instead of silently diverging. */
export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Returns the assistant's reply text (or undefined on error) — voice mode
   *  needs the reply directly to speak it, rather than reading it back out
   *  of `messages`, which wouldn't have re-rendered yet at the point this
   *  promise resolves. */
  async function sendMessage(text: string): Promise<string | undefined> {
    const trimmed = text.trim();
    if (!trimmed || sending) return undefined;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setError(null);
    setSending(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('assistant-chat', {
        body: { messages: nextMessages.slice(-MAX_HISTORY_MESSAGES) },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      const reply = data.reply as string;
      setMessages([...nextMessages, { role: 'assistant', content: reply }]);
      return reply;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong reaching the assistant.');
      return undefined;
    } finally {
      setSending(false);
    }
  }

  return { messages, sending, error, sendMessage };
}

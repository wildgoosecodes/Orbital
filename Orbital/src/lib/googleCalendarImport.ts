export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

interface GoogleTokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

let gisScriptPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (gisScriptPromise) return gisScriptPromise;
  gisScriptPromise = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
    document.head.appendChild(script);
  });
  return gisScriptPromise;
}

/** Requests a short-lived, read-only Calendar access token via a popup. Must
 *  be called directly from a user gesture (e.g. a button's onClick) — the
 *  popup gets blocked otherwise. The token is used once and discarded, no
 *  refresh token is requested or stored (this is a one-time import, not an
 *  ongoing sync). */
async function requestAccessToken(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) throw new Error('Google Calendar import is not configured.');
  await loadGisScript();

  return new Promise((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: CALENDAR_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) reject(new Error(resp.error || 'Google sign-in was cancelled.'));
        else resolve(resp.access_token);
      },
    });
    tokenClient.requestAccessToken();
  });
}

interface GoogleEventItem {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}

export interface ImportedEventRow {
  google_event_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
}

function mapGoogleEvent(item: GoogleEventItem): ImportedEventRow | null {
  if (!item.start) return null;
  const allDay = !!item.start.date;
  const start_at = allDay
    ? new Date(`${item.start.date}T00:00:00`).toISOString()
    : new Date(item.start.dateTime!).toISOString();
  const end_at = item.end?.dateTime ? new Date(item.end.dateTime).toISOString() : null;

  return {
    google_event_id: item.id,
    title: item.summary || '(untitled event)',
    description: item.description ?? null,
    location: item.location ?? null,
    start_at,
    end_at: allDay ? null : end_at,
    all_day: allDay,
  };
}

async function fetchGoogleEvents(accessToken: string, timeMin: string, timeMax: string): Promise<ImportedEventRow[]> {
  // singleEvents=true expands recurring events into concrete instances —
  // the events table has no recurrence-rule representation, so this avoids
  // pulling in un-renderable raw recurrence objects.
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    maxResults: '250',
    orderBy: 'startTime',
  });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google Calendar API error ${res.status}`);
  const data = await res.json();
  const items = (data.items ?? []) as GoogleEventItem[];
  return items.map(mapGoogleEvent).filter((e): e is ImportedEventRow => e !== null);
}

/** Imports events from the user's primary Google Calendar within a window
 *  around today. Must be triggered directly by a user click (see
 *  requestAccessToken). */
export async function importFromGoogleCalendar(daysBehind = 7, daysAhead = 60): Promise<ImportedEventRow[]> {
  const accessToken = await requestAccessToken();
  const timeMin = new Date(Date.now() - daysBehind * 86_400_000).toISOString();
  const timeMax = new Date(Date.now() + daysAhead * 86_400_000).toISOString();
  return fetchGoogleEvents(accessToken, timeMin, timeMax);
}

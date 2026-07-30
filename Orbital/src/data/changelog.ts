export interface ChangelogFeature {
  title: string;
  description: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  features: ChangelogFeature[];
}

/** Newest first. Add a new entry here whenever a shipped batch of work is worth telling users about. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.3',
    date: '2026-07-29',
    features: [
      {
        title: 'Calendar events',
        description: 'Add, edit, and delete timed events (not just tasks) on the Calendar tab, with a merged day overview.',
      },
      {
        title: 'Event reminders',
        description: 'Set a reminder on any event and get a push notification before it starts.',
      },
      {
        title: 'Import from Google Calendar',
        description: 'Pull your existing Google Calendar events into Orbital in one click.',
      },
      {
        title: 'Talk to your assistant',
        description: 'Tap the mic icon on the Assistant panel for a full-screen voice mode — ask a question out loud and hear it answered back.',
      },
    ],
  },
  {
    version: '0.2',
    date: '2026-07-26',
    features: [
      {
        title: 'Push notifications',
        description: 'Turn on the bell icon next to your profile for a daily reminder covering tasks due today and upcoming goal deadlines.',
      },
    ],
  },
  {
    version: '0.1',
    date: '2026-07-25',
    features: [
      {
        title: 'Calendar view',
        description: 'A new Calendar tab shows your tasks on a month grid — click any day to see what\'s due and mark it done.',
      },
      {
        title: 'Add to Google Calendar',
        description: 'Tasks with a due date now have a one-click link to add them straight to your Google Calendar.',
      },
      {
        title: 'Task completion celebration',
        description: 'A little confetti and a "nice work" message when you clear every task for the day.',
      },
      {
        title: 'Edit tasks after creating them',
        description: 'Click any task to update its title, description, priority, due date, or category.',
      },
      {
        title: 'Forgot password flow',
        description: 'Reset your password from the login screen if you ever get locked out.',
      },
      {
        title: 'Faster, more reliable AI assistant',
        description: 'The assistant now retries automatically if it gets busy, so a rate limit blip won\'t interrupt your conversation.',
      },
    ],
  },
];

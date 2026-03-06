/**
 * Release notes and version history for Zrytium AI
 * Each release contains version, date, and a list of features/fixes
 */

export interface ReleaseNote {
  version: string;
  date: string;
  highlights: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "1.0.0",
    date: "Feb 24, 2026",
    highlights: [
      "🚀 Initial release of Zrytium AI",
      "✨ Google OAuth authentication with secure token storage",
      "💬 AI-powered chat interface with real-time responses",
      "📝 Auto-generated conversation titles from first message",
      "🔄 Offline message caching with AsyncStorage",
      "🌙 Dark mode and light mode support",
      "📌 Message pinning and reactions",
      "✏️ Message editing and AI regeneration",
      "🎨 Image generation capabilities",
      "⚙️ Settings with Terms of Use and Privacy Policy",
      "🔐 Secure logout and session management",
    ],
  },
];

/**
 * Get the latest release note
 */
export function getLatestRelease(): ReleaseNote {
  return RELEASE_NOTES[0];
}

/**
 * Get all release notes for display
 */
export function getAllReleases(): ReleaseNote[] {
  return RELEASE_NOTES;
}

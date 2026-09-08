/**
 * Safe, cross-platform client storage utility for non-sensitive user preferences.
 * Adheres to OWASP Mobile Application Security Verification Standards (MASVS-STORAGE):
 * - Only non-sensitive user identifiers (e.g. remembered email) may be persisted here.
 * - Sensitive credentials like plaintext passwords MUST NEVER be persisted in this layer.
 */

const REMEMBERED_EMAIL_KEY = 'carelink_remembered_email';

// In-memory fallback for environments where persistent storage is unavailable
let memoryStorage: Record<string, string> = {};

export function getRememberedEmail(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
    } catch {
      // Fallback to in-memory store if localStorage is blocked (e.g. private mode)
    }
  }
  return memoryStorage[REMEMBERED_EMAIL_KEY] || null;
}

export function saveRememberedEmail(email: string): void {
  const sanitizedEmail = email.trim().toLowerCase();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, sanitizedEmail);
    } catch {
      // Ignore storage write errors
    }
  }
  memoryStorage[REMEMBERED_EMAIL_KEY] = sanitizedEmail;
}

export function clearRememberedEmail(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    } catch {
      // Ignore storage errors
    }
  }
  delete memoryStorage[REMEMBERED_EMAIL_KEY];
}

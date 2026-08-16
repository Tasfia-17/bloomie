/**
 * Read the logged-in user from the bloomie_user cookie (client-side only).
 */
export function getBloomieUser(): { email: string; name: string; id: string } | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/bloomie_user=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

/**
 * Set the user cookie.
 */
export function setBloomieUser(user: { email: string; name: string; id: string }) {
  document.cookie = `bloomie_user=${encodeURIComponent(JSON.stringify(user))};path=/;max-age=86400`;
}

/**
 * Clear the user cookie.
 */
export function clearBloomieUser() {
  document.cookie = "bloomie_user=;path=/;max-age=0";
}

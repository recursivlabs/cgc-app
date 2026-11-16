/**
 * Who can read what comes in through the forms. Kept in code rather than an
 * env var so it is one small edit to add someone.
 */
const ADMINS = [
  "felisa@commongroundcampus.com",
  "brent@commongroundcampus.com",
  "jack@minds.com",
  "bill@minds.com",
];

/** The same people, for anywhere that needs the list itself. */
export function adminEmails(): string[] {
  return [...ADMINS];
}

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMINS.includes(email.trim().toLowerCase());
}

/**
 * People who can download ambassador videos but should not read the inbox,
 * such as whoever edits for social. Admins can always see videos too.
 */
const VIDEO_TEAM: string[] = [];

export function canSeeVideos(email?: string | null): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return isAdmin(e) || VIDEO_TEAM.includes(e);
}

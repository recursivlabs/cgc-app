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

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMINS.includes(email.trim().toLowerCase());
}

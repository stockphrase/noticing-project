// src/lib/deriveDisplayName.ts
// Derives a display name from a Dartmouth email address.
// Pattern: firstname.middleinitial.lastname@dartmouth.edu
// e.g. alan.c.taylor@dartmouth.edu → { first: "Alan", last: "Taylor", display: "Alan Taylor" }
// Non-Dartmouth or unparseable emails return empty strings.

export function deriveNameFromEmail(email: string): {
  first: string;
  last: string;
  display: string;
} {
  const empty = { first: "", last: "", display: "" };
  if (!email) return empty;

  const local = email.split("@")[0];
  if (!local) return empty;

  const parts = local.split(".");

  // Need at least two parts (firstname.lastname or firstname.initial.lastname)
  if (parts.length < 2) return empty;

  const capitalize = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  // firstname.lastname → ["alan", "taylor"]
  // firstname.initial.lastname → ["alan", "c", "taylor"]
  const first = capitalize(parts[0]);

  // Last part is always the last name, skip single-char middle initial
  const last = capitalize(parts[parts.length - 1]);

  return { first, last, display: `${first} ${last}` };
}

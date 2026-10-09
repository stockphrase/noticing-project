# Deferred changes

Bugs/improvements found while testing during the teaching term. Nothing here
gets implemented until the term ends — this is a staging list only.

Each entry: what's wrong, why, and a sketch of the fix (not applied yet).

---

## Already shipped (not deferred)

**Logged-out users could not view `/map`** (found 2026-10-09). Middleware
treated `/map` as protected and redirected to `/login`. Fixed by removing
`/map` from `protectedPaths` in `src/middleware.ts` (and the dead duplicate
root `middleware.ts`); the "claim a spot" button now sends logged-out users
to `/login?callbackUrl=/map`.

Because the map is now public, `username` (the email local part, i.e. NetID)
was also removed from the public spot responses: `GET /api/spots`,
`POST /api/spots`, `GET /api/spots/[id]`, `/browse`, and the spot page query.
The map now identifies "my spot" by `spot.userId === me.id` instead of
username.

**Related to item 1:** with `/map` public, anonymous visitors see the same
pooled all-terms spot list item 1 describes. Item 1's fix covers it.

**Cleanup candidates:** the root `middleware.ts` is dead code (Next uses
`src/middleware.ts` when `src/` exists) and can be deleted. `/browse` reads
`searchParams.term` synchronously; verify against the installed Next version
when refactoring it in item 1. `/api/entries?spotId=` is public by design
(same content as `/spot/[id]`).

---

## 1. `/browse` and `/map` disagree on which spots they show

**Found:** 2026-09-24

**Symptom:** Visiting `/browse` only shows the current user's own claimed
spot. Clicking into the map view (`/map`) shows everyone's claimed spots,
flashing dots and all.

**Root cause:** Not a per-user bug — neither page filters by user. It's a
*term*-filtering mismatch:

- `/browse` (`src/app/browse/page.tsx:23-47`) always scopes to a single term
  (`where: { termId: selectedTermId }`), defaulting to the active term.
- `/map` (`src/app/map/page.tsx:55`) calls `fetch("/api/spots")` with no
  `termId`, and `GET /api/spots` (`src/app/api/spots/route.ts:10-25`) treats
  "no termId" as "all spots, from every term ever" (`where = {}`).

So in a database where the active term only has one claimed spot (yours),
`/browse` correctly shows just that one, while `/map` shows every spot from
every past term pooled together. They're answering different questions, not
disagreeing about the same one.

**Desired behavior (per Alan):** Both `/browse` and `/map` should show all
active spots for the *current* term only, and that set should reset
automatically when a new term starts. Neither page should need to know about
past terms to do this.

**Proposed fix (sketch, not applied):**

0. Also: when there is no active term, the map should show a message rather
   than an empty map (the new default returns `[]`).

1. Extract two small shared helpers so "what's the current term" and "what
   spots belong to it" are defined once instead of twice:

   `src/lib/terms.ts` (new):
   ```ts
   import { prisma } from "@/lib/prisma";

   export function getActiveTerm() {
     return prisma.term.findFirst({ where: { status: "active" } });
   }

   export function getBrowsableTerms() {
     return prisma.term.findMany({
       where: { status: { in: ["active", "archived"] } },
       orderBy: { createdAt: "desc" },
     });
   }
   ```

   `src/lib/spots.ts` (new):
   ```ts
   import { prisma } from "@/lib/prisma";

   export function getTermSpots(
     termId: string,
     opts: { search?: string; order?: "asc" | "desc" } = {}
   ) {
     const { search, order = "desc" } = opts;
     return prisma.spot.findMany({
       where: {
         termId,
         ...(search
           ? {
               OR: [
                 { name: { contains: search } },
                 { user: { displayName: { contains: search } } },
               ],
             }
           : {}),
       },
       include: {
         user: { select: { displayName: true, username: true } },
         _count: { select: { entries: true } },
         entries: {
           take: 1,
           orderBy: { createdAt: "desc" },
           select: { createdAt: true },
         },
       },
       orderBy: { createdAt: order },
     });
   }
   ```

2. `src/app/api/spots/route.ts` GET: when no `?termId=` is passed, default to
   the active term instead of returning spots from all time:
   ```ts
   import { getActiveTerm } from "@/lib/terms";
   import { getTermSpots } from "@/lib/spots";

   export async function GET(req: NextRequest) {
     const requestedTermId = req.nextUrl.searchParams.get("termId");
     const termId = requestedTermId ?? (await getActiveTerm())?.id;
     if (!termId) return NextResponse.json([]);
     return NextResponse.json(await getTermSpots(termId));
   }
   ```

3. `src/app/browse/page.tsx`: use the same `getBrowsableTerms()` /
   `getTermSpots()` helpers instead of its own inline Prisma calls, so it and
   the API route can't silently diverge again. Keep the existing `?term=`
   query param support for browsing archived terms — only the *default* (no
   param) behavior needs to change, and it already resolves to the active
   term correctly today.

4. `src/app/api/terms/active/route.ts`: use `getActiveTerm()` too, for the
   same reason.

**Verified safe:** Checked every caller of `GET /api/spots` — the only place
that relies on today's "no termId = all spots ever" behavior is
`map/page.tsx:55` itself (the thing being fixed). No tests, seed scripts, or
other pages depend on the old behavior.

**Risk / things to double check when we implement this:**
- Confirm nothing (e.g. an admin view) actually *wants* an all-terms,
  all-time spot list — grep for other future callers of `/api/spots` before
  removing the "no termId" = "everything" behavior.
- The shared `getTermSpots()` always includes the last-entry timestamp,
  which `/api/spots` consumers don't currently use — harmless extra field in
  the JSON response, but worth a sanity check that no client code chokes on
  unexpected keys (it shouldn't; plain `fetch().json()` usage).

---

## 2. Nothing actually enforces "FirstName LastName" for `displayName`

**Found:** 2026-09-24

**Symptom:** Some students have a single word (just a first name) as their
displayed name, even though the expectation was everyone signs up as
"FirstName LastName."

**Root cause:** No server-side (or schema-level) validation of this format
was ever implemented — it's only an incidental byproduct of the register
form's UI:

- Client: `src/app/register/page.tsx` — has separate "first name" / "last
  name" inputs, both marked `required`, joined as
  `` `${firstName.trim()} ${lastName.trim()}` `` before posting. Nothing
  stops someone from entering a single character as "last name."
- Server: `src/app/api/users/register/route.ts` (around line 9-13, and line
  60) only checks that `displayName` is non-empty, then does
  `displayName: displayName.trim()`. No word-count check, no regex.
- Schema: `prisma/schema.prisma` — `displayName String` is just a required
  string column, no format constraint.
- `seed-admin.js` creates a user directly via `prisma.user.create` with
  `displayName: 'Alan'` — a single word — proving any out-of-band script
  bypasses the convention entirely (this looks like Alan's own admin
  account, not a student, but it shows the pattern).
- `migrate-usernames.js` is unrelated — it only rewrites `username`
  (email-derived), never touches `displayName`.

So single-name students likely got there either by entering a trivial "last
name" in the form, or by being created some other way (admin script, direct
API call) that never touched the form's two-input logic at all.

**Proposed fix (sketch, not applied):**

1. Add real validation in `src/app/api/users/register/route.ts` requiring at
   least two non-trivial words, e.g.:
   ```ts
   const words = displayName.trim().split(/\s+/).filter(Boolean);
   if (words.length < 2 || words.some((w) => w.length < 2)) {
     return NextResponse.json(
       { error: "Please enter your first and last name." },
       { status: 400 }
     );
   }
   ```
2. Decide what to do about existing single-name students already in the
   database — likely a manual/one-off pass (not automatic — need real last
   names, which the app doesn't have) rather than a script, since there's no
   way to invent a last name from existing data.
3. Double-check `seed-admin.js` and any other one-off scripts that create
   users directly — should they also be required to pass through the same
   validation, or are they intentionally exempt (e.g. instructor/admin
   accounts)?

**Open question for Alan:** do we want to *hard-require* two words
(blocking legitimate one-word names/mononyms), or just nudge with a warning?
Worth deciding before implementing.

---

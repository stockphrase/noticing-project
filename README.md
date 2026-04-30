# The Noticing Project

A field journal platform for slow, contemplative observation — built for Dartmouth College.

Students claim a single spot on campus, return to it throughout a 9-week term, and post timestamped observations in text, photos, audio, and video. All journals are public. The instructor manages terms, students, and content from an admin dashboard.

**Full setup and user documentation:** see the [GitHub Pages site](https://stockphrase.github.io/noticing-project/) or `docs/index.html`.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Neon (PostgreSQL via Prisma v5) |
| Auth | NextAuth.js v5 beta — email + password |
| Media | Cloudinary — direct browser upload, auto-compressed |
| Maps | Leaflet + OpenStreetMap |
| Hosting | Vercel |

---

## One-time setup

### 1. Prerequisites

- Node.js v18 or later
- GitHub account
- Vercel account (free) — vercel.com
- Neon account (free) — neon.tech
- Cloudinary account (free) — cloudinary.com

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Neon (database)

1. Create a project at neon.tech
2. In Vercel, go to your project → **Storage → Connect Store → Neon**
3. Vercel adds `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` to your environment variables automatically

### 4. Set up Cloudinary

1. Sign in at cloudinary.com
2. Note your **Cloud Name**, **API Key**, and **API Secret** from the Dashboard
3. Go to **Settings → Upload → Upload presets → Add upload preset**:
   - Preset name: `noticing-project`
   - Signing mode: **Unsigned** (required)
   - Asset folder: `noticing-project`

### 5. Configure environment variables

Create `.env.local` with all your variables (never commit this):

```
POSTGRES_PRISMA_URL="your-neon-pooled-url"
POSTGRES_URL_NON_POOLING="your-neon-direct-url"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="noticing-project"
GEOFENCE_POLYGON='[[[-72.2941,43.7072],[-72.2897,43.7078],[-72.2851,43.7071],[-72.2828,43.7048],[-72.2832,43.7018],[-72.2871,43.6998],[-72.2924,43.7005],[-72.2952,43.7030],[-72.2951,43.7058],[-72.2941,43.7072]]]'
```

Then symlink `.env` to `.env.local` so Prisma can find the variables (Prisma reads `.env`, not `.env.local`):

```bash
ln -s .env.local .env
```

This means one file to maintain. Both `.env` and `.env.local` are already in `.gitignore` so neither gets committed.

### 6. Push the database schema

```bash
npx prisma@5.14.0 db push
```

> Prisma reads `.env` — if you created the symlink in step 5, this just works. If not, temporarily create a `.env` file with your Neon URLs, run the push, then delete it.

### 7. Create your admin account

Create `seed-admin.js` in the project root (add to `.gitignore`):

```js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('YOUR-PASSWORD', 12);
  await prisma.user.create({ data: {
    username: 'adminusername',
    email: 'you@dartmouth.edu',
    displayName: 'Your Name',
    passwordHash: hash,
    role: 'admin',
  }});
  console.log('Admin created');
}

main().finally(() => prisma.$disconnect());
```

Run it with `.env` present, then delete both:

```bash
node seed-admin.js
rm seed-admin.js .env
```

### 8. Deploy to Vercel

```bash
git add -A
git commit -m "initial setup"
git push origin main
```

In Vercel: New Project → Import repo → add environment variables → Deploy.

Add these manually in Vercel → Settings → Environment Variables:
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET` (mark sensitive)
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `GEOFENCE_POLYGON`

Neon variables are added automatically by the Vercel integration.

---

## Each term

### Starting a new term
1. Go to `/admin`
2. Click **Create term** → name it → click **Activate**
3. In the **Registration whitelist** section, paste your class email list (one per line) from your course management system
4. Share the site URL — only whitelisted emails can register

### Registration
- Students register with their email address — no username needed
- Display names are auto-derived from Dartmouth email patterns (`firstname.middleinitial.lastname@dartmouth.edu` → `Firstname Lastname`)
- Students can edit their first name during registration if they prefer a different name
- Login is always by email + password

### During the term
- Students claim a spot on the map, return to it, and post observations
- Entries support markdown: `**bold**`, `*italic*`, `- lists`, `> blockquotes`, `[links](url)`
- Photos, audio (60s max), and YouTube video embeds are supported
- Entries can be edited within 48 hours of posting; deletion is available at any time
- Spot names can be renamed at any time during the term
- Students can abandon a spot and claim a new one (deletes all entries)
- Monitor activity and resolve flagged content from `/admin`

### Admin content moderation
- Students can flag entries for review — flagged entries appear in `/admin`
- As admin, visiting any student's journal at `/spot/[id]` shows delete buttons on all entries
- Both routes delete immediately after a confirmation prompt

### Ending the term
1. Go to `/admin` → click **Archive term**
2. All journals become read-only and remain publicly visible indefinitely
3. Students keep their accounts and can re-enroll in future terms

---

## Geofence

The campus boundary is stored in `GEOFENCE_POLYGON` in Vercel environment variables.

To adjust it:
1. Go to `/admin/geofence`
2. Click points on the map to trace the boundary
3. Click **Copy GeoJSON to clipboard**
4. Paste into `GEOFENCE_POLYGON` in Vercel → Settings → Environment Variables
5. Redeploy

---

## Schema changes

Always use Prisma v5, not the default (which may be v7+):

```bash
# If you have the .env symlink set up, just run:
npx prisma@5.14.0 db push
```

When adding required columns to tables with existing data, always include `@default()`.

---

## Media limits

| Type | Limit |
|---|---|
| Photos | 3 per entry, 20 MB each, auto-compressed to 1200px |
| Audio | 1 per entry, 60 seconds max |
| Video | 1 per entry, 60 seconds max (YouTube embed) |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Students can't claim spots | Check a term is **active** in `/admin` |
| Pin placement rejected | Geofence may be too tight — adjust at `/admin/geofence` |
| Cloudinary uploads failing | Check upload preset is set to **Unsigned** in Cloudinary |
| Registration blocked | Confirm student's email is on the whitelist in `/admin` |
| Login fails with CredentialsSignin | Username is derived from email — `alan.c.taylor@dartmouth.edu` → `alanctaylor` |
| Database errors | Use `npx prisma@5.14.0 db push` — not `npx prisma db push` (v7 breaks the schema) |
| Site not updating | Vercel → Deployments → Redeploy |

---

## Project structure

```
src/
  app/
    api/
      auth/[...nextauth]/   — NextAuth route handler
      spots/                — claim and list spots (geofence checked)
      spots/[id]/           — GET, PATCH rename, DELETE
      entries/              — post and list entries
      entries/[id]/         — PATCH edit (48hr), DELETE, flag
      terms/                — create, activate, archive
      terms/active/         — current active term
      users/register/       — registration (whitelist checked)
      users/me/             — current session user
      media/sign/           — Cloudinary upload signature
      admin/whitelist/      — email whitelist management
      admin/users/[id]/     — delete student account
      admin/flags/[id]/     — resolve flagged content
    admin/                  — instructor dashboard
    admin/geofence/         — campus boundary editor
    map/                    — campus map with spot claiming
    spot/[id]/              — public journal page
    new-noticing/           — compose screen
    browse/                 — public spot directory
    login/                  — sign in (email + password)
    register/               — create account
  components/
    NavClient               — top nav (useSession)
    Lightbox                — full-screen photo viewer
    MarkdownBody            — markdown renderer
    EntryEditor             — inline edit/delete (48hr edit window)
    SpotNameEditor          — inline spot rename
    AbandonSpot             — delete spot with confirmation
    ScrollArrow             — home page scroll hint
    TermManager             — admin term controls
    WhitelistManager        — admin email whitelist
    StudentList             — admin student overview
    FlaggedEntries          — admin content moderation
  lib/
    prisma.ts               — singleton Prisma client
    auth.ts                 — NextAuth config
    cloudinary.ts           — upload signing, media limits
    geofence.ts             — campus boundary check (Turf.js)
    upload.ts               — client-side upload utility
    deriveDisplayName.ts    — name derivation from email
  middleware.ts             — route protection
prisma/
  schema.prisma             — data model
docs/
  index.html                — GitHub Pages documentation site
```

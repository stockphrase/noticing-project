# The Noticing Project

A field journal platform for slow, contemplative observation — built for Dartmouth College.

---

## What this is

Students claim a single spot on the Dartmouth campus map and return to it repeatedly over a 9-week term, posting timestamped text observations with optional photos, audio, and video. All journals are public. The instructor manages terms from an admin dashboard.

---

## One-time setup (do this once, ever)

### 1. Prerequisites
- [Node.js](https://nodejs.org) v18 or later
- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free)
- A [Turso](https://turso.tech) account (free)
- A [Cloudinary](https://cloudinary.com) account (free)

### 2. Clone and install

```bash
git clone https://github.com/YOUR-USERNAME/noticing-project.git
cd noticing-project
npm install
```

### 3. Set up Turso (database)

```bash
# Install the Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Log in
turso auth login

# Create a database
turso db create noticing-project

# Get your connection URL
turso db show noticing-project --url

# Get an auth token
turso db tokens create noticing-project
```

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
- `DATABASE_URL` — your Turso URL (from step 3)
- `DATABASE_AUTH_TOKEN` — your Turso token (from step 3)
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32` to generate one
- Cloudinary values — from cloudinary.com → Settings → API Keys
- `GEOFENCE_POLYGON` — leave the default Dartmouth polygon for now

### 5. Push the database schema

```bash
npm run db:push
```

### 6. Create your admin account

Run this once to seed your admin user (change the values):

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('your-password-here', 12);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'you@dartmouth.edu',
      displayName: 'Instructor',
      passwordHash: hash,
      role: 'admin',
    }
  });
  console.log('Admin created');
}
main().finally(() => prisma.\$disconnect());
"
```

### 7. Run locally

```bash
npm run dev
```

Visit http://localhost:3000. Sign in with your admin credentials, go to `/admin`, and create your first term.

### 8. Deploy to Vercel

```bash
# Push to GitHub first
git add . && git commit -m "initial setup" && git push

# Then in the Vercel dashboard:
# 1. New Project → Import your GitHub repo
# 2. Add all environment variables from your .env.local
# 3. Deploy
```

Every future `git push` auto-deploys. That's it.

---

## Each term

### Starting a new term
1. Go to `/admin`
2. Click "Create term" → name it (e.g. "Spring 2026")
3. Click "Activate" — the map opens for spot claiming
4. Go to the **Registration whitelist** section
5. Paste your class email list from your course management system (one per line)
6. Share the site URL with your students — only whitelisted emails can register

### Whitelist behaviour
- Emails are **reusable across terms** — a returning student just logs in, no re-registration needed
- New students with a whitelisted email register once and are auto-enrolled in the active term
- Students whose email is not on the list see a clear message telling them to contact you
- You can remove individual emails from the whitelist at any time from `/admin`
- The whitelist shows which emails have registered and which haven't yet — useful for chasing stragglers

### During the term
- Students register at `/register`, claim a spot, and begin posting
- You can monitor activity and resolve any flagged content from `/admin`
- Check Cloudinary usage at cloudinary.com/console occasionally

### Ending the term
1. Go to `/admin`
2. Click "Archive term" — all journals become read-only
3. The archived term's journals remain publicly readable indefinitely

### Carrying forward vs. resetting
- **Fresh start**: create a new term. Students re-register or log in and claim new spots.
- **Preserve history**: archived journals stay public at their original URLs forever.
- Students keep their accounts across terms and can re-enroll in the new term.

---

## Geofence

The campus boundary is stored in `GEOFENCE_POLYGON` in your environment variables. To update it:

1. Go to `/admin/geofence` (admin only)
2. Draw or adjust the polygon on the map
3. Click "Export as GeoJSON"
4. Copy the coordinates into your `GEOFENCE_POLYGON` environment variable in Vercel
5. Redeploy (Vercel dashboard → Deployments → Redeploy)

---

## Media limits (enforced automatically)

| Type   | Limit              |
|--------|--------------------|
| Photos | 3 per entry, 20 MB each |
| Audio  | 1 per entry, 60 seconds |
| Video  | 1 per entry, 60 seconds (YouTube embed) |

Images are auto-compressed to max 1200px wide on upload — a 4 MB iPhone photo becomes ~400 KB.

---

## Troubleshooting

**Students can't claim spots** — check that a term is set to "active" in `/admin`.

**"Outside campus boundary" error** — the geofence may need adjustment. Go to `/admin/geofence`.

**Cloudinary uploads failing** — check that your upload preset is set to "Unsigned" in the Cloudinary dashboard under Settings → Upload.

**Database errors** — run `npm run db:push` to re-sync the schema. Check your `DATABASE_URL` and `DATABASE_AUTH_TOKEN` are correct.

---

## Project structure

```
src/
  app/
    api/
      spots/        — claim and list spots
      entries/      — post and read journal entries
      terms/        — create, activate, archive terms
      users/        — registration
      media/        — Cloudinary upload signing
    admin/          — instructor dashboard
    map/            — main campus map view
    spot/[id]/      — individual spot journal (public)
    login/          — sign in
    register/       — create account
  components/
    TermManager     — admin term controls
    StudentList     — admin student overview
    FlaggedEntries  — admin content moderation
  lib/
    prisma.ts       — database client
    auth.ts         — NextAuth configuration
    cloudinary.ts   — media upload helpers
    geofence.ts     — campus boundary check
    upload.ts       — client-side upload utility
prisma/
  schema.prisma     — data model
```

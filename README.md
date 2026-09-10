# Kinetiq

**Move ideas, not keyframes.**

Kinetiq is a browser-based motion-design studio for pitch videos, product launches, app showcases, commercials, and kinetic typography using reusable motion presets and a continuous master timeline.

## Current foundation

- Next.js App Router + TypeScript
- Tailwind CSS
- Zustand editor state
- Zod project schema
- Motion-powered text animations
- Continuous multi-track timeline
- Multiple components per visual layer
- Music tracks
- Split, ripple delete, markers, snapping, zoom, copy/paste, multi-select
- Transitions, keyframes, media import, video speed controls
- Supabase-ready authentication, cloud autosave, project library, and media persistence
- Remotion dependencies for preview/export work

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Supabase setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run `supabase/migrations/001_kinetiq.sql`.
3. In Supabase Authentication, keep Email enabled.
4. Enable the Google provider if you want **Continue with Google**.
5. Add your local and production URLs to Supabase Authentication redirect URLs.
6. Copy the project URL and anon/public key into:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

For Vercel, add both variables under **Project Settings → Environment Variables** and redeploy.

### Auth behavior

Kinetiq keeps guest editing available. A guest can create and edit a project locally, but clicking **Save** or **My Projects** opens authentication.

Supported flows:

- Email + password sign up
- Email + password sign in
- Email confirmation, depending on Supabase Auth settings
- Forgot-password email
- Google OAuth
- Sign out

After sign-in, the current project is preserved and autosaves to the user's account after edits.

### Cloud project data

`projects.project_data` stores the full Kinetiq project document as JSONB. Row Level Security policies restrict project access to the authenticated owner.

### Media persistence

Imported image, video, and audio files initially use browser blob URLs for immediate editing. On authenticated save/autosave, Kinetiq uploads those blobs to the `project-assets` Supabase Storage bucket, replaces the temporary URLs in project JSON with persistent URLs, and records asset metadata in the `assets` table.

The included storage policies only allow an authenticated user to write inside their own user-ID folder.

## Product rule

Kinetiq should stay simpler than a traditional video editor while retaining professional timeline controls:

**Choose → Customize → Move → Export**

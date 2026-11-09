# Hackathon Hub

A Next.js app for publishing hackathon event pages, collecting team submissions, and recording private judge scores. Vercel hosts the app; Supabase's free tier supplies the persistent database, private file storage, and judge sign-in.

## Features

- Public event directory and shareable event pages at `/h/[event-slug]`.
- Team submission form with project details, links, and a private file upload (up to 4 MB).
- First submission creates a random team edit code. The code is shown only once and is required for future edits; keep it somewhere safe and share it with teammates.
- Staff sign-in by email and password using Supabase Auth. Admins create hackathons and their rubric; judges see submissions, download files, and save their own scores and feedback.
- Judges use an expanded eight-category rubric; it is private to the staff portal and never displayed on public event pages.
- Each judge has a separate scorecard for every team. Scores and written feedback are private to the judge who recorded them.

## Supabase setup

1. Create a Supabase project on its free plan.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql).
3. In **Project Settings → API**, copy the project URL, anon key, and service-role key.
4. Add these environment variables to `.env.local` for local work and to Vercel **Project → Settings → Environment Variables** for deployment:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role/secret key |

   Never expose the service-role key in a `NEXT_PUBLIC_` variable or commit it to source control.
5. In **Authentication → URL Configuration**, set the Site URL to your Vercel domain and add `https://YOUR-DOMAIN/judges` to the redirect URL allow list. For local work, also allow `http://localhost:3000/judges`.
6. Create the organizer and judge accounts in **Authentication → Users** with email/password authentication. Assign each account a role in the SQL Editor, replacing the email:

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'organizer@example.com'
   on conflict (user_id) do update set role = excluded.role;
   ```

   Use `'judge'` for a judge account. An account has one role; admins can also use the judging portal. Only trusted staff should be assigned a role.
7. Deploy the project to Vercel and add the same environment variables to the production deployment. Redeploy after setting or changing environment variables.

## Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. If Supabase is not configured, the landing page shows setup guidance. After setup, an organizer can create the first event at `/judges`.

## Upload limits and privacy

Uploads pass through the Vercel function to Supabase Storage, so the app limits a file to 4 MB to stay within Vercel's request-body limit. Files are stored in a private bucket and served to signed-in judges through short-lived download links. Team edit codes are generated randomly, stored only as SHA-256 hashes, and must be retained by the team. This starter app does not include account recovery for lost team codes or an organizer-facing score export.

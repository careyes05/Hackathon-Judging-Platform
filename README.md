# Fordham Hackathon Hub

Submission intake, judging and scoring for a university hackathon. Built on a
starter template, extended until it could actually run an event, and then used
to run one: **19 teams, 7 judges, 60 scorecards, one afternoon.**

Live: https://hackathon-hub-careyes05.vercel.app

> Forked from [SethiDeepika/hackathon-hub](https://github.com/SethiDeepika/hackathon-hub),
> which provided the Next.js + Supabase foundation, the submission flow and the
> judging scorecard. The work described below is what I added on top.

---

## The problem

Two Fordham clubs — the Gabelli Product Management Club and the Fordham
Artificial Intelligence Society — were co-hosting a hackathon in four days.
The starter template handled submissions and let judges score privately, but
it could not produce a result. Judge scores were readable only by the judge
who wrote them, there was no aggregate view, and nothing totalled or ranked
anything. We would have reached the end of demos with scores sitting in a
database and no way to see them.

That gap, plus the event's branding, is what I built.

---

## What I added

### Organizer results view

The core gap. A new admin-only endpoint aggregates every judge's scorecards
for an event and a Results panel renders the outcome: ranking by mean score,
per-category averages, judge coverage, written feedback, and CSV export of
both scores and notes.

The tally rules are in [`lib/results.ts`](lib/results.ts), deliberately
separated from the route so they can be tested without a database. Three
decisions that mattered more than they look:

- **A scorecard counts only when every category is scored.** A half-finished
  card is excluded from the mean and surfaced separately as `+N partial`, so a
  judge who got interrupted cannot drag a team down.
- **Unjudged teams carry a null mean and sort last** rather than a zero, which
  would read as "scored badly" instead of "not yet seen".
- **Judge coverage is shown, not hidden.** A team seen by three judges is not
  directly comparable to one seen by six, so the table flags the gap before
  anyone reads the ranking.

I verified the math against real data with eleven assertions covering the
cases that would quietly corrupt a ranking — partial cards, unjudged teams,
and uneven coverage.

### A design system where there wasn't one

`globals.css` held **132 distinct hardcoded hex values across 154
occurrences**. Six CSS variables existed at the top of the file, which made it
look configurable; it was not. Changing the palette meant hunting scattered
literals.

All of them now resolve through a semantic token block, set to Fordham's
official brand colors. Re-skinning the app is a handful of lines. Success-green
and error-red were deliberately kept as their own tokens rather than being
folded into the brand accent — a success message should not be the same color
as an error.

### Content and branding without a developer

Every heading, label and button string moved into
[`lib/site-config.ts`](lib/site-config.ts), alongside six configurable logo
slots. Club officers can reword the site or move a logo without opening a
component or knowing React.

### Smaller things the event needed

- Event descriptions made optional, since the banner artwork already carried
  the event details
- Two submission buttons with different labels, pointing at the same page,
  collapsed into one — teams were hunting for a second form that did not exist
- Page body extracted into a component so layouts can be reviewed with sample
  data, no database connection required

---

## Running a live event on it

The build was the easy half.

| | |
| --- | --- |
| Teams | 19 |
| Judges scoring | 7 |
| Scorecards saved | 60 |
| Teams with an uploaded deck | 14 |
| Rubric | 8 categories, 0–10 each |

What actually went wrong, and what it taught me:

**Edit codes have no recovery path.** A team's edit code is shown once at
submission and stored only as a hash. Teams that did not copy it could not
edit, so they resubmitted under slightly different names — producing
duplicate entries for the same project. Caught them by matching on repository
URL rather than team name, which is the signal that survives a rename.

**Judge lists do not refresh.** The portal fetches submissions once on load,
with no polling or realtime subscription. A team that submitted after judging
began was invisible to every judge until they reloaded. On the day this meant
one team sitting at zero scores while eight judges worked from a stale list.

**Deleting a team deletes their scores.** Obvious in hindsight, invisible in
the moment. Cleanup that is free before judging opens is destructive twenty
minutes later.

None of these are exotic bugs. They are the difference between software that
demos and software that runs.

---

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Supabase (Postgres, Auth,
Storage) · Vercel

Row-level security is enabled on every table with no public policies — all
data access routes through server-side API routes using the service role, and
judge/organizer authorization is checked per request.

---

## Known limitations

Honest list, in the order I would fix them:

1. **No auto-refresh for judges.** A "submissions changed, reload" banner, or
   a Supabase realtime subscription, would have prevented the worst moment of
   the event.
2. **No edit-code recovery.** Teams should be able to recover access by email
   instead of resubmitting under a new name.
3. **No in-app judge account creation.** Accounts are provisioned directly in
   the database.
4. **No organizer edit for events or submissions.** Corrections require
   database access.
5. **4 MB upload cap**, imposed by routing uploads through a serverless
   function. Uploading directly to Supabase Storage from the browser would
   lift it.

---

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in your own Supabase project
npm run dev
```

Apply [`supabase/schema.sql`](supabase/schema.sql) to a fresh Supabase project
first. Required variables:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only. Bypasses RLS — never expose it to the browser |

---

## Credits

Foundation by [Deepika Sethi](https://github.com/SethiDeepika). Results view,
design system, content configuration and event operations by
[Carlo Reyes](https://github.com/careyes05). Run by the Gabelli Product
Management Club and the Fordham Artificial Intelligence Society,
November 2026.

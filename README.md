# ScholarlyNotes

A full-stack Next.js research center: sign up (with email OTP
verification), build a personal **library** of papers you've read, take
quick **notes** with citations, and write full **paper drafts**
section-by-section — fully customizable sections, figures, project-aware
AI writing assistance, and a clean, organized reference list. Fully
responsive, from phones to desktops.

## Stack

Next.js 14 (App Router) · MongoDB + Mongoose · JWT (jose) in an httpOnly
cookie, verified in Edge middleware · bcryptjs · Nodemailer (SMTP) for
email OTP · Tailwind CSS · Groq (free) or Anthropic (paid) for AI writing
assist.

## 1. Install & configure

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAILS, SMTP_*
npm run dev
```

- `MONGODB_URI` — free tier at https://www.mongodb.com/cloud/atlas.
- `JWT_SECRET` — generate with
  `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.
- `ADMIN_EMAILS` — comma-separated email(s) that get admin access.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` —
  **required for signup to work at all**, since every new account must
  verify a 6-digit code sent by email before they can log in. The
  `.env.example` file walks through the free option: your own Gmail
  account with an App Password. Any other SMTP provider (Resend,
  SendGrid, Mailgun, etc.) works the same way — just change the host/
  port/credentials.
- `GROQ_API_KEY` (optional, free, no card) — enables AI writing assist.

## 2. Deploy (Vercel + MongoDB Atlas)

Push to GitHub → import into Vercel → add `MONGODB_URI`, `JWT_SECRET`,
`ADMIN_EMAILS`, the `SMTP_*` variables, and optionally `GROQ_API_KEY` as
environment variables → deploy.

## Email verification at signup

1. Someone fills out the signup form. The account is created as
   **unverified** — no login session yet — and a 6-digit code is emailed
   to them (expires in 10 minutes, max 5 wrong attempts before they need
   a new one).
2. They enter the code on the same page (it switches to a verification
   step in place) or, if they navigate away, at `/verify-email?email=…`.
3. A correct code marks the account verified and logs them in
   immediately.
4. Logging in with a correct password on an unverified account redirects
   to `/verify-email` instead of an error — so someone who abandoned
   signup mid-way can pick up where they left off, including "Resend
   code" (rate-limited to once per 30 seconds).

Re-submitting the signup form for an email that's already registered but
*not yet verified* refreshes that pending account's details and sends a
new code, rather than blocking it as a duplicate — handles the common
case of someone mistyping something the first time.

## Admin access

Only the email address(es) listed in `ADMIN_EMAILS` ever get `/admin`.
That address is promoted to admin automatically on signup or login. An
existing admin can also promote or demote other accounts by hand from
the `/admin` panel — that manual choice is never silently undone.

## The workspaces

- **Library** (`/library`) — every paper you've read, with metadata,
  abstract, tags, reading status, and your own reading notes.
- **Notes** (`/notes`) — quick Markdown notes with citations, figures,
  and AI assist.
- **Drafts** (`/drafts`) — a full research paper. Starts from the
  standard 8 sections (Abstract → Conclusion, with Implementation) but
  you can **add your own sections** or remove any you don't need.
  `/drafts/[id]/view` assembles every non-empty section into one clean,
  typeset, fully-cited page.
- **Profile** (`/profile`) — edit your details, see an overview of
  everything in your account.
- **Admin** (`/admin`, restricted per above) — every user, their content
  counts, role management, account deletion.

## Feature list

**Citations** — 6 styles, cite-from-library, citation autocomplete
(`[@`), DOI import via Crossref, BibTeX export, duplicate detection.

**Figures** — clean `[Figure N: Caption]` placeholders instead of raw
image data in the editor; the real image only renders in the full page.

**AI writing assist, project-aware** — Expand / Fix grammar / Generate
from a prompt, using the paper's title, other sections, and real
reference list as automatic context, so it cites real `[@key]`s instead
of inventing them. Free via Groq by default.

**Writing** — autosave, Ctrl/Cmd+S, version history, per-section word
targets, a responsive section navigator.

**Finding things** — global search (Ctrl/Cmd+K), tag filters, reading
stats.

**Interface** — dark mode, print/Save-as-PDF, and now a fully responsive
layout everywhere (see below).

## Responsive design

The whole app is built to work from a small phone up to a wide desktop:

- **Navigation**: a proper hamburger menu on screens under `md`
  (`components/Navbar.js`) instead of cramming every nav link into one
  row — was previously prone to wrapping awkwardly on narrow phones.
- **Viewport**: an explicit `viewport` export in `app/layout.js`
  guarantees correct mobile scaling regardless of Next.js defaults.
- **Draft editor**: the section navigator is a horizontal scrollable
  pill bar under `lg`, a sticky vertical list above it; the "Target
  words" input, section title, and "Remove section" control wrap onto
  their own line on narrow screens instead of overflowing.
- **List pages** (Library/Notes/Drafts) and the Figures panel: item rows
  and header controls wrap (`flex-wrap`) instead of forcing a fixed-width
  row that could clip content on small screens.
- **Forms** (signup, login, paper form, note/draft meta fields): already
  used `grid sm:grid-cols-*` patterns that collapse to a single column
  below the `sm` breakpoint.
- **Admin table**: horizontally scrollable (`overflow-x-auto`) rather
  than squeezing columns on phones.

## Project structure

```
app/
  api/auth/...          signup (sends OTP), login (blocks unverified),
                          verify-otp, resend-otp, logout, me
  api/profile/            get/update profile fields
  api/admin/users/          list/promote/delete users (ADMIN_EMAILS only)
  api/notes/, api/papers/, api/drafts/   CRUD + history/duplicate checks
  api/search/                             cross-collection search
  api/ai/generate/                         Groq/Anthropic, context-aware
  notes/…, library/…, drafts/…              the three workspaces
  search/, profile/, admin/                  global search, profile, admin
  verify-email/                                standalone OTP entry page
components/
  NoteEditor, DraftEditor, PaperForm     editors (autosave, Ctrl/Cmd+S,
                                           dynamic sections in DraftEditor)
  OtpVerifyForm                            shared OTP entry UI
  CitedTextarea, FigureManager, AIAssistPanel, CitationManager
  HistoryPanel, CopyBibliographyButton, PrintButton
  KeyboardShortcuts, DarkModeToggle, Navbar (responsive), AuthProvider
lib/
  mongodb, auth (JWT), getCurrentUser, adminEmails, otp, mail (SMTP)
  paperSections — default section templates + slugifyKey() for custom ones
models/        User (role + email verification fields), Note, Paper, Draft
utils/citationFormatter.js   6 citation styles, numbering, BibTeX, markdown
middleware.js   route protection + admin-only gate on /admin
```

## Notes on a few implementation choices

- **OTP codes are hashed** (bcrypt, same as passwords) before being
  stored — never kept in plaintext, and stripped from any API response.
- **Existing deployments**: if you already had users before adding this
  feature, their `emailVerified` field defaults to `false` — they'd be
  locked out until verified. For a fresh deploy there's nothing to do;
  for an upgrade, either backfill `emailVerified: true` for existing
  users in MongoDB directly, or have them go through `/verify-email`
  once (their account already exists, so a login attempt will route
  them there automatically).
- **Admin role in the JWT / dynamic sections / figures**: see the
  "Notes on a few implementation choices" from previous iterations —
  unchanged behavior, still documented here for reference: role changes
  apply on next login; sections are stored as an ordered array (a
  breaking schema change from early fixed-field versions); figures are
  referenced by position, so removing one out of order can leave a
  placeholder pointing at the wrong image.

## What's next (documented, not built — needs a live environment to
build and test safely)

- **In-browser PDF viewer with highlighting** for the library.
- **Real .docx export**.
- **Drag-and-drop section reordering** (sections currently append at
  the end).
- **Projects/Collections** as their own linked entity.
- **Sharing & co-authoring**.

## Discover, related papers, bulk import, and digests

Added on top of the original library/notes/drafts core, all powered by
[OpenAlex](https://openalex.org) (free, keyless, 250M+ works) rather than
Google Scholar, which has no public API and disallows scraping in its
terms of service.

- **`/discover`** — search the open scholarly record, open to visitors
  and logged-in users. "Add to library" on any result goes straight
  through the existing `/api/papers` create flow (same duplicate
  detection as manual/DOI-imported papers).
- **Auto-summarize** — when a paper has an abstract and an AI provider is
  configured (`GROQ_API_KEY` or `ANTHROPIC_API_KEY`), a 2-3 sentence
  plain-language summary is generated automatically on add and shown in
  the library list and paper page (`lib/ai.js`). Regenerate it any time
  from the paper's page. Best-effort — never blocks saving if the AI call
  fails or no key is set.
- **Related papers** — any paper imported via Discover carries its
  OpenAlex ID (`Paper.openalexId`); its page shows a "related papers"
  panel sourced from OpenAlex's citation graph, each addable in one click.
- **Bulk-import an author's works** — `/discover/author`: search an
  author, check which of their papers to add, import them all through
  `POST /api/papers/bulk` (per-item duplicate detection, no AI summary
  generated in bulk to keep imports fast).
- **Weekly digest** — save a search from Discover to follow it
  (`/digests` to manage). `app/api/cron/digest/route.js` checks every
  saved search for new results and emails what's new via the existing
  SMTP setup. It's guarded by `CRON_SECRET` — set that env var and add it
  in your scheduler (Vercel Cron sends it automatically as
  `Authorization: Bearer $CRON_SECRET` once the var is set on the
  project; `vercel.json` in this repo already schedules it for Mondays).
  Each saved query also has a "send test digest now" button on
  `/digests` that runs the same logic without waiting for the cron.
- **Deadline-aware drafts** — a draft can carry an optional target venue
  and submission deadline. The drafts list shows a countdown badge and,
  when section word targets are set, a completion progress bar.


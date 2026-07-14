# SNR Quote Creator

A professional web app for **SNR Group** to create, manage, and share flat cost
estimates (like the "SNR THE ELITE" estimate letter). Works on **web and mobile**.

- **Admin-only login** — a fixed list of admin accounts, no self sign-up
- **Create & edit** quotes with live auto-calculation (Indian ₹ formatting)
- **Vacant plot inventory** — add/edit/delete flats, auto status (Available / Draft / Sold / Rejected)
- **Dashboard** with sortable columns + search
- **Save / Share as PDF** — pixel-faithful to the SNR estimate letter
  (native share sheet on mobile, download on desktop)
- **Real database** — MongoDB, so quotes and vacant plots are shared across
  every device/team member signed in, not stuck on one browser.

## Tech stack (100% free)

| Layer     | Choice                                                      |
| --------- | ------------------------------------------------------------ |
| Framework | Next.js 16 (App Router, TypeScript)                           |
| Styling   | Tailwind CSS v4                                               |
| Auth      | Fixed admin list (env var) + signed cookie session (`jose`)   |
| Database  | MongoDB (Atlas free M0 tier in production, in-memory in dev)  |
| PDF       | @react-pdf/renderer                                           |
| Hosting   | Vercel free tier (optional, also free)                        |

Every layer here has a free tier that comfortably covers a small team.

---

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll land on the sign-in screen first.

No database setup needed for local dev: if `MONGODB_URI` isn't set, an
in-memory MongoDB starts automatically (data resets each time you restart
`npm run dev` — fine for trying things out, not for real data).

### Admin login

Only accounts listed in the `ADMIN_CREDENTIALS` environment variable can sign
in — there is no sign-up form anywhere in the app.

- **Local dev**: `.env.local` already has one admin account (`admin` /
  `admin123`) and a `SESSION_SECRET`. Change these before sharing the project.
- **Format**: `ADMIN_CREDENTIALS=user1:password1,user2:password2` — add as
  many admins as you need, comma-separated.
- **Session secret**: generate one with `openssl rand -base64 32` and set it
  as `SESSION_SECRET`. This signs the login cookie; without it in production,
  the app refuses to issue sessions.
- In development only, unset `ADMIN_CREDENTIALS`/`SESSION_SECRET` fall back to
  an insecure default (`admin`/`admin`) with a console warning — disabled in
  production.

This is a simple, self-contained login suited to a small trusted team. It is
not a full identity provider — no password reset, no roles/permissions beyond
"logged in", no MFA.

## Data & the database

Quotes and vacant plots are both stored in **MongoDB**, via the API routes in
`src/app/api/`. Nothing is stored in the browser anymore, so data is shared
across every device and every admin who signs in.

- **Local dev**: works out of the box with a throwaway in-memory MongoDB — no
  account, no setup. Data does not persist across `npm run dev` restarts.
- **Production**: you must provide a real `MONGODB_URI` (see "Getting a free
  MongoDB database" below) — the app refuses to start up in a usable state
  without it.

---

## What I need from you before this goes live

Two pieces of information turn this from "runs on my machine" into "a real
site with real data that doesn't disappear":

1. **A MongoDB connection string** (`MONGODB_URI`) — see the steps below for
   a free one. Takes about 5 minutes.
2. **The list of admins who should be able to log in** — usernames and
   passwords, in the format `user1:password1,user2:password2`. Pick real
   passwords; these are shown in your Vercel dashboard as plain env vars, so
   don't reuse a password from somewhere sensitive.

Everything else (the `SESSION_SECRET`) I can generate for you, or you can
generate it yourself with `openssl rand -base64 32`.

### Getting a free MongoDB database (MongoDB Atlas)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free
   account.
2. Create a new project, then **Build a Database** → choose the **M0 Free**
   tier → pick any cloud region close to you → create.
3. Under **Security → Database Access**, add a database user with a username
   and password (you'll put these in the connection string).
4. Under **Security → Network Access**, add `0.0.0.0/0` ("Allow access from
   anywhere") — simplest option for a Vercel-hosted app, since Vercel doesn't
   have static IPs.
5. Go to **Database → Connect → Drivers**, copy the connection string. It
   looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<username>`/`<password>` with what you created in step 3 — that
   full string is your `MONGODB_URI`.

The free M0 tier gives 512MB of storage, which is enormous for quotes/flat
data (thousands of quotes would still be a tiny fraction of that).

---

## Deploy for free (Vercel)

1. **Push this project to GitHub** (create a new repo, then
   `git remote add origin ...` and `git push`).
2. Go to https://vercel.com, sign in (free), click **New Project**, and
   import that GitHub repo.
3. Before deploying, add these **Environment Variables** in the Vercel
   project settings:
   - `MONGODB_URI` — your Atlas connection string from above
   - `ADMIN_CREDENTIALS` — e.g. `owner:a-strong-password`
   - `SESSION_SECRET` — output of `openssl rand -base64 32`
4. Click **Deploy**. Vercel builds and hosts it on a free `*.vercel.app`
   domain (you can attach your own domain later, also free on Vercel's side —
   you'd only pay if you buy the domain name itself).

That's the whole deployment — no servers to manage, no Docker, no scaling
config. Vercel's free (Hobby) tier comfortably covers a small internal tool
like this one.

---

## Project structure

```
db/seed/
  vacant-plots.json          Seed data for the vacant plot inventory
  quote-example.json         Example of a quote document's shape
src/
  proxy.ts                    Route guard — redirects to /login when signed out
  app/
    login/page.tsx            Sign-in screen
    actions/auth.ts            Server actions: login, logout
    api/vacants/route.ts       GET (list) / POST (create) vacant plots
    api/vacants/[id]/route.ts  PUT (update) / DELETE a vacant plot
    api/quotes/route.ts        GET (list) / POST (create) quotes
    api/quotes/[id]/route.ts   GET / PUT (update) / DELETE a quote
    page.tsx                   Dashboard (list + search + sort)
    quotes/new/page.tsx        Create quote
    quotes/[id]/page.tsx       View quote + PDF actions
    quotes/[id]/edit/page.tsx  Edit quote
    vacants/page.tsx           Vacant plot inventory
  components/
    LoginForm.tsx              Sign-in form
    Header.tsx                 Shows signed-in admin + Sign Out
    QuotesTable.tsx            Sortable, searchable list
    QuoteForm.tsx              Create/edit form with live summary
    QuotePreview.tsx           On-screen estimate letter
    QuoteDocument.tsx          PDF template (@react-pdf/renderer)
    QuoteActions.tsx           Share / Save PDF / Print / Edit / Delete
    VacantsTable.tsx           Vacant plot inventory table
    AddVacantModal.tsx         Add/edit a vacant plot
    FlatPicker.tsx             Block/Flat picker used in the quote form
  lib/
    mongodb.ts                 DB connection (Atlas in prod, in-memory in dev)
    models/Quote.ts            Mongoose schema for quotes
    models/VacantPlot.ts       Mongoose schema for vacant plots
    admins.ts                  Fixed admin credential check (env var)
    session.ts                 Sign/verify the login session cookie (jose)
    calc.ts                    Cost calculations + ₹ formatting
    store.ts                   Client-side fetch wrappers for /api/quotes
    vacants.ts                 Client-side fetch wrappers for /api/vacants
    types.ts                   Quote type + defaults
```

## Notes

- All monetary figures use the Indian numbering system (lakh/crore).
- A vacant plot's `_id` and a quote's `flatId` are both `"{block}-{flatNo}"`
  (e.g. `"F-805"`) — that's how the app matches a quote back to the flat it's
  for, and how it knows to hide already-Accepted flats from new quotes.

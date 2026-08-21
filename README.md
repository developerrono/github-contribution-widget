# GitHub Contribution Widget

A minimal, mobile-first web app that shows one GitHub account's contribution
graph, streaks, and stats — the kind of thing you open on your phone to
check your streak, not a general-purpose dashboard.

<p align="center">
  <img alt="GitHub Contribution Widget" src="https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20TypeScript-black">
</p>

## ✨ Key Features

- **Native Look & Feel:** Renders a real GitHub-style contribution calendar built directly from response data (no external image embeds or iframe hacks).
- **Streak & Activity Metrics:** Real-time tracking for current streak, longest streak, today's total, weekly totals, and monthly activity.
- **Year-by-Year Navigation:** Seamlessly switch between any year your account has contribution history for.
- **Installable PWA:** Add to your iOS or Android home screen with standard web app manifest support for a native app feel.
- **Secure Architecture:** Your personal GitHub token is locked on the server and is **never** sent to the client browser.
- **In-Memory Caching:** Backend caches API responses for 10 minutes to minimize external calls and respect GitHub rate limits.

---

## What it does

- Shows a GitHub-style contribution calendar for one configured account,
  built from real contribution data (not a screenshot or embed)
- Displays current streak, longest streak, and contributions today /
  this week / this month
- Lets you switch between the years the account actually has data for
- Works as an installable PWA — "Add to Home screen" on Android/iOS
  feels like a small dedicated app
- Keeps your GitHub token on the server only — it is never sent to the
  browser

## Tech stack

| Layer      | Technology                                   |
|------------|-----------------------------------------------|
| Frontend   | React, Vite, TypeScript, Tailwind CSS, lucide-react |
| Backend    | Node.js, Express, TypeScript                  |
| Data source| GitHub GraphQL API (`contributionsCollection`)|
| PWA        | `vite-plugin-pwa` (Workbox service worker)    |

No database is used — the backend calls GitHub on demand and caches the
response in memory.

## Project structure

```
github-contribution-widget/
│
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ContributionCalendar.tsx
│   │   │   ├── ContributionDay.tsx
│   │   │   ├── ContributionStats.tsx
│   │   │   ├── ProfileHeader.tsx
│   │   │   └── YearSelector.tsx
│   │   ├── pages/
│   │   │   └── Home.tsx
│   │   ├── lib/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/                  # PWA icons, favicon
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                      # Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   └── github.ts
│   │   ├── services/
│   │   │   └── github.ts        # GraphQL call + caching + transformation
│   │   ├── utils/
│   │   │   └── streak.ts        # streak math
│   │   ├── types.ts
│   │   └── index.ts
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

The frontend and backend are two independent npm packages with their own
`package.json` and `node_modules` — deploy them separately (or together,
see [Deploying](#deploying) below).

## 1. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend (in a separate terminal / after)
cd client
npm install
```

## 2. Create a GitHub token

1. Go to **GitHub → Settings → Developer settings → Personal access tokens**.
2. Create either:
   - A **fine-grained token** scoped to your own account with read-only
     access, or
   - A **classic token** with no extra scopes needed to read your own
     public contribution/profile data (`read:user` is enough if you want
     to be explicit).
3. Copy the token — GitHub only shows it once.

The widget only ever reads data; it never writes to your account, so the
token needs read access only.

## 3. Configure environment variables

Copy the example file into the backend package and fill it in:

```bash
cp .env.example server/.env
```

## 4. Run the backend

```bash
cd server
npm run dev
```

This starts the API on `http://localhost:5000` (or whatever `PORT` you
set), with `GET /api/github/contributions` and `GET /api/health`.

## 5. Run the frontend

```bash
cd client
npm run dev
```

This starts Vite's dev server (typically `http://localhost:5173`) and
proxies `/api/*` requests to `http://localhost:5000`, so open the Vite
URL in your browser — you don't need to hit the backend port directly.

Open it on your phone (same Wi-Fi network, using your machine's LAN IP
instead of `localhost`) to see the mobile layout.

## 6. Build for production

```bash
# Backend
cd server
npm run build      # outputs to server/dist
npm start          # runs the compiled server

# Frontend
cd client
npm run build       # outputs to client/dist
npm run preview     # optional local check of the production build
```

## Deploying

The frontend and backend are independent and can be deployed separately.

**Backend** — deploy `server/` to any Node host (Render, Railway, Fly.io,
a VPS, etc.). Set `GITHUB_TOKEN`, `GITHUB_USERNAME`, and `PORT` as
environment variables in that host's dashboard — never in a file that
gets committed. If your frontend and backend are on different domains,
also set `CORS_ORIGIN` to your frontend's exact URL so the API only
accepts requests from your site.

**Frontend** — deploy `client/` to Vercel, Netlify, or similar as a
static Vite build. Two common setups:

- **Same domain, different path/proxy**: configure your host to proxy
  `/api/*` to your backend (e.g. a Vercel `rewrites` rule pointing at
  your backend's URL), so the frontend's relative `fetch('/api/...')`
  calls keep working unchanged.
- **Separate domains**: change `client/src/lib/api.ts` to call your
  backend's full URL instead of a relative path, and set `CORS_ORIGIN`
  on the backend to the frontend's origin.

Vercel example for the backend as a serverless function (if you prefer
one platform for both): wrap the existing Express app with
`serverless-http` and add a `vercel.json` routing `/api/*` to the
function — the route/service/util code in `server/src` does not need to
change.

## Security considerations

- **The GitHub token never reaches the browser.** All GitHub GraphQL
  calls happen in `server/src/services/github.ts`, using
  `process.env.GITHUB_TOKEN` read at request time. The frontend only
  ever talks to your own backend's `/api/github/contributions`.
- **Errors are sanitized.** The API route (`server/src/routes/github.ts`)
  catches all failures and returns a generic
  `{ "error": "Unable to load GitHub contributions." }` message with an
  appropriate status code — raw GitHub error text, stack traces, and
  environment details are logged server-side only, never sent to the
  client.
- **No authentication / no user data storage.** This widget shows one
  pre-configured account's public contribution graph. There's no login,
  no session, and no database, which keeps the attack surface small.
- **`.env` is gitignored.** Double-check `server/.env` never gets
  committed — `.gitignore` at the project root already excludes it, but
  it's worth verifying before your first push, especially if you rename
  or move the file.
- **Lock down CORS in production** via `CORS_ORIGIN` so only your
  deployed frontend can call the API.

## How the data is calculated

- **Contribution calendar** comes directly from GitHub's
  `contributionsCollection.contributionCalendar` GraphQL field for the
  selected year, re-grouped into Sunday–Saturday weeks and mapped to
  0–4 intensity levels.
- **Current streak** counts consecutive days with at least one
  contribution, walking backwards from today. If today has zero
  contributions so far, the streak still counts from yesterday rather
  than reporting a broken streak mid-day. Near January 1st, the
  calculation also pulls in the tail end of the previous year's data so
  a streak that started in December isn't cut off at the year boundary.
- **Longest streak** is the longest consecutive run of contribution days
  within the selected year.
- **Today / this week / this month** are only shown for the current
  year (they're not meaningful for past years) and are computed from
  the same clamped, timezone-safe day list used for streaks.
- Responses are cached in memory per `username:year` for 10 minutes to
  avoid hitting GitHub's API on every page load.

## License

Use this however you like for your own contribution widget.

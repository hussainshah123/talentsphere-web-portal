# hrweb — HR Recruiter Platform web app

React 19 + TypeScript + Vite frontend for candidates, recruiters and administrators.

## Requirements

- Node.js 20+
- The API (`hrback`) running on `http://localhost:3100`

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
```

`vite.config.ts` proxies `/api` to `VITE_API_PROXY` (default `http://localhost:3100`), so no CORS
setup is needed in development. For a deployed build set `VITE_API_URL` to the API base URL.

**The backend has to be running too.** The proxy has nothing behind it otherwise, and every API
call comes back `502` — which is a proxy error, not an app error. Start it first:

```bash
cd ../hrback && npm run start:dev    # http://localhost:3100
```

The app now says *“Could not reach the server”* for `502`, `503`, `504` and dead connections
instead of showing the status code, so this failure is recognisable when it happens.

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with API proxy |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Typecheck and production build into `dist/` |
| `npm run preview` | Serve the production build |

## Structure

```
src/
  lib/          API client with refresh-token rotation, auth context, types, formatters
  components/   Layout with role-aware navigation, route guards, toasts, UI primitives
  pages/
    public/     Landing (marketing), sign in, register, email verification, password reset
    candidate/  Onboarding wizard, dashboard, profile, CV & ATS report,
                verification center, recruiter-view preview, jobs, applications, privacy
    recruiter/  Company onboarding and profile, dashboard, candidate search and detail,
                saved candidates and talent pools, jobs, job applicants, job matching, team
    admin/      Dashboard, analytics, verification queue and case review, users,
                companies, reports, CV/ATS monitoring, verification rules, audit logs
    shared/     Messages, notifications, account settings
```

## Behaviour worth knowing

- **`/` is the landing page**, not a login form — signed-out visitors get the marketing site and
  reach sign-in and sign-up from its header. An unknown URL falls back to `/` as well. A signed-in
  visitor hitting `/` is redirected straight to their dashboard.
- **Roles decide routing.** `ProtectedRoute` guards every route; signing in lands candidates on
  `/dashboard`, recruiters on `/recruiter` and staff on `/admin`. Hitting a protected URL while
  signed out bounces to `/login`, and every auth page carries a **Back to site** link — the panel
  that used to carry the brand link is hidden at phone width.
- **Tokens.** Access and refresh tokens are kept in `localStorage`; a 401 triggers a single
  refresh attempt and retries the request before redirecting to sign-in.
- **Server state** goes through TanStack Query. The ATS report view polls while a CV is parsing.
- **Advisory scores are labelled as such** wherever an ATS or match score is shown, per the
  product's ATS and verification disclaimer.
- **Applicants live on the job page.** `/recruiter/jobs/:id` opens with an **Applicants** card —
  the people who actually applied, with their submitted ATS and match scores, cover note and a
  Move control for the pipeline. `/recruiter/jobs` shows an applicant count per job.
  The **Ranked candidates** card below it is sourcing, not applications: those people have not
  applied. Keeping the two apart on the same page is deliberate.
- **Candidates apply from `/jobs`** and track everything on `/applications`. The server refuses an
  application without a CV, so `ApplyButton` checks eligibility first and offers CV upload instead
  of a dead button. Only the recruiter sets a pipeline status and only the candidate withdraws;
  the server enforces both, so the UI only ever offers what that role is allowed to do.
- **The landing page at `/`** is the marketing site: what the product does for each side, the
  mobile app, and which dashboard each role lands on after signing in. Photography is **bundled**
  from Unsplash (`src/assets/landing/`) at two widths behind `srcSet`, not hotlinked — the page
  works offline and no visitor IP reaches a third party. The people pictured are not users, and
  the footer says so; nothing on the page is presented as a testimonial.
- **Landing animation** comes from `src/lib/reveal.ts`: `useReveal` (IntersectionObserver, fires
  once and disconnects), `useCountUp` for the metrics and `useScrollY` for the condensing nav and
  the hero drift. All three return the finished state immediately under
  `prefers-reduced-motion`, and `.reveal` only hides content after JS has decided it can animate —
  so with JS off nothing is invisible.
- **The phone mockups are drawn in CSS**, not screenshots, so they stay sharp at any density and
  follow the theme.
- **`/find-jobs` is the worldwide board** with the full filter set — title and keywords,
  country/state/city, work arrangement, employment type, experience level and range, salary,
  industry, skills, education, posted date, company, work authorisation, visa sponsorship, and
  the two that matter most for remote work: **I can work from** and **my time zone**. Those last
  two read a job structured remote-eligibility field, so a job advertised as remote but limited
  to other countries drops out instead of wasting an application.
- **`/saved-jobs`** is the step before applying. Saving tells the company nothing.
- **Privacy is a three-way choice**, not a toggle: searchable, anonymous (qualifications visible,
  name withheld until you apply) or private (out of search entirely).
- **Recruiters get screening buckets** on a job — strong / potential / review by advisory match —
  plus private hiring-team notes per applicant that the candidate never sees.
- **The sidebar floats.** It is inset from all four edges by `--sidebar-inset`, rounded, and
  lifted with a shadow, so the page ground shows around it. In dark mode it is a *raised*
  surface — it used to be darker than the page, which made a floating panel sink into the
  ground instead of lifting off it — with a hairline so the rounded edge stays legible.
  Three rules depend on that one token agreeing: the margin, the height it subtracts from the
  viewport, and the padding the shell holds open while railed.
- **The collapsed sidebar expands on hover, over the page.** Railed, it leaves the flow and the
  shell holds its 68px open with padding, so widening to 256px floats the panel above the
  dashboard instead of reflowing it. Keyboard focus expands it too, but through
  `:has(:focus-visible)` rather than `:focus-within` — the collapse button lives inside the
  sidebar, so plain focus-within would re-expand the rail the instant you clicked collapse.
  The keyboard case is a React-set class, not `:has(:focus-visible)`: an unsupported
  `:has()` voids the whole rule, which dropped every collapsed style and left full-size
  labels crammed into the 68px rail on older browsers.
  Hover expansion is gated on `@media (hover: hover)`; touch devices keep the tap toggle, and
  below 861px the drawer takes over entirely.
- **Styling** is a small hand-written design system in `src/index.css` — CSS variables, cards,
  tables and form primitives, responsive down to phone width. No UI framework dependency.

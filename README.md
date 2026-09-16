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
    public/     Landing, sign in, register, email verification, password reset
    candidate/  Onboarding wizard, dashboard, profile, CV & ATS report,
                verification center, recruiter-view preview, jobs, applications, privacy
    recruiter/  Company onboarding and profile, dashboard, candidate search and detail,
                saved candidates and talent pools, jobs, job applicants, job matching, team
    admin/      Dashboard, analytics, verification queue and case review, users,
                companies, reports, CV/ATS monitoring, verification rules, audit logs
    shared/     Messages, notifications, account settings
```

## Behaviour worth knowing

- **Roles decide routing.** `ProtectedRoute` guards every route; signing in lands candidates on
  `/dashboard`, recruiters on `/recruiter` and staff on `/admin`.
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
- **Styling** is a small hand-written design system in `src/index.css` — CSS variables, cards,
  tables and form primitives, responsive down to phone width. No UI framework dependency.

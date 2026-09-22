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
    public/     Landing (marketing), public job board and one public job,
                sign in, register, email verification, password reset
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
- **Browsing jobs needs no account.** `/browse-jobs` and `/browse-jobs/:id` are public: the full
  posting, salary band, skills and remote rules are readable signed out, because `GET /jobs`,
  `GET /jobs/facets` and `GET /jobs/:id` are `@Public()` on the API and only ever return published
  jobs from verified companies. Applying is the line that needs an account, and a signed-out
  visitor cannot reach any write route: the server still answers 401.
- **The apply gate names the job and both doors.** `GuestApplyGate` is the apply control on a
  public job. A signed-in candidate gets the real `ApplyButton` — the same one the board behind
  the login uses — so they apply on the job they are reading, not on a dashboard they were
  redirected to. A visitor gets a dialog that names the job and offers two *labelled* choices,
  **I already have an account** and **I am new here**, because two plain buttons make the reader
  guess which one is meant for them.
- **`?next=` carries you back.** The gate sends `/login?next=/browse-jobs/:id` (or `/register`),
  sign-in and sign-up honour it, and it survives `/verify-email` — which also grows a *Skip for
  now and carry on* link when a `next` is set, since verification is the first verification check
  rather than a gate on using the account. `safeNext` in `src/lib/next.ts` is the one place that
  decides a return path is allowed: in-app paths only, so an absolute, protocol-relative or
  backslashed value cannot turn the auth pages into an open redirect, and auth paths themselves
  are rejected so the flow cannot loop. `Login` also honours the `state.from` that
  `ProtectedRoute` sets when it bounces a signed-out visitor off a guarded page — that used to be
  recorded and then ignored.
- **Roles decide routing.** `ProtectedRoute` guards most routes; signing in lands candidates on
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
  once and disconnects), `useCountUp` for the metrics and `useScrollY` for the condensing nav, the
  hero drift and the `ScrollProgress` hairline. All three return the finished state immediately
  under `prefers-reduced-motion`, and `.reveal` only hides content after JS has decided it can
  animate — so with JS off nothing is invisible. The headline sets itself a word at a time and the
  hero carries two very slow `.hero-aurora` washes.
- **Content that answers a question never waits on the observer.** Job cards and the body of one
  job use a plain CSS entrance animation, not `.reveal`: a marketing section can afford to stay
  hidden until it is scrolled to, a list of search results cannot. Scroll-reveal stays on the
  marketing bands.
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
- **The card and the page ground are never the same colour.** White cards on a near-white page
  read as one flat white sheet with some lines drawn on it, so light mode has four paper steps:
  `--paper` (#ffffff) is the card, `--paper-1` (#eff0f6) is the ground under it, and `--paper-2` /
  `--paper-3` are tints *inside* a card for hover rows and recessed fields. Pull the ground up
  towards the card and the whole UI goes flat again.
- **The theme is one system, not two.** Every colour is a token in `:root`, redefined under
  `[data-theme='dark']`; nothing hardcodes a hex. Indigo is the brand and amber its warm
  counterweight; the ink takes a blue undertone so the darkest surfaces — sidebar, toasts, the CTA
  band — sit in the same family as indigo rather than arguing with it. Green survives, but it now
  means **success** and nothing else, which is why the ATS ring and the verified badge are still
  green while nothing else is. Shadows are tinted with the ink rather than neutral black, so a
  raised surface looks lit by the same room as everything under it, and `--elevate` adds the
  one-pixel highlight along its top edge.
- **Four gradients, each with a job.** `--grad-primary` fills the thing you click (and its
  `-hover` pair); `--grad-text` sets the emphasised word in a headline; `--grad-brand` runs indigo
  all the way to amber for the brand mark and small accents; `--grad-wash` is the almost-invisible
  field behind a hero. Everything else stays flat, because a gradient on every surface reads the
  same as none. Two rules learned the hard way: **meaning stays flat** — a warning or danger bar
  overrides `background-image: none`, so only the brand is ever a gradient — and **display type
  stays in the cool half of the ramp**, because indigo-to-amber across a single word passes
  through a grey-brown that looks like a printing fault. An SVG stroke cannot take a CSS gradient,
  so the score ring defines its own `<linearGradient>` with a `useId()` id per instance.
- **The primary action carries the brand; ink is for chrome.** `.btn` fills with `--brand`, so a
  button is indigo in both themes. Ink is reserved for surfaces you do not click — the sidebar, a
  toast, the closing CTA band (where the pair inverts and the primary goes solid white).
- **Dark is not the light theme inverted.** Indigo has to climb a long way to survive a dark
  field: `#4338ca` is nearly invisible on `#0b0c13`, so dark uses the periwinkle end of the ramp
  (`#8b87f5`) with dark type on top. The four surface steps are even, so elevation reads without
  borders doing all the work. The one rule to know when adding a button: `[data-theme='dark']`
  fills primary buttons with brand, and anything that is *chrome* rather than a primary action
  (ghost, icon, filter chip, the sidebar's own controls) has to be named in that rule's `:not()`
  chain or it turns indigo.
- **Dialogs render into `document.body`.** `Modal` portals itself there rather than staying where
  it is written. `position: fixed` is only relative to the viewport while no ancestor is a
  containing block for it, and a transform — including one an animation is applying — makes one;
  an ancestor that also clips its overflow then traps the dialog inside itself. The job cards do
  exactly that: they lift on hover and hide overflow, so the apply dialog opened *inside the
  card*. Portalling puts every dialog in the app beyond the reach of that, and the backdrop sits
  at `z-index: 80` — over the sidebar (50) and the scroll progress (55), under toasts (100).
- **Motion is state, not decoration.** Buttons lift on hover and sink on press, inputs and rows
  answer the pointer, badges scale in because one usually replaces another, the page itself rises
  on every navigation (`.page` is keyed on the pathname so the animation re-runs), and toasts come
  in from the edge they live on. All of it collapses under `prefers-reduced-motion` through the
  one global rule.
- **The sidebar floats.** It is inset from all four edges by `--sidebar-inset`, rounded, and
  lifted with a shadow, so the page ground shows around it. In dark mode it is a *raised*
  surface — it used to be darker than the page, which made a floating panel sink into the
  ground instead of lifting off it — with a hairline so the rounded edge stays legible.
  Three rules depend on that one token agreeing: the margin, the height it subtracts from the
  viewport, and the padding the shell holds open while railed.
- **The sidebar is a rail that expands on hover.** There is no collapse toggle — a control whose
  only job is to undo the default is a control you have to explain. On a wide screen with a
  pointer it sits at 68px showing icons only; hovering widens it to 256px. Railed, it leaves the
  flow and the shell holds its 68px open with padding, so widening floats the panel *above* the
  dashboard instead of reflowing it under the pointer.
  Keyboard focus widens it too — a keyboard user has no pointer — through a class React sets on
  real `:focus-visible`. Not CSS: `:focus-within` also fires on a mouse click, so the rail would
  stay open after every navigation, and an unsupported `:has(:focus-visible)` voids the whole
  rule, which dropped every collapsed style and left full-size labels crammed into the 68px rail
  on older browsers.
  The whole rail block is gated on `@media (min-width: 861px) and (hover: hover)`. A wide *touch*
  screen has no pointer to widen it with and no hamburger either — that is phone-width only — so
  there the sidebar simply stays full width. Below 861px the drawer takes over entirely.
- **The unread marker is a badge, not a dot on the glyph.** It clears the notification button's
  corner with a ring in the page colour; inside the border it collided with the bell and read as
  part of it. It does not blink either: a marker that spends half its life at 35% opacity looks
  like a rendering fault, and it means the same thing the whole time it is there.
- **Styling** is a small hand-written design system in `src/index.css` — CSS variables, cards,
  tables and form primitives, responsive down to phone width. No UI framework dependency.

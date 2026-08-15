# TODO — Inkbase Audit Trail

This file is a living document. Append — never overwrite previous entries.

---

## 2026-08-10 — Harden authentication (JWT) per flagged issues

Developer approved fixing all flagged auth issues from the Phase 2 review,
highest priority first: prod secret enforcement, XFF/rate-limit bypass,
login timing leak, iss/aud claims, server-side logout (revocation), refresh
tokens, and a client-side auto-refresh seam.

### Goalposts

1. **GP1 — Prod `JWT_SECRET` fail-fast.** `jwtSecret()` returns an error when
   `APP_ENV=production` runs without a real secret; `NewService()` validates at
   boot. Removes the token-forgery risk from the hardcoded dev fallback.
2. **GP2 — `TRUST_PROXY` gating.** `clientIP()` in `ratelimit.go` only honors
   `X-Forwarded-For`/`X-Real-IP` when `TRUST_PROXY` is set, closing the
   rate-limit bypass via header spoofing. Documented in env guide.
3. **GP3 — Login timing equalizer.** Dummy bcrypt compare when the email is
   unknown so user enumeration via response timing is neutralized.
4. **GP4 — `iss`/`aud` claims.** Tokens stamped with issuer + audience and
   validated at verify time.
5. **GP5 — Server-side sessions.** New `sessions` table; `VerifyToken` becomes
   a service method that checks session existence; `RequireAuth` wired to the
   service; login/register create a session row per sign-in.
6. **GP6 — Real logout.** `logout.go` revokes the session server-side and the
   handler clears both cookies. Logged-out tokens die instantly instead of
   remaining valid for 24 h.
7. **GP7 — Refresh tokens.** Access JWT TTL drops to 15 min; opaque rotating
   refresh cookie (7 d) exchanged at `POST /api/auth/refresh` for a fresh
   access JWT + rotated refresh token. Replayed old refresh tokens are dead.
8. **GP8 — Client `apiFetch` wrapper.** 401 → `/api/auth/refresh` → retry once.
   Seam for future authenticated client calls (no authenticated consumer yet).

---

## 2026-08-10 — Post-mortem: auth hardening

Document the auth-hardening session as an incident-style post-mortem covering
what was finished and which problems were fixed, per developer request.

### Goalposts

1. **G1 — Write `docs/post-mortems/2026-08-10-auth-hardening.md`.** Summary,
   what was finished, each problem fixed (root cause → impact → fix →
   verification), timeline, open items, lessons.
2. **G2 — Update `docs/README.md` contents; append `TODO.md` entry; commit.**

---

## 2026-08-11 — Replace Next.js template with Inkbase landing page

Delete the App Router template (`src/app/`) and serve the real product landing
page at `/` from the Pages Router. The landing lives in a self-contained
`client/landing-page/` module (own `lib/`, `components/ui/`, `pages/`) wired in
via a thin `src/pages/index.tsx` re-export. Hero tailored to the Inkbase
concept ("PR reviews, but for writing" — warm paper, purple accent, Lobster
wordmark, bond-paper manuscript preview with inline AI suggestions). Replaces
all external/Tailus assets with the actual app concept + lucide icons + onboarding
personas.

### Goalposts

1. **G1 — Router consolidation.** Delete `client/src/app/` (page.tsx, layout.tsx,
   globals.css). Move globals.css → `client/src/globals.css`, add
   `@source "../landing-page"` for Tailwind v4 detection, fix template leftover
   (`--font-geist-*` vars never defined). Rewire `_app.tsx` import to
   `../globals.css`. Extend `_document.tsx` `<Head>` with favicons + default
   title/description (previously in layout.tsx metadata). Verify auth/dashboard/
   demo still render.
2. **G2 — Landing base kit.** Install `class-variance-authority` +
   `@radix-ui/react-slot`. Create `landing-page/lib/utils.ts` (cn =
   clsx + twMerge), `components/ui/button.tsx` (shadcn-style, cva + Slot),
   `components/animated-group.tsx` (stagger), `components/text-effect.tsx`
   (rotating word), `components/logo.tsx` (Lobster + Sparkles).
3. **G3 — Hero.** Create `components/manuscript-preview.tsx` (bond-paper mockup,
   inline AI suggestions, animated SVG cursor) + `components/hero-section.tsx`
   (nav, badge, headline, CTAs → /auth/signup + /auth/login, personas row).
4. **G4 — Wire up.** Create `landing-page/pages/landing.tsx` +
   `src/pages/index.tsx` (re-export). Full verification: lint, build, curl `/`
   (landing hero), `/auth/login`, `/dashboard`, `/demo` all 200. Commit.

---

## 2026-08-13 — Redesign landing page post-hero section (Claymorphic Green)

Redesign the post-hero section (`client/landing-page/components/features-section.tsx`) to match the requested dark clay-green visual style inspired by Lovable.dev layout, featuring high-impact hero typography, full-width responsive clay container, and dual-shadow claymorphic feature cards.

### Goalposts

1. **GP1 — Add Claymorphic Green CSS utilities.** Update `client/src/globals.css` with claymorphism classes (`.clay-container-green`, `.clay-card-green`) utilizing dual soft shadows, top-left highlight borders, and matte green gradients.
2. **GP2 — Redesign FeaturesSection component.** Overhaul `client/landing-page/components/features-section.tsx` into a high-fidelity dark clay-green feature section with headline *"For writing and beyond"*, subtitle, and 4 structured claymorphic feature cards.
3. **GP3 — Verification & Commit.** Verify Next.js build, test visual layout across mobile/desktop, and commit changes following git conventions.

---

## 2026-08-16 — DynamoDB documents service & multi-format support

Delete dummy mock data and implement a fully-featured documents service with DynamoDB persistence (production) and local in-memory store (dev/testing), full multi-format parsing, editing, and export capabilities for `.docx`, `.pdf`, `.txt`, `.md`, `.epub`, `.rtf`, and `.odt`, and live dashboard API integration.

### Goalposts

1. **GP1 — Document Domain Models & Storage (`server/services/documents/`).** Create `models.go`, `db.go` (DynamoDB client + in-memory store for tests/dev), `service.go`.
2. **GP2 — Format Parsing & Manipulation Engine (`server/services/documents/`).** Implement `parse.go` and `export.go` for `.docx`, `.pdf`, `.epub`, `.odt`, `.rtf`, `.md`, and `.txt`.
3. **GP3 — Document CRUD Operations (`server/services/documents/`).** Implement `create.go`, `get.go`, `list.go`, `update.go`, `delete.go` with free-tier limit enforcement.
4. **GP4 — HTTP API Endpoints & Route Wiring (`server/internal/api/documents.go`).** Implement thin HTTP handlers, wire routes to `server.go`, and add comprehensive automated test suite (`tests/documents_test.go`).
5. **GP5 — Client Integration & Dummy Data Cleanup.** Remove mock `DOCUMENTS` data in `client/src/components/documents/data.ts`, wire `client/src/pages/dashboard.tsx` to `/api/documents` (fetch, import file, delete, free-tier limit tracking).
6. **GP6 — End-to-End Verification & Walkthrough.** Run full test suite across server and client, verify format roundtrip and API endpoints.

---

## 2026-08-16 — Redesign document card paper sheet & footer

Redesign the document card UI component so that the preview is styled as the crisp physical paper sheet itself with sharp rectangular edges (`rounded-none`), subtle paper border, and realistic sheet drop-shadow, while the bottom metadata bar containing title, edit date, and context menu is soft-edged (`rounded-b-2xl`).

### Goalposts

1. **GP1 — Redesign `DocumentCard`.** Update `client/src/components/documents/document-card.tsx` to use sharp paper sheet aesthetic for the top body and soft rounded styling for the bottom metadata section.
2. **GP2 — Redesign `NewDocumentCard`.** Update `client/src/components/documents/new-document-card.tsx` to mirror the sharp paper sheet action area and soft bottom section.
3. **GP3 — Verification & Commit.** Verify live frontend rendering and commit with git conventions.

---

## 2026-08-16 — Top Recent Writing Spotlight with playful remark

Add a top spotlight section featuring the user's most recent manuscript alongside a playful editorial remark card ("Ready to jump back in, chief?"), quick stats, and a "Resume Writing" CTA, keeping the general projects/manuscripts grid cleanly below.

### Goalposts

1. **GP1 — Create `RecentSpotlight`.** Create `client/src/components/documents/recent-spotlight.tsx` with sharp paper preview, playful remark header, branch status, and primary action.
2. **GP2 — Integrate in `dashboard.tsx`.** Update `client/src/pages/dashboard.tsx` to display `RecentSpotlight` above the main manuscripts grid.
3. **GP3 — Verification & Commit.** Verify live frontend rendering and commit with git conventions.

---

## 2026-08-16 — Design tokens + shadcn/ui migration

Lock down Inkbase design token system and migrate to shadcn/ui component primitives. Replace @heroicons/react with lucide-react throughout. Apply blue-tinted background token system inspired by the reference design (subtle #EEF3F8 ground, pure white card surfaces, barely-perceptible blue gradients).

### Design Tokens Locked
- Logo font: Lobster Two — immutable
- Paper surfaces: always `rounded-none` — physical paper rule
- App background: `--ink-bg: #EEF3F8` (soft blue-tinted, not white)
- Card surfaces: `--ink-surface: #FFFFFF` floating on bg
- Subtle gradient tint: `from-white to-sky-50/50` on info cards
- Shadows: soft, airy, not dramatic

### Goalposts

1. **GP1 — Update `globals.css` design tokens.** Add `--ink-bg`, `--ink-surface`, `--ink-surface-subtle` CSS vars and `@theme inline` mappings.
2. **GP2 — Scaffold shadcn/ui components.** Install radix-ui primitives, create `button.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `separator.tsx` in `components/ui/` (Tailwind v4 compatible, no CLI).
3. **GP3 — Remove @heroicons/react.** Patch all imports in dashboard + document components to `lucide-react`.
4. **GP4 — Wire shadcn into cards.** Replace inline button classes and DIY dropdown menus in `document-card.tsx` and `recent-spotlight.tsx` with shadcn `Button` + `DropdownMenu`.
5. **GP5 — Apply bg token, build + commit.** Apply `bg-ink-bg` to dashboard root, verify `npm run build`, commit.

---

---

## 2026-08-16 — Strip clutter: Spotlight Hero + Manuscript Cards Focus

Strip away extra analytics fluff (stat cards, greeting card, status donut chart, velocity chart) to deliver a clean, focused, uncluttered writing studio. Keep only:
- Floating luxury studio shell with soft-cyan atmospheric styling
- "Ready to jump back in, chief?" Spotlight Hero (sharp paper on left, remark on right)
- "All Manuscripts" Gallery Grid (sharp-edged paper cards + Import Document)
- Refined floating sidebar

### Goalposts
1. **GP1 — Declutter Dashboard Page**. Remove stats, donut, velocity charts, and extra lists. Keep strictly Spotlight Hero and Manuscript Gallery Grid.
2. **GP2 — Remove unused widget files**. Clean up unused widget components.
3. **GP3 — Verify & Commit**. Test `next build` and commit.

---

## 2026-08-16 — Apply Studio Design System across Auth & Onboarding

Propagate the Studio Cyan/Teal design system (`#E3EDF6` ambient ground, `#F5FAFC` studio shells, `#2C7E86` primary interactive accents, soft cyan pills, and sharp-paper previews) to the Onboarding overlay and Auth pages (Login, Signup, and AuthHero). Landing page remains untouched.

### Goalposts
1. **GP1 — Onboarding & Bonjour**. Refactor `onboarding.tsx` and `bonjour.tsx` with studio teal/cyan tokens and rounded-3xl floating studio modal.
2. **GP2 — Auth Hero**. Restyle `auth-hero.tsx` interactive animated manuscript with studio cyan gradient and sharp-paper preview.
3. **GP3 — Login & Signup Forms**. Restyle `login-form.tsx` and `signup-form.tsx` to match studio canvas, cyan quick-actions, and teal submit states.
4. **GP4 — Build Verification & Commit**. Verify full `next build` passes and commit.



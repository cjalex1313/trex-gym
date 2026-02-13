# TRexGYM (GymTrack) — Phased Development Plan

> **Approach:** Agile & incremental. Each phase delivers a working, testable vertical slice. Every phase ends with something you can demo, use, or get feedback on — not a pile of "foundational" code with no UI.

---

## Phase 0 — Local Dev Environment & Docker (Days 1–2)

**Goal:** One command (`docker compose up`) spins up the entire local stack so any contributor can start working immediately.

### Deliverables

- [ ] `docker-compose.yml` at the repo root with services:
  - **mongodb** — Official MongoDB 7 image, data persisted to a named volume, healthcheck configured
  - **mongo-express** — Web-based Mongo admin UI (accessible at `localhost:8081`) for inspecting data during dev
  - **trexgym-api** — NestJS API with hot-reload (volume-mount `./trexgym-api/src`, use `start:dev`)
  - **trexgym-web** — Vue dev server with HMR (volume-mount `./trexgym-web/src`, forward Vite port)
  - **mailhog** - For mocking email service
- [ ] `Dockerfile.api` (dev) and `Dockerfile.web` (dev) — multi-stage Dockerfiles (dev target with hot-reload, prod target with optimized build)
- [ ] `.env.example` at repo root with all required env vars documented:
  - `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRY`, `RESEND_API_KEY`, `API_PORT`, `WEB_PORT`
- [ ] `Makefile` or root `package.json` scripts for common tasks:
  - `make up` / `make down` / `make logs` / `make seed`
- [ ] Seed script (`trexgym-api/src/seeds/`) that creates a default admin account and a few sample clients
- [ ] Update root `README.md` with quick-start instructions

### Why first?
Docker eliminates "works on my machine." Every subsequent phase is developed and tested inside this environment, ensuring consistency from day one.

---

## Phase 1 — API Core: Auth + Client CRUD (Days 3–7)

**Goal:** A working API where the admin can log in, create clients, and see them — verified via tests and a REST client (e.g., Thunder Client, Insomnia).

### Deliverables

- [ ] **MongoDB connection** — `@nestjs/mongoose` integration, connection config from env vars
- [ ] **Admin module**
  - `admins` Mongoose schema/model
  - Seed script creates default admin on first run
- [ ] **Auth module**
  - `POST /api/auth/admin/login` — email + password → JWT (24h expiry)
  - `POST /api/auth/client/login` — email + PIN → JWT (30d expiry)
  - `POST /api/auth/refresh` — refresh token
  - JWT strategy (`@nestjs/passport`, `@nestjs/jwt`)
  - `JwtAuthGuard` (global) + `RolesGuard` (admin vs. client)
  - Rate limiting on login endpoints (5 req/min/IP via `@nestjs/throttler`)
- [ ] **Clients module**
  - `clients` Mongoose schema with indexes (email unique, qrToken unique/sparse, status)
  - `GET /api/clients` — paginated, searchable list (admin)
  - `GET /api/clients/:id` — detail (admin)
  - `POST /api/clients` — create client, generate 6-digit PIN, hash with bcrypt (admin)
  - `PUT /api/clients/:id` — update (admin)
  - `DELETE /api/clients/:id` — soft-delete / suspend (admin)
- [ ] **Validation & security**
  - `class-validator` + `ValidationPipe` globally
  - Helmet middleware
  - CORS configured for local dev origins
- [ ] **Tests**
  - Unit tests for auth service (JWT generation, password/PIN verification)
  - Unit tests for clients service (CRUD operations)
  - E2E tests for auth flow and client endpoints

### Definition of Done
You can start the API via Docker, log in as admin, create/list/update/delete clients — all verified by automated tests.

---

## Phase 2 — Web Dashboard: Auth + Client Management (Days 8–14)

**Goal:** The gym owner can log into a real web UI, see a list of clients, add new ones, edit, and suspend — connected to the live API from Phase 1.

### Deliverables

- [ ] **Project setup**
  - Install PrimeVue (or Naive UI) component library + PrimeIcons
  - Configure Pinia stores structure
  - Set up Axios/Fetch API client with JWT interceptor (auto-attach token, handle 401 → redirect to login)
  - Configure Vue Router with auth guard (redirect to `/login` if no token)
- [ ] **Auth store & screens**
  - `useAuthStore` — login, logout, token storage (localStorage), user state
  - Login page — admin email + password form with validation and error feedback
- [ ] **Client management screens**
  - **Client List** — PrimeVue DataTable with search, sort, pagination, status badges, quick actions (edit, suspend)
  - **Client Detail** — profile info panel (subscription & payment sections are placeholder/empty for now)
  - **Add/Edit Client** — form with validation (firstName, lastName, email, phone); on create, shows generated PIN confirmation
- [ ] **Layout & navigation**
  - Sidebar or top-nav layout with: Dashboard (placeholder), Clients, Settings (placeholder)
  - Responsive basics (works on tablet+ for now)
- [ ] **Basic error handling**
  - Toast notifications for success/error on all API calls
  - Loading skeletons on data-fetching screens

### Definition of Done
Owner logs in via the web browser, sees clients in a table, adds a new client, edits one, suspends one — all persisted in MongoDB via the API.

---

## Phase 3 — Subscriptions + Payments (Days 15–21)

**Goal:** The owner can create subscriptions for clients and log cash payments — the core business logic of the gym.

### API Deliverables

- [ ] **Subscriptions module**
  - `subscriptions` Mongoose schema with indexes (clientId + status, endDate)
  - `GET /api/clients/:id/subscriptions` — list subscription history
  - `POST /api/clients/:id/subscriptions` — create subscription (plan, dates, price, currency)
  - `PUT /api/subscriptions/:id` — update (extend, cancel)
  - Auto-set subscription status `active` and client status `active` on creation
- [ ] **Payments module**
  - `payments` Mongoose schema with indexes (subscriptionId, clientId + paymentDate)
  - `GET /api/subscriptions/:id/payments` — payments for a subscription
  - `POST /api/subscriptions/:id/payments` — log payment (amount, date, method, notes)
  - `PUT /api/payments/:id` — update payment
  - `DELETE /api/payments/:id` — delete erroneous payment
  - `GET /api/clients/:id/payments` — full payment history for a client
  - `GET /api/payments/outstanding` — subscriptions with unpaid balances
- [ ] **Tests** for subscription and payment CRUD + business rules

### Web Dashboard Deliverables

- [ ] **Client Detail** — now shows subscription history and payment history (real data)
- [ ] **Subscription Form** — plan type selector, date pickers, price input; attached to a client
- [ ] **Log Payment** — form with amount, date, method, notes; linked to a subscription
- [ ] **Outstanding Payments** — dedicated view listing subscriptions with remaining balances, quick-log action

### Definition of Done
Owner creates a subscription for a client, logs partial/full payments, sees outstanding balances, and views payment history — all end-to-end.

---

## Phase 4 — QR Code System & Entry Validation (Days 22–28)

**Goal:** The end-to-end entry flow works: client shows QR on phone (mocked/web for now), scanner validates it, entry is logged.

### API Deliverables

- [ ] **QR token logic**
  - Generate UUID v4 `qrToken` per client, store in DB with 5-minute expiry
  - `GET /api/client/qr` — return current QR token (auto-regenerate if expired); requires client JWT
  - Token rotation: generate new token on each request, invalidate old one
- [ ] **Entry module**
  - `entryEvents` Mongoose schema with indexes (clientId + timestamp, TTL 365 days)
  - `POST /api/entry/validate` — validate QR token → check client active + subscription active → log event → return grant/deny with client name & reason
  - `GET /api/entries` — list entry events (admin, filterable by date/client)
- [ ] **Tests** for QR validation logic (valid, expired token, expired subscription, suspended client)

### QR Scanner (Web Page) Deliverables

- [ ] **Scanner page** — standalone route in `trexgym-web` (or separate lightweight page)
  - `html5-qrcode` integration with camera access
  - Admin login to authenticate the scanner session
  - On scan: call validate endpoint → show green check + name or red X + reason
  - Auto-reset after 3 seconds
  - Full-screen mode friendly (for tablet at entrance)

### Web Dashboard Additions

- [ ] **Entry Log** — filterable table of entry events with grant/deny status, client name, timestamp

### Definition of Done
Scan a QR code from a test page → API validates → entry logged → visible in dashboard entry log.

---

## Phase 5 — Mobile App: Client Login + QR Display (Days 29–35)

**Goal:** Clients can log in on the React Native app, see their subscription status, and display a live auto-refreshing QR code.

### Deliverables

- [ ] **Auth flow**
  - Login screen — email + 6-digit PIN input
  - Secure token storage (Expo SecureStore)
  - Auto-login on app launch if token still valid
- [ ] **Home / QR screen**
  - Large QR code rendered via `react-native-qrcode-svg` (or similar)
  - Auto-refresh every 4 minutes (call `GET /api/client/qr`)
  - Subscription status badge (active / expiring soon / expired)
  - If expired → show message instead of QR
  - Offline fallback: show last QR + warning + countdown to expiry
- [ ] **My Subscription screen**
  - Current plan, start/end dates, days remaining
  - Amount paid vs. total price
- [ ] **Entry History screen**
  - Simple list of recent entry timestamps
- [ ] **Settings screen**
  - Change PIN (calls a new `PUT /api/client/pin` endpoint)
  - Notification preferences (placeholder for now)
- [ ] **Navigation** — bottom tab bar (QR, Subscription, History, Settings)

### API Additions

- [ ] `PUT /api/client/pin` — client changes own PIN (requires current PIN + new PIN)
- [ ] `POST /api/auth/client/forgot-pin` — sends new PIN to client email

### Definition of Done
Client logs in on the Expo app, sees a live QR code that refreshes, views their subscription info, and can change their PIN.

---

## Phase 6 — Email Notifications & Invitation Flow (Days 36–40)

**Goal:** The system sends real emails — invitations when clients are created, and automated reminders for expiring subscriptions.

### Deliverables

- [ ] **Resend integration**
  - `EmailModule` in NestJS wrapping the Resend SDK
  - Email templates (HTML): invitation, subscription expiring (7 days), subscription expired, PIN reset
- [ ] **Invitation flow**
  - `POST /api/clients` now sends invitation email with PIN + app download link
  - `POST /api/clients/:id/resend-invite` — regenerates PIN and resends email
  - Client status transitions: `invited` → `active` (on first login)
- [ ] **Automated reminders**
  - Cron job (NestJS `@Cron` via `@nestjs/schedule`):
    - Daily: find subscriptions expiring in 7 days → email client
    - Daily: find subscriptions expired today → email client + owner
    - Daily: auto-update subscription status from `active` to `expired`
- [ ] **Tests** for email service (mock Resend), cron job logic

### Definition of Done
Creating a client sends a real invitation email. Subscriptions nearing expiry trigger automated reminder emails.

---

## Phase 7 — Dashboard Analytics & Polish (Days 41–47)

**Goal:** The dashboard shows meaningful stats, and all surfaces are polished for real-world use.

### Deliverables

- [ ] **Dashboard Home screen**
  - Summary cards: active members, expiring this week, entries today, total outstanding balance
  - `GET /api/dashboard/stats` endpoint
  - Quick chart: entries per day (last 7 days)
  - `GET /api/dashboard/revenue` — revenue summary by month
- [ ] **Settings screen**
  - Gym name / branding config
  - Subscription plan templates (name, duration, default price)
  - Admin password change
- [ ] **UX polish across all web screens**
  - Loading skeletons, empty states, error boundaries
  - Confirmation dialogs for destructive actions
  - Keyboard shortcuts (search focus, etc.)
  - Breadcrumbs and navigation consistency
- [ ] **Mobile app polish**
  - Pull-to-refresh on all screens
  - Smooth transitions & animations
  - App icon and splash screen
- [ ] **QR scanner polish**
  - Sound feedback on scan (success beep, deny buzz)
  - Session keep-alive (long-lived token / auto-refresh)

### Definition of Done
Dashboard shows live stats with charts. All screens handle loading/error/empty states gracefully. The app feels production-ready.

---

## Phase 8 — Testing, Security Hardening & Deployment (Days 48–54)

**Goal:** The system is secure, well-tested, and deployed to production free-tier services.

### Deliverables

- [ ] **Comprehensive testing**
  - API: ≥80% unit test coverage, critical-path E2E tests
  - Web: Component tests for key screens (Vitest + Vue Test Utils)
  - Mobile: Basic smoke tests (Expo + Jest)
  - QR scanner: Manual test protocol documented
- [ ] **Security hardening**
  - Audit all endpoints for proper auth guards and role checks
  - Ensure rate limiting on all auth-related endpoints
  - MongoDB Atlas: restrict network access to API server IP
  - Review CORS policy for production domains
  - Dependency audit (`npm audit`)
- [ ] **Production Dockerfiles**
  - Multi-stage builds: install deps → build → slim runtime image
  - API: Node.js Alpine image, non-root user
  - Web: Nginx serving built static files
- [ ] **Production `docker-compose.prod.yml`** (for self-hosting option)
- [ ] **Cloud deployment**
  - API → Render (free tier) with auto-deploy from GitHub
  - Web → Vercel (free Hobby tier) with auto-deploy
  - MongoDB Atlas M0 cluster (production)
  - Resend account configured with production API key
  - UptimeRobot ping to keep Render warm during gym hours
- [ ] **CI/CD pipeline** (GitHub Actions)
  - On PR: lint + test + type-check
  - On merge to main: auto-deploy API (Render) + Web (Vercel)
- [ ] **Mobile app build**
  - Expo EAS Build for Android APK / iOS IPA
  - OTA update channel configured

### Definition of Done
All services are live on free-tier hosting. CI runs on every PR. The gym owner can start using the system in production.

---

## Future Enhancements (Backlog)

These are intentionally out of scope for the initial build. Prioritize based on real user feedback:

| Feature | Notes |
|---|---|
| Online payments (Stripe) | Client self-service pay & renew from app |
| Push notifications | Expo Push for subscription reminders |
| Multi-gym support | Tenant isolation, gym switching |
| Class/session booking | Schedule, capacity, waitlists |
| Trainer management | Profiles, scheduling, assignment |
| WhatsApp notifications | Via Twilio or similar |
| Advanced analytics | Charts, trends, retention metrics |
| Client self-registration | With owner approval workflow |
| Offline QR scanner | Cache recent tokens locally |
| PWA support for web | Installable dashboard on mobile/tablet |

---

## Summary Timeline

| Phase | Focus | Duration | Cumulative |
|---|---|---|---|
| 0 | Docker & Dev Environment | 2 days | Day 2 |
| 1 | API: Auth + Client CRUD | 5 days | Day 7 |
| 2 | Web: Auth + Client Management | 7 days | Day 14 |
| 3 | Subscriptions + Payments | 7 days | Day 21 |
| 4 | QR System + Entry Validation | 7 days | Day 28 |
| 5 | Mobile App | 7 days | Day 35 |
| 6 | Email & Notifications | 5 days | Day 40 |
| 7 | Dashboard Analytics & Polish | 7 days | Day 47 |
| 8 | Testing, Security & Deployment | 7 days | Day 54 |

**Total: ~54 working days (~11 weeks)**

> Each phase is independently demoable and shippable. You can stop after any phase and have a working (if incomplete) system. Phases 1–4 give you the core gym management + entry flow. Phases 5–6 add the mobile experience and automation. Phases 7–8 polish and ship.

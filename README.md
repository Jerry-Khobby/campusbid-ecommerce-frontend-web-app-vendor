# CampusBid — Vendor App

The self-service portal for campus vendors: register a shop, manage products and stock, handle incoming orders, run flash sales, message customers, and track payouts — backed by the [CampusBid backend](../campus-bid-backend-web-app).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Radix UI primitives · Recharts · Socket.IO client

Like the admin app (and unlike the customer app), this one has **no TanStack Query** — data fetching is plain `useEffect`/`useState` per page. It does use Socket.IO, for chat (`lib/socket/chat-socket.ts`) and for real-time notification toasts (`components/notifications-socket-bridge.tsx`).

## Getting started

```bash
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_BASE_URL at your backend
npm run dev                        # http://localhost:5002
```

Vendors **do** self-register through this app (`/vendor/login`'s sign-up toggle → `POST /vendors/register`) — unlike admin. A newly registered vendor lands with `isActive: false` and needs approval from the admin app before showing up in the customer-facing marketplace, though the vendor can still sign in and use the dashboard while pending.

```bash
npm run lint    # eslint
npm run build   # production build
```

**No test suite exists in this app yet.** The customer app has a Vitest + Testing Library setup you can lift wholesale if you want to add one here — see its `vitest.config.mts`/`vitest.setup.ts` and `lib/api/__tests__/`, `components/pages/__tests__/` for the pattern.

## App structure

Routes live under `app/vendor/*`; `app/vendor/layout.tsx` renders the sidebar (`components/vendor/vendor-sidebar.tsx`) and redirects to `/vendor/login` for anyone without a session, except for a small allowlist of public routes (login, forgot/reset password) that must stay reachable from an email link even when logged out.

| Route | Purpose |
| --- | --- |
| `/vendor/dashboard` | Revenue/orders KPIs with sparklines, 7-day revenue chart, recent orders |
| `/vendor/products` | Product CRUD, stock, availability, images |
| `/vendor/orders` | Accept/reject/progress orders through their real backend statuses |
| `/vendor/bids` | Flash sales: live bid history/current leader, complete or cancel a sale (there is no per-bid accept/reject — the backend only supports closing the whole sale) |
| `/vendor/messages` | Buyer↔vendor chat |
| `/vendor/analytics` | Sales/product analytics over a selectable period |
| `/vendor/payouts` | Pending/available balance, payout requests |
| `/vendor/settings` | Business info, bank details, password |
| `/vendor/login`, `/vendor/forgot-password`, `/vendor/reset-password`, `/auth/google` | Auth (email/password + Google OAuth) |

`lib/api/*.ts` is one file per backend resource (`orders.ts`, `products.ts`, `flash-sales.ts`, `payouts.ts`, etc.) — each a thin `apiFetch` wrapper, no query-library hooks (see the stack note above).

## Conventions worth knowing before changing things

- **Auth**: JWT access + refresh tokens in `lib/api/token-storage.ts` (`localStorage`); `lib/api/client.ts`'s `apiFetch` retries once on a 401 via refresh, then clears tokens. Same shape as the other two apps.
- **Chat is predefined-messages-only by design** in most flows, but the customer app added free-text messaging — if you add it here too, keep the vendor side's `senderType: "vendor"` distinction intact, since the backend's chat schema and gateway are role-agnostic and only the payload's `senderType` distinguishes the two.
- **The vendor "coming soon" stubs are known, not bugs**: the Settings page's 2FA toggle and "View Sessions" have no backend concept behind them yet, and the Messages page's "View customer profile" also has no backend support (the chat controller never populates a customer's profile onto a conversation). All three need real backend work before they can be wired up, not just a frontend fix.

## Known gaps

- No automated tests, as noted above — this is the highest-value gap to close next if you're hardening this app before hosting it.
- If you're auditing before production, also check the backend's own README for two vendor-relevant known issues: vendor Google OAuth returning an empty response body on the backend, and the chat WebSocket gateway accepting connections without authentication.

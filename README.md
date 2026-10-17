# managerspizza.com

The Manager's Pizza website: pizza supplies price list, quotation requests, business and partner programs, and a map of branches.

**Stack:** Next.js 15 (App Router, TypeScript) and Tailwind CSS 4 on Vercel, Supabase for data, domain at Namecheap.

## Run locally

```
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

Copy `.env.example` to `.env.local` and fill in the Supabase values to save form submissions. Without them the site still works, and forms give the visitor a reference number and an SMS/call button to the Quezon City depot instead.

## Where things live

| What | File |
| --- | --- |
| Price list (temporary list for every branch and tier, from the 2 May 2026 QC depot PDF) | `lib/catalog.ts` |
| Per-branch / per-tier price overrides | `lib/pricing.ts` |
| The five account tiers | `lib/tiers.ts` |
| Branches and map pins | Admin > Branches (the `branches` table); `lib/branches.ts` is the starting list and fallback |
| Partner programs | `lib/partners.ts` |
| Phone numbers, address, nav | `lib/site.ts` |
| Brand logo, favicon, app icons | `public/brand/`, `public/*.png`, `app/favicon.ico` |
| Database schema with RLS | `supabase/migrations/` |
| Seed data (generated from `lib/`) | `supabase/seed.sql` (`npx tsx scripts/generate-seed.ts`) |

### Changing prices per branch or client level

Every page reads prices through `sheetFor(slug, { branch, tier })` in `lib/pricing.ts`. Today all branches and tiers resolve to the base list. To give a branch or a tier its own price, add an entry to `PRICE_OVERRIDES` (or, once Supabase is connected, a `price_lists` row for that branch and tier with its `price_list_items`; the seed already creates one list per tier, copied from the base list). Lookup order: branch + tier, then tier, then branch, then base list. Tier lists are not readable by anonymous visitors (RLS).

## Deploy

1. Import this repository as a Vercel project (framework: Next.js, no other settings). `main` deploys to production; pull requests get previews.
2. Create a Supabase project, run `supabase/migrations/*.sql` then `supabase/seed.sql` in the SQL editor, and add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to the Vercel project.
3. In Vercel → Settings → Domains add `www.managerspizza.com` (primary) and `managerspizza.com` (redirect to www).
4. In Namecheap → Domain List → managerspizza.com → Advanced DNS, use the records Vercel shows for this project (Settings → Domains). At setup these were: **A** `@` → `216.198.79.1`, **A** `@` → `64.29.17.1`, **CNAME** `www` → `dcb33eee5d282416.vercel-dns-017.com.` Remove the old `@` A record (162.159.140.166) and the `www` CNAME to sites.ludicrous.cloud. Keep the email forwarding records (MX `eforward1`–`5.registrar-servers.com` and the SPF TXT).

## Accounts and dashboards

- **Sign in / Create an account** (`/login`, `/register`): email and password. The server creates the user already confirmed (no email is sent) with a `profiles` row in status `pending`.
- **My account** (`/account`): status, price level, branch, the customer's requests with the branch's reply, profile and password. Approved accounts get **My price list** (`/account/prices`) for their branch and level.
- **Branch dashboard** (`/branch`): for `branch_oic` / `staff` roles (and admins): the branch's requests (open by default), a request page to reply with a quoted amount and move it to another branch, and the branch's customers.
- **Admin dashboard** (`/admin`): overview, all requests, accounts (approve, set level and branch, set a temporary password), price editor per branch × level, and staff roles.
- First admin: put the email in the `ADMIN_EMAILS` Vercel env var (comma-separated), or add a `staff_roles` row with role `founder`.

Prices live in Supabase (`price_lists` + `price_list_items`), looked up cell by cell: branch + level → level → branch → public list (branch and level both empty). Shop pages refresh every 5 minutes and right after an admin saves prices. Every price change and request update is written to `audit_log`.

Run `supabase/migrations/*.sql` in order. Form submissions land in the `leads` table (Supabase → Table editor).

## Online store and alerts

- Shop (`/`, `/shop`), cart (`/cart`), checkout, payment page with QR codes (`/orders/[ref]/pay`), order tracking (`/orders`), messages (`/messages`). Prices show only to approved, signed-in accounts, for their level and branch. Request-for-quotation items are set in `lib/products.ts` (`RFQ_SHEETS`, sachets).
- Staff: `/branch/orders`, `/branch/orders/[id]` (confirm payments, status, shipping, tracking), `/branch/messages`. Admin > Payments holds the GCash / BDO / Maya / GoTyme QR codes and account details.
- Alerts (`lib/notify.ts`): email via Resend when `RESEND_API_KEY` is set (sender `EMAIL_FROM`, default `Manager's Pizza <orders@managerspizza.com>`, domain must be verified in Resend); SMS via Semaphore when `SEMAPHORE_API_KEY` is set (`SEMAPHORE_SENDER` optional). Without the keys, alerts are skipped.
- Database: `supabase/migrations/20261017020000_shop.sql` (orders, payments, payment methods, conversations, messages, storage buckets `payment-qr` and `payment-proofs`).
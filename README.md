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
| Branches and map pins | `lib/branches.ts` |
| Partner programs | `lib/partners.ts` |
| Phone numbers, address, nav | `lib/site.ts` |
| Brand logo, favicon, app icons | `public/brand/`, `public/*.png`, `app/favicon.ico` |
| Sign-in, roles and permissions | `lib/auth.ts`, `lib/actions.ts`, `middleware.ts` |
| Customer dashboard / branch dashboard / admin | `app/account`, `app/branch`, `app/admin`, `app/leads/[id]` |
| Database schema with RLS | `supabase/migrations/` |
| Seed data (generated from `lib/`) | `supabase/seed.sql` (`npx tsx scripts/generate-seed.ts`) |

### Changing prices per branch or client level

Every page reads prices through `sheetFor(slug, { branch, tier })` in `lib/pricing.ts`. Today all branches and tiers resolve to the base list. To give a branch or a tier its own price, add an entry to `PRICE_OVERRIDES` (or, once Supabase is connected, a `price_lists` row for that branch and tier with its `price_list_items`; the seed already creates one list per tier, copied from the base list). Lookup order: branch + tier, then tier, then branch, then base list. Tier lists are not readable by anonymous visitors (RLS).

## Deploy

1. Import this repository as a Vercel project (framework: Next.js, no other settings). `main` deploys to production; pull requests get previews.
2. Create a Supabase project, run `supabase/migrations/*.sql` then `supabase/seed.sql` in the SQL editor, and add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to the Vercel project.
3. In Vercel → Settings → Domains add `www.managerspizza.com` (primary) and `managerspizza.com` (redirect to www).
4. In Namecheap → Domain List → managerspizza.com → Advanced DNS, use the records Vercel shows for this project (Settings → Domains). At setup these were: **A** `@` → `216.198.79.1`, **A** `@` → `64.29.17.1`, **CNAME** `www` → `dcb33eee5d282416.vercel-dns-017.com.` Remove the old `@` A record (162.159.140.166) and the `www` CNAME to sites.ludicrous.cloud. Keep the email forwarding records (MX `eforward1`–`5.registrar-servers.com` and the SPF TXT).

Form submissions land in the `leads` table and show up in the dashboards.

## Accounts and dashboards

- **Sign in** (`/login`): email + password, or an emailed sign-in link. New sign-ups get a `profiles` row (status `pending`).
- **My account** (`/account`): the customer's price level, home branch, their price list (`/account/prices`), their requests with the branch's quotation, and their details.
- **Branch dashboard** (`/branch`): for `branch_oic` / `staff` roles. Requests assigned to the branch (or picked by the customer while unassigned), status and quotation updates, and the branch's customers.
- **Admin** (`/admin`): founder / super admin / admin. All requests (assign a branch), account approval with price level and home branch, and staff access.

Setup after `20261017000000_accounts.sql` is run:

1. Supabase → Authentication → URL Configuration: Site URL `https://www.managerspizza.com`, Redirect URLs `https://www.managerspizza.com/**`.
2. Create the owner's account on `/login`, confirm the email, then in the SQL editor:
   `insert into staff_roles (user_id, role) select id, 'founder' from auth.users where email = '<owner email>';`
3. Everyone else gets access from Admin → Staff (they create their account first).

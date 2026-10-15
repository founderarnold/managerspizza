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
| Database schema with RLS | `supabase/migrations/` |
| Seed data (generated from `lib/`) | `supabase/seed.sql` (`npx tsx scripts/generate-seed.ts`) |

### Changing prices per branch or client level

Every page reads prices through `sheetFor(slug, { branch, tier })` in `lib/pricing.ts`. Today all branches and tiers resolve to the base list. To give a branch or a tier its own price, add an entry to `PRICE_OVERRIDES` (or, once Supabase is connected, a `price_lists` row for that branch and tier with its `price_list_items`; the seed already creates one list per tier, copied from the base list). Lookup order: branch + tier, then tier, then branch, then base list. Tier lists are not readable by anonymous visitors (RLS).

## Deploy

1. Import this repository as a Vercel project (framework: Next.js, no other settings). `main` deploys to production; pull requests get previews.
2. Create a Supabase project, run `supabase/migrations/*.sql` then `supabase/seed.sql` in the SQL editor, and add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to the Vercel project.
3. In Vercel → Settings → Domains add `www.managerspizza.com` (primary) and `managerspizza.com` (redirect to www).
4. In Namecheap → Domain List → managerspizza.com → Advanced DNS: an **A** record for `@` → `76.76.21.21` and a **CNAME** for `www` → `cname.vercel-dns.com` (or the exact values Vercel shows). Remove old Google Sites records; keep MX/SPF/DKIM records if the domain has email.

Form submissions land in the `leads` table (Supabase → Table editor) until the admin inbox is built.

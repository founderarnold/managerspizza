import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import { requireAdmin, ROLE_LABEL, type Profile, type StaffRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAllBranches } from "@/lib/branches-db";
import { TIERS, type TierId } from "@/lib/tiers";
import { PRICE_SHEETS } from "@/lib/catalog";
import { formatDate, leadBranch, type Lead } from "@/lib/leads";
import { cellKey, chainFor, currentLists, layersFor, listItems, resolveCell } from "@/lib/prices-db";
import { removeStaff } from "@/app/actions/dashboard";
import { AccountStatusBadge, Stat } from "@/components/dashboard/Badges";
import { LeadList, OPEN_STATUSES, StatusFilter } from "@/components/dashboard/LeadList";
import { AddStaffForm, BranchForm, CreateAccountForm, PriceEditor } from "@/components/dashboard/AdminForms";
import { BRANCH_STATUS_LABEL } from "@/lib/branches";
import { paymentMethods } from "@/lib/orders-db";
import { PaymentMethodForm } from "@/components/shop/PaymentMethodForm";
import { OPEN_ORDER_STATUSES } from "@/lib/orders";

export const metadata: Metadata = { title: "Admin dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Orders" },
  { id: "requests", label: "Requests" },
  { id: "accounts", label: "Accounts" },
  { id: "prices", label: "Prices" },
  { id: "branches", label: "Branches" },
  { id: "payments", label: "Payments" },
  { id: "staff", label: "Staff" },
];

type SP = { tab?: string; status?: string; b?: string; branch?: string; tier?: string; sheet?: string; q?: string };

export default async function AdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  const v = await requireAdmin();
  const sp = await searchParams;
  const tab = TABS.some((t) => t.id === sp.tab) ? sp.tab! : "overview";

  return (
    <div className="container-x py-8 md:py-12">
      <p className="eyebrow">Admin dashboard</p>
      <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Manager&apos;s Pizza HQ</h1>
      <nav aria-label="Admin sections" className="mt-6 flex gap-2 overflow-x-auto border-b border-line pb-3">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin?tab=${t.id}`}
            aria-current={t.id === tab ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${t.id === tab ? "bg-ink text-white" : "bg-white text-graphite hover:bg-sand"}`}
          >
            {t.label}
          </Link>
        ))}
        <Link href="/branch" className="ml-auto shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-brand-red-deep hover:bg-sand">
          Branch view →
        </Link>
      </nav>
      <div className="mt-6">
        {tab === "overview" && <Overview />}
        {tab === "requests" && <Requests sp={sp} />}
        {tab === "accounts" && <Accounts sp={sp} />}
        {tab === "prices" && <Prices sp={sp} />}
        {tab === "branches" && <Branches />}
        {tab === "payments" && <Payments />}
        {tab === "orders" && <OrdersTab />}
        {tab === "staff" && <Staff myId={v.id} canGrantFounder={v.roles.some((r) => r.role === "founder")} />}
      </div>
    </div>
  );
}

async function Overview() {
  const BRANCHES = await getAllBranches();
  const db = supabaseAdmin()!;
  const [{ data: leads }, { data: profiles }] = await Promise.all([
    db.from("leads").select("status,branch_slug,assigned_branch,created_at").limit(10000),
    db.from("profiles").select("status").limit(10000),
  ]);
  const L = (leads ?? []) as Pick<Lead, "status" | "branch_slug" | "assigned_branch" | "created_at">[];
  const P = profiles ?? [];
  const weekAgo = Date.now() - 7 * 864e5;
  const open = L.filter((l) => OPEN_STATUSES.includes(l.status));
  const pending = P.filter((p) => p.status === "pending").length;
  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="New requests" value={L.filter((l) => l.status === "new").length} />
        <Stat label="Open requests" value={open.length} hint="New, in review or quoted" />
        <Stat label="Requests this week" value={L.filter((l) => new Date(l.created_at).getTime() > weekAgo).length} />
        <Stat label="Accounts to approve" value={pending} hint={`${P.length} accounts in total`} />
      </div>
      {pending > 0 && (
        <Link href="/admin?tab=accounts&status=pending" className="card flex items-center justify-between p-4 font-semibold hover:shadow-lift">
          {pending} account{pending === 1 ? " is" : "s are"} waiting for approval <ChevronRight size={18} aria-hidden />
        </Link>
      )}
      <section>
        <h2 className="text-xl font-bold">Open requests by branch</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 text-right font-medium">New</th>
                <th className="px-4 py-3 text-right font-medium">Open</th>
                <th className="px-4 py-3 text-right font-medium">All time</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...BRANCHES.map((b) => ({ slug: b.slug as string | null, name: b.city })), { slug: null, name: "No branch chosen" }].map((b) => {
                const mine = L.filter((l) => leadBranch(l) === b.slug);
                return (
                  <tr key={b.slug ?? "none"} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{mine.filter((l) => l.status === "new").length}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{mine.filter((l) => OPEN_STATUSES.includes(l.status)).length}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{mine.length}</td>
                    <td className="px-4 py-3 text-right">
                      <Link className="font-semibold text-brand-red-deep" href={`/admin?tab=requests&b=${b.slug ?? "none"}`}>View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

async function Requests({ sp }: { sp: SP }) {
  const BRANCHES = await getAllBranches();
  const db = supabaseAdmin()!;
  const status = sp.status ?? "open";
  const b = sp.b ?? "all";
  let q = db.from("leads").select("*").order("created_at", { ascending: false }).limit(300);
  if (status === "open") q = q.in("status", OPEN_STATUSES);
  else if (status !== "all") q = q.eq("status", status);
  if (b === "none") q = q.is("assigned_branch", null).is("branch_slug", null);
  else if (b !== "all") q = q.or(`assigned_branch.eq.${b},and(assigned_branch.is.null,branch_slug.eq.${b})`);
  if (sp.q) q = q.or(`reference.ilike.%${sp.q.replace(/[%,()]/g, "")}%,name.ilike.%${sp.q.replace(/[%,()]/g, "")}%,mobile.ilike.%${sp.q.replace(/[%,()]/g, "")}%`);
  const { data } = await q;
  return (
    <div className="grid gap-4">
      <form className="flex flex-wrap items-end gap-3" action="/admin">
        <input type="hidden" name="tab" value="requests" />
        <input type="hidden" name="status" value={status} />
        <label className="label">
          Branch
          <select className="field" name="b" defaultValue={b}>
            <option value="all">All branches</option>
            <option value="none">No branch chosen</option>
            {BRANCHES.map((x) => (
              <option key={x.slug} value={x.slug}>{x.city}</option>
            ))}
          </select>
        </label>
        <label className="label">
          Search
          <input className="field" name="q" defaultValue={sp.q ?? ""} placeholder="Reference, name or mobile" />
        </label>
        <button className="btn-dark" type="submit">Filter</button>
      </form>
      <StatusFilter base={`/admin?tab=requests&b=${b}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`} current={status} />
      <LeadList leads={(data ?? []) as Lead[]} showBranch />
    </div>
  );
}

async function Accounts({ sp }: { sp: SP }) {
  const BRANCHES = await getAllBranches();
  const db = supabaseAdmin()!;
  const status = sp.status ?? "all";
  let q = db.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
  if (status !== "all") q = q.eq("status", status);
  if (sp.q) {
    const s = sp.q.replace(/[%,()]/g, "");
    q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,mobile.ilike.%${s}%,business_name.ilike.%${s}%`);
  }
  const { data } = await q;
  const rows = (data ?? []) as Profile[];
  const chips = [
    { id: "all", label: "All" },
    { id: "pending", label: "Waiting for approval" },
    { id: "approved", label: "Approved" },
    { id: "suspended", label: "Suspended" },
  ];
  return (
    <div className="grid gap-4">
      <details className="card p-5" open={rows.length === 0}>
        <summary className="cursor-pointer font-display text-lg font-bold">+ Add a distributor, reseller or retailer</summary>
        <p className="mt-2 text-sm text-muted">
          Opens an approved account with their price level and branch. Or, ask them to sign up on the website and approve them below.
        </p>
        <div className="mt-4"><CreateAccountForm /></div>
      </details>
      <form className="flex flex-wrap items-end gap-3" action="/admin">
        <input type="hidden" name="tab" value="accounts" />
        <input type="hidden" name="status" value={status} />
        <label className="label">
          Search
          <input className="field" name="q" defaultValue={sp.q ?? ""} placeholder="Name, email, mobile or business" />
        </label>
        <button className="btn-dark" type="submit">Search</button>
      </form>
      <nav aria-label="Filter accounts" className="flex gap-2 overflow-x-auto pb-1">
        {chips.map((c) => (
          <Link
            key={c.id}
            href={`/admin?tab=accounts&status=${c.id}`}
            aria-current={status === c.id ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${status === c.id ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"}`}
          >
            {c.label}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="card p-6 text-muted">No accounts here.</p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/accounts/${p.id}`} className="card flex items-center gap-3 p-4 hover:shadow-lift">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <strong>{p.full_name}</strong>
                    <AccountStatusBadge status={p.status} />
                    <span className="chip">{TIERS.find((t) => t.id === p.tier)?.name}</span>
                    <span className="chip">{BRANCHES.find((b) => b.slug === p.branch_slug)?.city ?? "No branch"}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">
                    {p.business_name ? `${p.business_name} · ` : ""}{p.email} · {p.mobile} · joined {formatDate(p.created_at)}
                  </p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function Prices({ sp }: { sp: SP }) {
  const BRANCHES = await getAllBranches();
  const branch = BRANCHES.some((b) => b.slug === sp.branch) ? sp.branch! : "";
  const tier = TIERS.some((t) => t.id === sp.tier) ? (sp.tier as TierId) : "";
  const sheet = PRICE_SHEETS.find((s) => s.slug === sp.sheet) ?? PRICE_SHEETS[0];
  const key = { branch: branch || null, tier: (tier || null) as TierId | null };
  const lists = await currentLists();
  if (!lists) return <p className="card p-6 text-muted">The database is not connected, so prices can&apos;t be edited here yet.</p>;

  const own = lists.get(`${key.branch}|${key.tier}`);
  const ownLayer = own ? await listItems(own) : new Map();
  const inheritedLayers = (await layersFor(chainFor(key).slice(1))) ?? [];
  const values: Record<string, number | null> = {};
  const inherited: Record<string, number | null> = {};
  for (const r of sheet.rows)
    for (const c of sheet.columns) {
      const ck = cellKey(sheet.slug, r.key, c.key);
      if (ownLayer.has(ck)) values[`${r.key}:${c.key}`] = ownLayer.get(ck) ?? null;
      inherited[`${r.key}:${c.key}`] = resolveCell(inheritedLayers, ck);
    }
  const isBase = !key.branch && !key.tier;

  return (
    <div className="grid gap-5">
      <div className="card p-4 text-sm leading-relaxed text-graphite">
        <p>
          <strong className="text-ink">How prices work:</strong> the <em>All branches · All levels</em> list is the public price list. You can set different prices for a price level, a branch, or one level at one branch. For each item the website uses the most specific price it finds:
          branch + level → level → branch → public list.
        </p>
      </div>
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end" action="/admin">
        <input type="hidden" name="tab" value="prices" />
        <label className="label">
          Branch
          <select className="field" name="branch" defaultValue={branch}>
            <option value="">All branches</option>
            {BRANCHES.map((b) => (
              <option key={b.slug} value={b.slug}>{b.city}</option>
            ))}
          </select>
        </label>
        <label className="label">
          Price level
          <select className="field" name="tier" defaultValue={tier}>
            <option value="">All levels</option>
            {TIERS.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label className="label">
          Price sheet
          <select className="field" name="sheet" defaultValue={sheet.slug}>
            {PRICE_SHEETS.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </label>
        <button className="btn-dark" type="submit">Open</button>
      </form>
      <h2 className="text-xl font-bold">
        {sheet.name}: {branch ? BRANCHES.find((b) => b.slug === branch)!.city : "All branches"} · {tier ? TIERS.find((t) => t.id === tier)!.name : "All levels"}
      </h2>
      <PriceEditor key={`${branch}|${tier}|${sheet.slug}`} sheet={sheet} values={values} inherited={inherited} branch={branch} tier={tier} isBase={isBase} />
    </div>
  );
}

async function Staff({ myId, canGrantFounder }: { myId: string; canGrantFounder: boolean }) {
  const BRANCHES = await getAllBranches();
  const db = supabaseAdmin()!;
  const { data: roles } = await db.from("staff_roles").select("*").order("role");
  const R = (roles ?? []) as StaffRole[];
  const { data: people } = R.length ? await db.from("profiles").select("id,full_name,email").in("id", [...new Set(R.map((r) => r.user_id))]) : { data: [] };
  const who = new Map((people ?? []).map((p) => [p.id, p]));
  return (
    <div className="grid gap-6">
      <section className="card p-5">
        <h2 className="text-lg font-bold">Add a staff member</h2>
        <p className="mt-1 text-sm text-muted">
          They first create a normal account on the website (Sign in → Create an account). Then add their role here. Branch OIC and branch staff see only their branch; admins see everything.
        </p>
        <div className="mt-4">
          <AddStaffForm canGrantFounder={canGrantFounder} />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-bold">Current staff</h2>
        {R.length === 0 ? (
          <p className="card mt-3 p-6 text-muted">No staff roles yet.</p>
        ) : (
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {R.map((r) => {
                  const p = who.get(r.user_id);
                  return (
                    <tr key={r.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3">
                        <span className="font-medium">{p?.full_name ?? "Unknown"}</span>
                        <span className="block text-xs text-muted">{p?.email}</span>
                      </td>
                      <td className="px-4 py-3">{ROLE_LABEL[r.role]}</td>
                      <td className="px-4 py-3">{BRANCHES.find((b) => b.slug === r.branch_slug)?.city ?? "All"}</td>
                      <td className="px-4 py-3 text-right">
                        {r.user_id !== myId && (
                          <form action={removeStaff.bind(null, r.id)}>
                            <button type="submit" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-brand-red-deep hover:bg-sand">
                              <Trash2 size={15} aria-hidden /> Remove
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

async function Branches() {
  const branches = await getAllBranches();
  return (
    <div className="grid gap-4">
      <details className="card p-5">
        <summary className="cursor-pointer font-display text-lg font-bold">+ Add a new branch</summary>
        <div className="mt-4"><BranchForm /></div>
      </details>
      <ul className="grid gap-2">
        {branches.map((b) => (
          <li key={b.slug}>
            <details className="card p-4">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1">
                <strong>{b.city}, {b.province}</strong>
                <span className="chip">{b.region}</span>
                {b.hq && <span className="chip bg-brand-yellow-soft">Main depot</span>}
                <span className={`chip ${b.status === "open" ? "bg-[#e3f4e8] text-success" : b.status === "opening_soon" ? "bg-brand-yellow" : ""}`}>
                  {BRANCH_STATUS_LABEL[b.status ?? "open"]}
                </span>
                <span className="text-sm text-muted">{b.name}</span>
              </summary>
              <div className="mt-4"><BranchForm branch={b} /></div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Payments() {
  const methods = await paymentMethods(false);
  return (
    <div className="grid gap-4">
      <p className="card p-4 text-sm text-graphite">
        These QR codes and account details are shown to customers on the payment page after they place an order. Upload a clear image of each QR code (screenshot from the GCash, BDO, Maya or GoTyme app).
      </p>
      {methods.length === 0 ? (
        <p className="card p-6 text-muted">The payments table is not set up yet. Run the shop migration in Supabase.</p>
      ) : (
        methods.map((m) => <PaymentMethodForm key={m.id} method={m} />)
      )}
    </div>
  );
}

async function OrdersTab() {
  const db = supabaseAdmin()!;
  const { data } = await db.from("orders").select("status,branch_slug").limit(10000);
  const O = data ?? [];
  const open = O.filter((o) => OPEN_ORDER_STATUSES.includes(o.status));
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open orders" value={open.length} />
        <Stat label="Payments to check" value={O.filter((o) => o.status === "payment_review").length} />
        <Stat label="Waiting for payment" value={O.filter((o) => o.status === "pending_payment").length} />
        <Stat label="All orders" value={O.length} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/branch/orders?b=all" className="btn-primary">Open all orders</Link>
        <Link href="/branch/orders?b=all&status=payment_review" className="btn-ghost">Payments to check</Link>
        <Link href="/branch/messages" className="btn-ghost">Inbox</Link>
      </div>
    </div>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { allBranches } from "@/lib/branches-db";
import { BranchForm } from "@/components/dashboard/AdminForms";

export const metadata: Metadata = { title: "Edit branch", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditBranchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireAdmin(`/admin/branches/${slug}`);
  const branch = (await allBranches()).find((b) => b.slug === slug);
  if (!branch) notFound();
  return (
    <div className="container-x py-8 md:py-12">
      <Link href="/admin?tab=branches" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> Branches
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold">{branch.city}</h1>
      <p className="mt-1 text-muted">{branch.name}</p>
      <div className="card mt-6 max-w-3xl p-5 sm:p-6">
        <BranchForm branch={branch} />
      </div>
      <p className="mt-4 max-w-3xl text-sm text-muted">
        To stop showing a branch, set its status to &quot;Closed&quot;. Its past requests, customers and prices are kept.
      </p>
    </div>
  );
}

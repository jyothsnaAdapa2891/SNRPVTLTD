import Link from "next/link";
import { FileText, LogOut, UserRound, Building2 } from "lucide-react";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import ProjectDetailsButton from "./ProjectDetailsButton";

export default async function Header() {
  const session = await getSession();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-gold shadow-sm">
            <FileText size={18} strokeWidth={2.2} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-navy">
              SNR Quote Creator
            </span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-gold">
              SNR Group · Estimates
            </span>
          </span>
        </Link>

        {session && (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 text-sm text-slate-500 sm:flex">
              <UserRound size={15} />
              {session.username}
            </span>
            <Link
              href="/vacants"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-semibold text-navy shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <Building2 size={16} strokeWidth={2.2} />
              <span className="hidden sm:inline">Flats</span>
            </Link>
            <ProjectDetailsButton />
            <form action={logout}>
              <button
                type="submit"
                title="Sign out"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

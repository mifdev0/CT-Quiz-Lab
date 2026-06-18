import Link from "next/link";
import { GraduationCap, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { AppNavigation } from "@/components/app-navigation";

type NavItem = {
  href: string;
  label: string;
};

export function AppShell({
  role,
  title,
  nav,
  userName,
  children
}: {
  role: "Guru" | "Siswa";
  title: string;
  userName?: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <main className="subtle-grid min-h-screen">
      <header className="sticky top-0 z-30 border-b-2 border-slate-200/80 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/login" className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg border-2 border-leafDark bg-gradient-to-br from-leaf via-leaf to-sky text-white shadow-lift">
                <ShieldCheck size={25} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-normal text-leafDark">Media Pembelajaran CT</p>
                <h1 className="text-xl font-black leading-tight text-ink sm:text-2xl">{title}</h1>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border-2 border-slate-200 bg-gradient-to-b from-white to-slate-50 px-3 py-2 font-black text-ink shadow-lift sm:inline-flex">
                {role === "Guru" ? <GraduationCap size={19} aria-hidden="true" /> : <UserRound size={19} aria-hidden="true" />}
                {userName || role}
              </div>
              <form action={logoutAction}>
                <button className="inline-flex h-10 items-center gap-2 rounded-lg border-2 border-slate-200 bg-gradient-to-b from-white to-slate-50 px-3 text-sm font-black text-ink shadow-lift transition active:translate-y-1 active:shadow-none">
                  <LogOut size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </form>
            </div>
          </div>
          <AppNavigation items={nav} />
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}

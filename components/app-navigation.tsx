"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, ClipboardList, FileQuestion, Home, LibraryBig } from "lucide-react";
import { clsx } from "clsx";

type NavItem = {
  href: string;
  label: string;
};

const iconByLabel = {
  Dashboard: Home,
  Materi: BookOpen,
  Kuis: ClipboardList,
  "Soal Kuis": FileQuestion,
  Laporan: BarChart3,
  Hasil: BarChart3
};

export function AppNavigation({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Navigasi utama">
      {items.map((item) => {
        const active = item.href === "/teacher" || item.href === "/student"
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = iconByLabel[item.label as keyof typeof iconByLabel] || LibraryBig;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            aria-current={active ? "page" : undefined}
            className={clsx(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border-2 px-3 text-sm font-black shadow-sm transition",
              active
                ? "border-leafDark bg-leaf text-white"
                : "border-slate-200 bg-white/95 text-ink hover:-translate-y-0.5 hover:border-sky hover:bg-sky/10"
            )}
          >
            <Icon size={16} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

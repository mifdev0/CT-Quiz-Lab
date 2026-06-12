import Link from "next/link";
import { clsx } from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={clsx("surface-card rounded-lg border-2 border-slate-200/90 p-5 shadow-lift", className)}>{children}</section>;
}

export function ButtonLink({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 px-5 font-black shadow-lift transition active:translate-y-1 active:shadow-none",
        variant === "primary"
          ? "border-leafDark bg-gradient-to-b from-leaf to-leafDark text-white hover:brightness-105"
          : "border-slate-200 bg-gradient-to-b from-white to-slate-50 text-ink hover:border-sky hover:text-sky"
      )}
    >
      {children}
    </Link>
  );
}

export function ProgressBar({ value, color = "bg-leaf" }: { value: number; color?: string }) {
  return (
    <div className="h-4 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
      <div className={clsx("h-full rounded-full transition-all duration-500", color)} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  );
}

export function Metric({
  label,
  value,
  tone = "sky"
}: {
  label: string;
  value: string;
  tone?: "sky" | "leaf" | "honey" | "coral" | "ink" | "light";
}) {
  const toneClass = {
    sky: "from-sky/18 to-sky/5 border-sky/25",
    leaf: "from-leaf/20 to-leaf/5 border-leaf/25",
    honey: "from-honey/24 to-honey/5 border-honey/30",
    coral: "from-coral/18 to-coral/5 border-coral/25",
    ink: "from-ink/10 to-slate-50 border-slate-200",
    light: "from-white to-slate-50 border-white"
  }[tone];

  return (
    <div className={clsx("rounded-lg border-2 bg-gradient-to-br p-4 shadow-lift", toneClass)}>
      <p className="text-xs font-black uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

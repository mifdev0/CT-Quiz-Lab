"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    let safetyTimer: ReturnType<typeof setTimeout> | undefined;

    const startLoading = () => {
      setLoading(true);
      clearTimeout(safetyTimer);
      safetyTimer = setTimeout(() => setLoading(false), 15000);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.href === window.location.href || (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.hash)) return;

      startLoading();
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", startLoading);

    return () => {
      clearTimeout(safetyTimer);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", startLoading);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-white/72 backdrop-blur-[2px]" role="status" aria-live="polite">
      <div className="surface-card flex min-w-64 flex-col items-center rounded-lg border-2 border-slate-200 p-6 shadow-lift">
        <LoaderCircle className="route-spinner text-leafDark" size={36} aria-hidden="true" />
        <p className="mt-3 font-black text-ink">Memuat halaman...</p>
        <div className="mt-3 h-2 w-44 overflow-hidden rounded-full bg-slate-100">
          <div className="navigation-progress h-full w-1/2 rounded-full bg-leaf" />
        </div>
      </div>
    </div>
  );
}

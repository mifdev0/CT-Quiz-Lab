import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white/80 backdrop-blur-sm">
      <div className="surface-card flex min-w-64 flex-col items-center rounded-lg border-2 border-slate-200 p-6 shadow-lift">
        <LoaderCircle className="route-spinner text-leafDark" size={34} aria-hidden="true" />
        <p className="mt-3 font-black text-ink">Memuat halaman...</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">Mohon tunggu sebentar.</p>
      </div>
    </div>
  );
}

import { ShieldCheck } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <main className="subtle-grid min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl content-center gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <section className="soft-panel flex flex-col justify-center rounded-lg border-2 border-white/80 p-6 shadow-lift ring-1 ring-slate-200/70 sm:p-8">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-lg bg-gradient-to-br from-leaf via-leaf to-sky text-white shadow-lift">
            <ShieldCheck size={34} aria-hidden="true" />
          </div>
          <p className="mb-2 text-sm font-black uppercase tracking-normal text-leafDark">Media Pembelajaran CT</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-ink sm:text-6xl">CT Quiz Lab</h1>
          <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            Platform kuis interaktif untuk siswa SMP. Guru cukup memasukkan materi, lalu sistem membantu membuat soal variatif yang melatih decomposition, pattern recognition, abstraction, dan algorithmic thinking.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Pecah Masalah", "Cari Pola", "Pilih Informasi", "Susun Langkah"].map((item) => (
              <span key={item} className="rounded-lg border-2 border-white/80 bg-white/80 px-3 py-2 text-sm font-black text-ink shadow-sm">
                {item}
              </span>
            ))}
          </div>
        </section>
        <div className="self-center">
          <AuthPanel error={searchParams?.error} />
        </div>
      </div>
    </main>
  );
}

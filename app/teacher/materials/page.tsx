import { Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { Notice } from "@/components/notice";
import { createMaterialAction, deleteMaterialAction, updateMaterialAction } from "@/app/actions";
import { teacherNav } from "@/lib/app-data";
import { requireUser } from "@/lib/auth";
import { getFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export default async function TeacherMaterialsPage({ searchParams }: { searchParams?: { success?: string; error?: string } }) {
  const user = await requireUser(UserRole.TEACHER);
  const flash = getFlash();
  const materials = await prisma.material.findMany({
    where: { createdById: user.id },
    include: { missions: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell role="Guru" title="Kelola Materi" nav={teacherNav} userName={user.name}>
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <Card>
          <Notice success={flash?.type === "success" ? flash.message : searchParams?.success} error={flash?.type === "error" ? flash.message : searchParams?.error} />
          <h2 className="text-2xl font-black text-ink">Tambah Materi</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Isi materi ini akan dibaca siswa sebelum quiz dan menjadi sumber AI saat membuat soal.
          </p>
          <form action={createMaterialAction}>
            <label className="mt-5 block text-sm font-black text-ink" htmlFor="title">Judul materi</label>
            <input id="title" name="title" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold" placeholder="Contoh: Algoritma Penjadwalan" />
            <label className="mt-4 block text-sm font-black text-ink" htmlFor="content">Isi materi</label>
            <textarea id="content" name="content" className="mt-2 min-h-72 w-full rounded-lg border-2 border-slate-200 p-3 font-semibold leading-6" placeholder="Tulis materi lengkap yang akan dibaca siswa..." />
            <button className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-leafDark bg-leaf px-5 font-black text-white shadow-lift">
              <Save size={19} aria-hidden="true" />
              Simpan Materi
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="text-2xl font-black text-ink">Materi Tersimpan</h2>
          <div className="mt-4 grid gap-3">
            {materials.map((material) => (
              <div key={material.id} className="rounded-lg border-2 border-slate-100 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-black text-ink">{material.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{material.missions.length} kuis memakai materi ini</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">{material.content}</p>
                <details className="mt-3 rounded-lg border-2 border-slate-100 p-3">
                  <summary className="cursor-pointer font-black text-ink">Edit materi</summary>
                  <form action={updateMaterialAction} className="mt-3">
                    <input type="hidden" name="materialId" value={material.id} />
                    <input name="title" defaultValue={material.title} className="h-11 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold" />
                    <textarea name="content" defaultValue={material.content} className="mt-3 min-h-52 w-full rounded-lg border-2 border-slate-200 p-3 font-semibold leading-6" />
                    <button className="mt-3 h-11 rounded-lg border-2 border-leafDark bg-leaf px-4 font-black text-white shadow-lift">Simpan Edit</button>
                  </form>
                </details>
                <form action={deleteMaterialAction} className="mt-3">
                  <input type="hidden" name="materialId" value={material.id} />
                  <button className="h-10 rounded-lg border-2 border-coral bg-white px-4 font-black text-coral">Hapus Materi</button>
                </form>
              </div>
            ))}
            {!materials.length ? <p className="font-semibold text-slate-500">Belum ada materi. Buat materi dulu sebelum membuat kuis.</p> : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

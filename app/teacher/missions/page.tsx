import { Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { Notice } from "@/components/notice";
import { InstantMissionBuilder } from "@/components/instant-mission-builder";
import { teacherNav } from "@/lib/app-data";
import { createMissionAction, deleteMissionAction, updateMissionAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export default async function TeacherMissionsPage({ searchParams }: { searchParams?: { success?: string; error?: string } }) {
  const user = await requireUser(UserRole.TEACHER);
  const flash = getFlash();
  const [missions, materials] = await Promise.all([
    prisma.mission.findMany({ where: { createdById: user.id }, include: { material: true }, orderBy: { createdAt: "desc" } }),
    prisma.material.findMany({ where: { createdById: user.id }, orderBy: { createdAt: "desc" } })
  ]);
  return (
    <AppShell role="Guru" title="Kelola Kuis" nav={teacherNav} userName={user.name}>
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card>
          <Notice success={flash?.type === "success" ? flash.message : searchParams?.success} error={flash?.type === "error" ? flash.message : searchParams?.error} />
          <h2 className="text-2xl font-black text-ink">Form Kuis</h2>
          {!materials.length ? (
            <p className="mt-3 rounded-lg bg-honey/20 p-3 text-sm font-semibold leading-6 text-slate-700">
              Buat materi terlebih dahulu di menu Materi sebelum membuat kuis.
            </p>
          ) : null}
          <form action={createMissionAction}>
            <label className="mt-5 block text-sm font-black text-ink" htmlFor="materialId">Materi untuk kuis</label>
            <select id="materialId" name="materialId" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold">
              <option value="">Pilih materi</option>
              {materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}
            </select>
            <label className="mt-5 block text-sm font-black text-ink" htmlFor="title">Judul kuis</label>
            <input id="title" name="title" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold" placeholder="Contoh: Kuis Algoritma Penjadwalan" />
            <label className="mt-4 block text-sm font-black text-ink" htmlFor="description">Deskripsi</label>
            <input id="description" name="description" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold" placeholder="Tujuan pembelajaran singkat" />
            <button className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-leafDark bg-leaf px-5 font-black text-white shadow-lift">
              <Save size={19} aria-hidden="true" />
              Simpan Kuis
            </button>
          </form>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 text-2xl font-black text-ink">Buat Instan dengan AI</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Pilih materi yang sudah dibuat, lalu AI akan membaca isi materi dan menyiapkan 15 soal quiz beserta kunci jawaban.
          </p>
          <InstantMissionBuilder materials={materials.map((material) => ({ id: material.id, title: material.title }))} />
        </Card>
      </div>
      <div className="mt-5">
        <Card>
          <h2 className="text-xl font-black text-ink">Kuis Tersimpan</h2>
          <div className="mt-4 grid gap-3">
            {missions.map((mission) => (
              <div key={mission.id} className="rounded-lg border-2 border-slate-100 p-3">
                <h3 className="font-black text-ink">{mission.title}</h3>
                <p className="mt-1 text-xs font-black uppercase tracking-normal text-sky">{mission.material?.title || "Tanpa materi"}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{mission.storyIntro || mission.description}</p>
                <details className="mt-3 rounded-lg border-2 border-slate-100 p-3">
                  <summary className="cursor-pointer font-black text-ink">Edit kuis</summary>
                  <form action={updateMissionAction} className="mt-3">
                    <input type="hidden" name="missionId" value={mission.id} />
                    <select name="materialId" defaultValue={mission.materialId || ""} className="h-11 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold">
                      <option value="">Pilih materi</option>
                      {materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}
                    </select>
                    <input name="title" defaultValue={mission.title} className="mt-3 h-11 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold" />
                    <input name="description" defaultValue={mission.description} className="mt-3 h-11 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold" />
                    <button className="mt-3 h-11 rounded-lg border-2 border-leafDark bg-leaf px-4 font-black text-white shadow-lift">Simpan Edit</button>
                  </form>
                </details>
                <form action={deleteMissionAction} className="mt-3">
                  <input type="hidden" name="missionId" value={mission.id} />
                  <button className="h-10 rounded-lg border-2 border-coral bg-white px-4 font-black text-coral">Hapus Kuis</button>
                </form>
              </div>
            ))}
            {!missions.length ? <p className="font-semibold text-slate-500">Belum ada kuis.</p> : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

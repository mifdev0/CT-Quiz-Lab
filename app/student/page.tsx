import { ArrowRight, BookOpenCheck, CheckCircle2, CircleDot, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ButtonLink, Card, Metric, ProgressBar } from "@/components/ui";
import { studentNav } from "@/lib/app-data";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export default async function StudentDashboard() {
  const user = await requireUser(UserRole.STUDENT);
  const [missions, materialReads, progress, challengeAnswers] = await Promise.all([
    prisma.mission.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        materialId: true,
        material: { select: { title: true, content: true } },
        levels: { select: { _count: { select: { challenges: true } } } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.studentMaterialRead.findMany({ where: { studentId: user.id }, select: { materialId: true } }),
    prisma.studentMissionProgress.findMany({ where: { studentId: user.id }, select: { status: true } }),
    prisma.studentChallengeAnswer.findMany({
      where: { studentId: user.id },
      select: { challenge: { select: { level: { select: { missionId: true } } } } }
    })
  ]);
  const completed = progress.filter((item) => item.status === "COMPLETED").length;
  const overallProgress = missions.length ? Math.round((completed / missions.length) * 100) : 0;

  return (
    <AppShell role="Siswa" title="Dashboard Siswa" nav={studentNav} userName={user.name}>
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden p-0">
            <div className="learning-band p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-lg border-2 border-white/50 bg-white/20 text-white shadow-lift">
                  <Sparkles size={28} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase text-white/80">Siswa</p>
                  <h2 className="text-2xl font-black">{user.name}</h2>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="break-words text-sm font-bold text-slate-500">{user.email}</p>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm font-black">
                  <span>Progress kuis</span>
                  <span>{overallProgress}%</span>
                </div>
                <ProgressBar value={overallProgress} />
              </div>
            </div>
          </Card>
          <div className="grid gap-3">
            <Metric label="Kuis tersedia" value={String(missions.length)} tone="sky" />
            <Metric label="Kuis selesai" value={String(completed)} tone="leaf" />
          </div>
          <Card>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-honey/25 text-ink">
                <BookOpenCheck size={25} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-black text-ink">Alur belajar</h3>
                <p className="text-sm font-semibold leading-6 text-slate-600">Baca materi, kerjakan kuis, lalu lihat analisis pemahamanmu.</p>
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="learning-band">
            <p className="mb-2 inline-flex items-center gap-2 rounded-lg border-2 border-white/40 bg-white/20 px-3 py-1 text-sm font-black text-white">
              <BookOpenCheck size={16} aria-hidden="true" />
              Kuis Pembelajaran
            </p>
            <h2 className="text-3xl font-black leading-tight text-white">Pilih kuis dan mulai belajar</h2>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-white/85">
              Guru menyiapkan materi dan kuis. Siswa membaca materi terlebih dahulu, mengerjakan satu paket quiz, lalu sistem menganalisis hasil belajarnya.
            </p>
          </Card>
          <div className="grid gap-4">
            {missions.map((mission) => {
              const missionDone = challengeAnswers.some((answer) => answer.challenge.level.missionId === mission.id);
              const hasReadMaterial = !mission.materialId || materialReads.some((read) => read.materialId === mission.materialId);
              const href = missionDone ? "/student/results" : `/student/mission?mission=${mission.id}`;
              const label = missionDone ? "Lihat Hasil" : hasReadMaterial ? "Kerjakan Kuis" : "Baca Materi";
              const steps = [
                { label: "Materi", done: hasReadMaterial || missionDone },
                { label: "Kuis", done: missionDone },
                { label: "Analisis", done: missionDone }
              ];
              return (
                <Card key={mission.id} className="border-l-8 border-l-leaf">
                  <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                    <div>
                      <h3 className="text-xl font-black text-ink">{mission.title}</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        {mission.material ? `Materi: ${mission.material.title}` : mission.description}
                      </p>
                      {mission.material ? (
                        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">{mission.material.content}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2 text-sm font-black text-slate-600">
                        <span className="rounded-lg border-2 border-leaf/20 bg-leaf/10 px-3 py-2 text-leafDark">{mission.levels.reduce((sum, level) => sum + level._count.challenges, 0)} soal kuis</span>
                      </div>
                    </div>
                    <div className="rounded-lg border-2 border-slate-100 bg-slate-50 p-3">
                      <div className="grid gap-2">
                        {steps.map((step) => (
                          <div key={step.label} className="flex items-center gap-2 text-sm font-black text-ink">
                            {step.done ? <CheckCircle2 size={18} className="text-leafDark" aria-hidden="true" /> : <CircleDot size={18} className="text-slate-400" aria-hidden="true" />}
                            {step.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ButtonLink href={href}>
                      {label}
                      <ArrowRight size={19} aria-hidden="true" />
                    </ButtonLink>
                  </div>
                </Card>
              );
            })}
            {!missions.length ? <Card><p className="font-semibold text-slate-500">Belum ada kuis. Tunggu guru membuat konten.</p></Card> : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

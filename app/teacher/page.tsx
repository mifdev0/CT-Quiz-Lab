import { BookOpenCheck, ChartNoAxesCombined, ClipboardCheck, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ButtonLink, Card, Metric, ProgressBar } from "@/components/ui";
import { learningOutcomes, teacherNav } from "@/lib/app-data";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CTPillar, UserRole } from "@prisma/client";

const pillarMap: Record<string, CTPillar> = {
  decomposition: CTPillar.DECOMPOSITION,
  pattern: CTPillar.PATTERN_RECOGNITION,
  abstraction: CTPillar.ABSTRACTION,
  algorithm: CTPillar.ALGORITHMIC_THINKING
};

export default async function TeacherDashboard() {
  const user = await requireUser(UserRole.TEACHER);
  const [missions, studentRows] = await Promise.all([
    prisma.mission.findMany({
      where: { createdById: user.id },
      select: {
        id: true,
        title: true,
        levels: { select: { _count: { select: { challenges: true } } } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.findMany({
      where: { role: UserRole.STUDENT },
      select: {
        id: true,
        name: true,
        challengeAnswers: {
          where: { challenge: { level: { mission: { createdById: user.id } } } },
          select: {
            isCorrect: true,
            aiFeedback: true,
            challenge: { select: { level: { select: { pillar: true } } } }
          }
        }
      },
      orderBy: { name: "asc" }
    })
  ]);
  const challengeAnswers = studentRows.flatMap((student) => student.challengeAnswers);
  const challengeAvg = challengeAnswers.length ? Math.round((challengeAnswers.filter((answer) => answer.isCorrect).length / challengeAnswers.length) * 100) : 0;
  const pillarScore = (pillar: CTPillar) => {
    const rows = challengeAnswers.filter((answer) => answer.challenge.level.pillar === pillar);
    return rows.length ? Math.round((rows.filter((answer) => answer.isCorrect).length / rows.length) * 100) : 0;
  };
  const pillarValues = learningOutcomes.map((pillar) => ({ ...pillar, value: pillarScore(pillarMap[pillar.key]) }));
  const weakestPillar = pillarValues.filter((pillar) => pillar.value > 0).sort((a, b) => a.value - b.value)[0];
  const studentsNeedSupport = studentRows
    .map((student) => {
      const totalAnswers = student.challengeAnswers.length;
      const correctAnswers = student.challengeAnswers.filter((answer) => answer.isCorrect).length;
      const accuracy = totalAnswers ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
      const pillarScores = learningOutcomes.map((pillar) => {
        const rows = student.challengeAnswers.filter((answer) => answer.challenge.level.pillar === pillarMap[pillar.key]);
        return {
          label: pillar.title,
          value: rows.length ? Math.round((rows.filter((answer) => answer.isCorrect).length / rows.length) * 100) : 0,
          attempted: rows.length
        };
      });
      const weak = pillarScores.filter((item) => item.attempted).sort((a, b) => a.value - b.value)[0];
      const aiNotes = student.challengeAnswers.filter((answer) => answer.aiFeedback);
      return {
        id: student.id,
        name: student.name,
        accuracy,
        totalAnswers,
        weakLabel: weak?.label || "Belum ada data capaian",
        weakScore: weak?.value ?? 0,
        aiNotes: aiNotes.length
      };
    })
    .filter((student) => student.totalAnswers > 0 && (student.accuracy < 70 || student.weakScore < 70 || student.aiNotes > 0))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);
  return (
    <AppShell role="Guru" title="Dashboard Guru" nav={teacherNav} userName={user.name}>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card className="teacher-band">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-lg border-2 border-white/25 bg-white/10 px-3 py-1 text-sm font-black text-white/90">
                  <ClipboardCheck size={16} aria-hidden="true" />
                  Ringkasan kelas
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-white">Pantau pemahaman CT siswa dari kuis interaktif</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/75">
                  Lihat jumlah kuis, jawaban siswa, capaian pembelajaran yang perlu diperkuat, dan catatan AI untuk jawaban essay.
                </p>
              </div>
            </div>
          </Card>
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Siswa" value={String(studentRows.length)} tone="sky" />
            <Metric label="Kuis" value={String(missions.length)} tone="leaf" />
            <Metric label="Jawaban quiz" value={String(challengeAnswers.length)} tone="honey" />
            <Metric label="Akurasi kuis" value={`${challengeAvg}%`} tone="coral" />
          </div>
          <Card>
            <h2 className="flex items-center gap-2 text-2xl font-black text-ink">
              <ChartNoAxesCombined size={25} className="text-leaf" aria-hidden="true" />
              Analisis Kelas
            </h2>
            {!challengeAnswers.length ? (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Analisis capaian akan muncul setelah siswa mengerjakan kuis.
              </p>
            ) : null}
            <div className="mt-4 grid gap-4">
              {pillarValues.map((pillar) => {
                const value = pillar.value;
                const Icon = pillar.icon;
                return (
                  <div key={pillar.key}>
                    <div className="mb-2 flex items-center justify-between font-black">
                      <span className="flex items-center gap-2">
                        <Icon size={18} aria-hidden="true" />
                        {pillar.title}
                      </span>
                      <span>{value}%</span>
                    </div>
                    <ProgressBar value={value} color={pillar.color} />
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <h2 className="text-2xl font-black text-ink">Siswa Perlu Pendampingan</h2>
            <div className="mt-4 grid gap-3">
              {studentsNeedSupport.map((student) => (
                <div key={student.id} className="rounded-lg border-2 border-coral/20 bg-coral/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-ink">{student.name}</h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                        Akurasi {student.accuracy}%. Perlu perhatian pada {student.weakLabel} ({student.weakScore}%).
                      </p>
                      {student.aiNotes ? <p className="mt-1 text-sm font-semibold text-sky">{student.aiNotes} jawaban essay punya catatan AI.</p> : null}
                    </div>
                    <span className="rounded-lg border-2 border-coral/20 bg-white px-3 py-2 text-sm font-black text-coral">Prioritas</span>
                  </div>
                </div>
              ))}
              {!studentsNeedSupport.length ? (
                <p className="font-semibold text-slate-500">Belum ada data pendampingan. Daftar ini akan terisi setelah siswa mengerjakan kuis.</p>
              ) : null}
            </div>
          </Card>
          <Card>
            <h2 className="text-2xl font-black text-ink">Ringkasan Konten Kuis</h2>
            {!missions.length ? (
              <div className="mt-4 rounded-lg border-2 border-dashed border-sky/30 bg-sky/5 p-5">
                <h3 className="font-black text-ink">Belum ada kuis</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Mulai dari menu Kelola Kuis. Guru bisa menulis materi singkat, lalu AI membuat paket soal CT otomatis.
                </p>
                <div className="mt-4">
                  <ButtonLink href="/teacher/missions">Buat Kuis</ButtonLink>
                </div>
              </div>
            ) : (
            <div className="mt-4 overflow-hidden rounded-lg border-2 border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3 font-black">Kuis</th>
                    <th className="p-3 font-black">Jumlah Soal</th>
                    <th className="p-3 font-black">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((mission) => (
                    <tr key={mission.id} className="border-t-2 border-slate-100">
                      <td className="p-3 font-black text-ink">{mission.title}</td>
                      <td className="p-3 font-semibold">{mission.levels.reduce((sum, level) => sum + level._count.challenges, 0)} soal</td>
                      <td className="p-3 font-semibold text-slate-600">{mission.levels.some((level) => level._count.challenges) ? "Siap dikerjakan" : "Belum ada soal"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <h2 className="flex items-center gap-2 text-xl font-black text-ink">
              <BookOpenCheck size={22} className="text-sky" aria-hidden="true" />
              Konten Kuis
            </h2>
            <div className="mt-4 grid gap-3">
              <ButtonLink href="/teacher/missions">Kelola Kuis</ButtonLink>
              <ButtonLink href="/teacher/challenges" variant="secondary">Kelola Soal Kuis</ButtonLink>
            </div>
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 text-xl font-black text-ink">
              <UsersRound size={22} className="text-leaf" aria-hidden="true" />
              Analisis Pembelajaran
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              {challengeAnswers.length
                ? weakestPillar
                  ? `Capaian yang paling perlu ditingkatkan adalah ${weakestPillar.title} dengan rata-rata ${weakestPillar.value}%. Guru dapat menambah contoh dan latihan yang sesuai.`
                  : "Data jawaban sudah masuk, tetapi belum cukup untuk menentukan capaian yang perlu diperkuat."
                : "Buat kuis dari materi. Setelah siswa mengerjakan, bagian ini akan menampilkan capaian pembelajaran yang perlu diperkuat."}
            </p>
            {studentsNeedSupport.length ? (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                {studentsNeedSupport.length} siswa masuk daftar pendampingan. Prioritaskan siswa dengan akurasi rendah dan catatan AI pada jawaban essay.
              </p>
            ) : null}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { AnswerField } from "@/components/answer-field";
import { markMaterialReadAction, submitChallengesAction } from "@/app/actions";
import { studentFriendlyChallengeView, studentNav } from "@/lib/app-data";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export default async function MissionPage({ searchParams }: { searchParams?: { mission?: string } }) {
  const user = await requireUser(UserRole.STUDENT);
  const mission = searchParams?.mission
    ? await prisma.mission.findUnique({
        where: { id: searchParams.mission },
        include: { material: true, levels: { orderBy: { order: "asc" }, include: { challenges: { include: { options: { orderBy: { order: "asc" } } } } } } }
      })
    : await prisma.mission.findFirst({
        include: { material: true, levels: { orderBy: { order: "asc" }, include: { challenges: { include: { options: { orderBy: { order: "asc" } } } } } } }
      });
  const challenges = mission?.levels.flatMap((level) => level.challenges.map((challenge) => ({ ...challenge, level }))) || [];
  const [alreadyDone, materialRead] = await Promise.all([
    challenges.length
      ? prisma.studentChallengeAnswer.findFirst({
          where: { studentId: user.id, challengeId: { in: challenges.map((challenge) => challenge.id) } },
          select: { id: true }
        })
      : null,
    mission?.materialId
      ? prisma.studentMaterialRead.findUnique({
          where: { studentId_materialId: { studentId: user.id, materialId: mission.materialId } },
          select: { id: true }
        })
      : null
  ]);

  return (
    <AppShell role="Siswa" title="Kuis Interaktif" nav={studentNav} userName={user.name}>
      {!mission || !challenges.length ? (
        <Card><p className="font-semibold text-slate-600">Soal kuis belum tersedia. Guru perlu menambahkan soal dulu.</p></Card>
      ) : mission.material && !materialRead ? (
        <div className="space-y-4">
          <Card>
            <p className="text-sm font-black uppercase tracking-normal text-leafDark">Materi Sebelum Quiz</p>
            <h2 className="mt-1 text-3xl font-black text-ink">{mission.material.title}</h2>
            <div className="mt-4 whitespace-pre-line rounded-lg border-2 border-slate-100 bg-slate-50 p-4 text-sm font-semibold leading-7 text-slate-700">
              {mission.material.content}
            </div>
            <form action={markMaterialReadAction} className="mt-5">
              <input type="hidden" name="missionId" value={mission.id} />
              <input type="hidden" name="materialId" value={mission.material.id} />
              <button className="min-h-12 rounded-lg border-2 border-leafDark bg-leaf px-5 font-black text-white shadow-lift">Saya Sudah Membaca</button>
            </form>
          </Card>
        </div>
      ) : alreadyDone ? (
        <Card>
          <p className="font-semibold text-slate-600">Kuis sudah selesai. Kamu bisa melihat analisis hasil belajarmu.</p>
          <Link href="/student/results" className="mt-4 inline-flex min-h-12 rounded-lg border-2 border-leafDark bg-leaf px-5 py-3 font-black text-white shadow-lift">Lihat Hasil</Link>
        </Card>
      ) : (
        <form action={submitChallengesAction} className="space-y-4">
          <input type="hidden" name="missionId" value={mission.id} />
          <Card>
            <p className="text-sm font-black uppercase tracking-normal text-leafDark">Materi Kuis</p>
            <h2 className="text-3xl font-black text-ink">{mission.title}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{mission.material?.title || mission.description}</p>
          </Card>
          {challenges.map((challenge, index) => {
            const view = studentFriendlyChallengeView({
              pillar: challenge.level.pillar,
              prompt: challenge.prompt,
              options: challenge.options,
              correctAnswer: String(challenge.correctAnswer),
              missionContext: `${mission.title} ${mission.storyIntro}`
            });

            return (
              <Card key={challenge.id}>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-sky/10 px-3 py-1 text-sm font-black text-sky">Soal {index + 1}</span>
                </div>
                <h3 className="text-lg font-black leading-7 text-ink">{view.prompt.replace(/^Soal\s+\d+:\s*/i, "")}</h3>
                <AnswerField name={challenge.id} type={challenge.type} options={view.options} />
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">Gunakan materi sebagai dasar jawabanmu.</p>
              </Card>
            );
          })}
          <div className="flex gap-3">
            <button className="min-h-12 rounded-lg border-2 border-leafDark bg-leaf px-5 font-black text-white shadow-lift">Simpan Jawaban Kuis</button>
          </div>
        </form>
      )}
    </AppShell>
  );
}

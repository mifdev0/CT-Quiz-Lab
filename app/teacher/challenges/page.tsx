import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { Notice } from "@/components/notice";
import { ChallengeBuilder } from "@/components/challenge-builder";
import { teacherNav } from "@/lib/app-data";
import { deleteChallengeAction, duplicateChallengeAction, updateChallengeAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export default async function TeacherChallengesPage({ searchParams }: { searchParams?: { success?: string; error?: string } }) {
  const user = await requireUser(UserRole.TEACHER);
  const missions = await prisma.mission.findMany({
    where: { createdById: user.id },
    include: { levels: { include: { challenges: { include: { options: { orderBy: { order: "asc" } } } } }, orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" }
  });
  const levels = missions.flatMap((mission) => mission.levels.map((level) => ({ ...level, missionTitle: mission.title })));

  return (
    <AppShell role="Guru" title="Kelola Soal Interaktif CT" nav={teacherNav} userName={user.name}>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card>
          <Notice success={searchParams?.success} error={searchParams?.error} />
          <h2 className="text-2xl font-black text-ink">Tambah Soal Interaktif</h2>
          <ChallengeBuilder levels={levels.map((level) => ({ id: level.id, title: `${level.missionTitle} - ${level.title}` }))} />
        </Card>
        <div className="grid gap-4">
          {levels.map((level) => (
            <Card key={level.id}>
              <p className="text-sm font-black text-slate-500">{level.missionTitle}</p>
              <h2 className="text-xl font-black text-ink">{level.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{level.challenges.length} soal interaktif tersimpan</p>
              <div className="mt-4 grid gap-3">
                {level.challenges.map((challenge) => (
                  <div key={challenge.id} className="rounded-lg border-2 border-slate-100 p-3">
                    <p className="text-sm font-black text-sky">{challenge.type}</p>
                    <h3 className="mt-1 font-black text-ink">{challenge.prompt}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-600">Kunci: {String(challenge.correctAnswer)}</p>
                    <details className="mt-3 rounded-lg border-2 border-slate-100 p-3">
                      <summary className="cursor-pointer font-black text-ink">Edit soal interaktif</summary>
                      <form action={updateChallengeAction} className="mt-3">
                        <input type="hidden" name="challengeId" value={challenge.id} />
                        <label className="block text-sm font-black text-ink">Tipe soal</label>
                        <select name="questionType" defaultValue={challenge.type} className="mt-2 h-11 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold">
                          <option value="MULTIPLE_CHOICE">Pilihan ganda</option>
                          <option value="TRUE_FALSE">True/False</option>
                          <option value="SHORT_ANSWER">Essay singkat</option>
                        </select>
                        <textarea name="prompt" defaultValue={challenge.prompt} className="mt-3 min-h-24 w-full rounded-lg border-2 border-slate-200 p-3 font-semibold" />
                        {[1, 2, 3, 4].map((n) => (
                          <input
                            key={n}
                            name={`option${n}`}
                            defaultValue={challenge.options[n - 1]?.text || ""}
                            className="mt-3 h-11 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold"
                            placeholder={`Opsi ${n}, kosongkan untuk essay`}
                          />
                        ))}
                        <input name="answer" defaultValue={String(challenge.correctAnswer)} className="mt-3 h-11 w-full rounded-lg border-2 border-leaf px-3 font-semibold" placeholder="Kunci jawaban" />
                        <textarea name="feedbackCorrect" defaultValue={challenge.feedbackCorrect} className="mt-3 min-h-20 w-full rounded-lg border-2 border-slate-200 p-3 font-semibold" placeholder="Feedback jika benar" />
                        <textarea name="feedbackWrong" defaultValue={challenge.feedbackWrong} className="mt-3 min-h-20 w-full rounded-lg border-2 border-slate-200 p-3 font-semibold" placeholder="Feedback jika salah" />
                        <button className="mt-3 h-11 rounded-lg border-2 border-leafDark bg-leaf px-4 font-black text-white shadow-lift">Simpan Edit</button>
                      </form>
                    </details>
                    <form action={deleteChallengeAction} className="mt-3">
                      <input type="hidden" name="challengeId" value={challenge.id} />
                      <button className="h-10 rounded-lg border-2 border-coral bg-white px-4 font-black text-coral">Hapus Soal</button>
                    </form>
                    <form action={duplicateChallengeAction} className="mt-3">
                      <input type="hidden" name="challengeId" value={challenge.id} />
                      <button className="h-10 rounded-lg border-2 border-sky bg-white px-4 font-black text-sky">Duplikasi Soal</button>
                    </form>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {!levels.length ? <Card><p className="font-semibold text-slate-500">Buat kuis dulu agar bagian CT tersedia.</p></Card> : null}
        </div>
      </div>
    </AppShell>
  );
}

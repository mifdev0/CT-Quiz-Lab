import { BadgeCheck, Eye, Lightbulb } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Metric, ProgressBar } from "@/components/ui";
import { pillars, studentNav } from "@/lib/app-data";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CTPillar, UserRole } from "@prisma/client";

const pillarMap: Record<string, CTPillar> = {
  decomposition: CTPillar.DECOMPOSITION,
  pattern: CTPillar.PATTERN_RECOGNITION,
  abstraction: CTPillar.ABSTRACTION,
  algorithm: CTPillar.ALGORITHMIC_THINKING
};

function percent(correct: number, total: number) {
  return total ? Math.round((correct / total) * 100) : 0;
}

function displayAnswer(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(displayAnswer).join(", ");
  try { return JSON.stringify(value); } catch { return String(value); }
}

export default async function StudentResultsPage() {
  const user = await requireUser(UserRole.STUDENT);
  const challengeAnswers = await prisma.studentChallengeAnswer.findMany({
    where: { studentId: user.id },
    include: {
      challenge: {
        include: {
          level: { include: { mission: true } },
          options: { orderBy: { order: "asc" } }
        }
      }
    },
    orderBy: { submittedAt: "desc" }
  });

  const correctAnswers = challengeAnswers.filter((answer) => answer.isCorrect).length;
  const understandingScore = challengeAnswers.length ? Math.round((correctAnswers / challengeAnswers.length) * 100) : 0;
  const message = !challengeAnswers.length
    ? "Kerjakan quiz terlebih dahulu agar hasil belajar muncul."
    : understandingScore >= 80
      ? "Pemahaman materi sudah kuat."
      : understandingScore >= 60
        ? "Pemahaman materi cukup, tetapi masih perlu latihan pada beberapa soal."
        : "Pemahaman materi masih perlu diperkuat. Coba pelajari ulang materi dan kerjakan ulang setelah guru melakukan reset.";

  const missionGroups = new Map<string, { mission: { id: string; title: string }; answers: typeof challengeAnswers; pillarScores: { key: string; title: string; color: string; value: number; attempted: number }[] }>();
  for (const answer of challengeAnswers) {
    const missionId = answer.challenge.level.mission.id;
    if (!missionGroups.has(missionId)) {
      missionGroups.set(missionId, {
        mission: { id: missionId, title: answer.challenge.level.mission.title },
        answers: [],
        pillarScores: pillars.map((p) => ({ ...p, value: 0, attempted: 0 }))
      });
    }
    missionGroups.get(missionId)!.answers.push(answer);
  }
  for (const [, group] of missionGroups) {
    group.pillarScores = pillars.map((pillar) => {
      const rows = group.answers.filter((a) => a.challenge.level.pillar === pillarMap[pillar.key]);
      return { ...pillar, value: percent(rows.filter((a) => a.isCorrect).length, rows.length), attempted: rows.length };
    });
  }

  return (
    <AppShell role="Siswa" title="Hasil Belajar" nav={studentNav} userName={user.name}>
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Pemahaman materi" value={`${understandingScore}%`} />
              <Metric label="Jawaban benar" value={`${correctAnswers}/${challengeAnswers.length}`} />
              <Metric label="Jawaban tersimpan" value={String(challengeAnswers.length)} />
            </div>
            <Card>
              <h2 className="text-2xl font-black text-ink">Ringkasan Pemahaman Materi</h2>
              <div className="mt-4">
                <ProgressBar value={understandingScore} color="bg-leaf" />
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{message}</p>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <h2 className="flex items-center gap-2 text-xl font-black text-ink">
                <BadgeCheck size={22} className="text-leaf" aria-hidden="true" />
                Ringkasan
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Hasil ini dihitung dari semua jawaban quiz yang sudah kamu kirim.
              </p>
            </Card>
            <Card>
              <h2 className="flex items-center gap-2 text-xl font-black text-ink">
                <Lightbulb size={22} className="text-honey" aria-hidden="true" />
                Saran Belajar
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Pelajari ulang materi pada soal yang terasa sulit, lalu minta guru melakukan reset jika perlu mengerjakan ulang.
              </p>
            </Card>
          </div>
        </div>

        {[...missionGroups.values()].map((group) => (
          <Card key={group.mission.id}>
            <details open>
              <summary className="cursor-pointer text-2xl font-black text-ink">{group.mission.title}</summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Metric label="Jawaban benar" value={`${group.answers.filter((a) => a.isCorrect).length}/${group.answers.length}`} tone="leaf" />
                <Metric label="Akurasi" value={`${percent(group.answers.filter((a) => a.isCorrect).length, group.answers.length)}%`} tone="coral" />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border-2 border-slate-100 p-4">
                  <h3 className="text-xl font-black text-ink">Skor per Pilar CT</h3>
                  <div className="mt-4 grid gap-3">
                    {group.pillarScores.map((pillar) => (
                      <div key={pillar.key}>
                        <div className="mb-1 flex justify-between font-black">
                          <span>{pillar.title}</span>
                          <span>{pillar.attempted ? `${pillar.value}%` : "Belum ada jawaban"}</span>
                        </div>
                        <ProgressBar value={pillar.attempted ? pillar.value : 0} color={pillar.color} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto rounded-lg border-2 border-slate-200">
                <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-3 font-black">#</th>
                      <th className="p-3 font-black">Status</th>
                      <th className="p-3 font-black">Soal</th>
                      <th className="p-3 font-black">Detail Jawaban</th>
                      <th className="p-3 font-black">Review AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.answers.map((answer, index) => {
                      const challenge = answer.challenge;
                      return (
                        <tr key={answer.id} className="border-t-2 border-slate-100 align-top">
                          <td className="p-3 font-black text-ink">{index + 1}</td>
                          <td className="p-3">
                            <span className={`rounded-lg px-2 py-1 text-xs font-black ${answer.isCorrect ? "bg-leaf/10 text-leafDark" : "bg-coral/10 text-coral"}`}>
                              {answer.isCorrect ? "Benar" : "Salah"}
                            </span>
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-ink">{challenge.prompt}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">Tipe: {challenge.type.replace(/_/g, " ")}</p>
                          </td>
                          <td className="p-3">
                            <details>
                              <summary className="cursor-pointer font-black text-sky">Lihat jawaban</summary>
                              <div className="mt-3 space-y-3">
                                {challenge.options.length ? (
                                  <div className="grid gap-1">
                                    {challenge.options.map((option) => {
                                      const isSelected = displayAnswer(answer.answer) === option.text;
                                      return (
                                        <div key={option.id} className={`rounded-lg px-2 py-1 text-xs font-semibold ${option.isCorrect ? "bg-leaf/10 text-leafDark" : isSelected ? "bg-coral/10 text-coral" : "bg-slate-50 text-slate-500"}`}>
                                          {option.text}
                                          {option.isCorrect ? " (kunci)" : ""}
                                          {isSelected ? " (jawabanmu)" : ""}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="grid gap-2">
                                    <div className="rounded-lg bg-slate-50 p-2">
                                      <p className="text-xs font-black uppercase text-slate-500">Jawabanmu</p>
                                      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{displayAnswer(answer.answer)}</p>
                                    </div>
                                    <div className="rounded-lg bg-leaf/10 p-2">
                                      <p className="text-xs font-black uppercase text-leafDark">Kunci jawaban</p>
                                      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{displayAnswer(challenge.correctAnswer)}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </details>
                          </td>
                          <td className="p-3">
                            {answer.aiFeedback ? (
                              <details>
                                <summary className="cursor-pointer font-black text-sky">Lihat review</summary>
                                <div className="mt-3 rounded-lg bg-sky/10 p-2">
                                  <p className="font-black text-ink">Skor AI: {answer.aiScore ?? 0}/10</p>
                                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{answer.aiFeedback}</p>
                                </div>
                              </details>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

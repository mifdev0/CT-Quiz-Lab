import { ChartNoAxesCombined } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Metric, ProgressBar } from "@/components/ui";
import { pillars, teacherNav } from "@/lib/app-data";
import { Notice } from "@/components/notice";
import { resetStudentMissionAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CTPillar, UserRole } from "@prisma/client";

const pillarMap: Record<string, CTPillar> = {
  decomposition: CTPillar.DECOMPOSITION,
  pattern: CTPillar.PATTERN_RECOGNITION,
  abstraction: CTPillar.ABSTRACTION,
  algorithm: CTPillar.ALGORITHMIC_THINKING
};

type StudentWithAnswers = Awaited<ReturnType<typeof getStudents>>[number];
type MissionWithContent = Awaited<ReturnType<typeof getMissions>>[number];

function getStudents() {
  return prisma.user.findMany({
    where: { role: UserRole.STUDENT },
    include: {
      testAnswers: { include: { testQuestion: { include: { test: true } } } },
      challengeAnswers: {
        include: {
          challenge: {
            include: {
              level: true,
              options: { orderBy: { order: "asc" } }
            }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  });
}

function getMissions(teacherId: string) {
  return prisma.mission.findMany({
    where: { createdById: teacherId },
    include: {
      tests: { include: { questions: true } },
      levels: { include: { challenges: true }, orderBy: { order: "asc" } }
    },
    orderBy: { createdAt: "desc" }
  });
}

function percent(correct: number, total: number) {
  return total ? Math.round((correct / total) * 100) : 0;
}

function displayAnswer(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(displayAnswer).join(", ");
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function answerStatus(isCorrect: boolean) {
  return isCorrect
    ? "rounded-lg bg-leaf/10 px-2 py-1 text-xs font-black text-leafDark"
    : "rounded-lg bg-coral/10 px-2 py-1 text-xs font-black text-coral";
}

function missionAnswers(student: StudentWithAnswers, mission: MissionWithContent) {
  const testAnswers = student.testAnswers.filter((answer) => answer.testQuestion.test.missionId === mission.id);
  const challengeAnswers = student.challengeAnswers.filter((answer) => answer.challenge.level.missionId === mission.id);
  return { testAnswers, challengeAnswers };
}

function analyzeStudentMission(student: StudentWithAnswers, mission: MissionWithContent) {
  const { testAnswers, challengeAnswers } = missionAnswers(student, mission);
  const pre = testAnswers.filter((answer) => answer.testQuestion.test.type === "PRE_TEST");
  const post = testAnswers.filter((answer) => answer.testQuestion.test.type === "POST_TEST");
  const total = challengeAnswers.length;
  const correct = challengeAnswers.filter((answer) => answer.isCorrect).length;
  const accuracy = percent(correct, total);
  const pillarScores = pillars.map((pillar) => {
    const rows = challengeAnswers.filter((answer) => answer.challenge.level.pillar === pillarMap[pillar.key]);
    return {
      ...pillar,
      value: percent(rows.filter((answer) => answer.isCorrect).length, rows.length),
      attempted: rows.length
    };
  });
  const weakest = pillarScores.filter((pillar) => pillar.attempted).sort((a, b) => a.value - b.value)[0];
  const aiReviews = challengeAnswers.filter((answer) => answer.aiFeedback);
  const needsSupport = total > 0 && (accuracy < 70 || Boolean(weakest && weakest.value < 70) || aiReviews.some((answer) => !answer.isCorrect));
  const recommendation = !total
    ? "Belum mengerjakan kuis ini."
    : accuracy < 60
      ? "Perlu pendampingan intensif dan reset jika guru ingin siswa mengulang."
      : weakest && weakest.value < 70
        ? `Perlu latihan tambahan pada ${weakest.title}.`
        : aiReviews.some((answer) => !answer.isCorrect)
          ? "Tinjau feedback AI pada jawaban essay."
          : "Pemahaman kuis ini cukup baik.";

  return {
    preCorrect: pre.filter((answer) => answer.isCorrect).length,
    preTotal: pre.length,
    postCorrect: post.filter((answer) => answer.isCorrect).length,
    postTotal: post.length,
    challengeCorrect: challengeAnswers.filter((answer) => answer.isCorrect).length,
    challengeTotal: challengeAnswers.length,
    accuracy,
    pillarScores,
    weakest,
    aiReviews,
    needsSupport,
    recommendation
  };
}

function missionSummary(students: StudentWithAnswers[], mission: MissionWithContent) {
  const analyses = students.map((student) => analyzeStudentMission(student, mission));
  const attempted = analyses.filter((item) => item.challengeTotal > 0);
  const preCorrect = analyses.reduce((sum, item) => sum + item.preCorrect, 0);
  const preTotal = analyses.reduce((sum, item) => sum + item.preTotal, 0);
  const postCorrect = analyses.reduce((sum, item) => sum + item.postCorrect, 0);
  const postTotal = analyses.reduce((sum, item) => sum + item.postTotal, 0);
  const challengeCorrect = analyses.reduce((sum, item) => sum + item.challengeCorrect, 0);
  const challengeTotal = analyses.reduce((sum, item) => sum + item.challengeTotal, 0);
  const pillarScores = pillars.map((pillar) => {
    const rows = students.flatMap((student) => missionAnswers(student, mission).challengeAnswers)
      .filter((answer) => answer.challenge.level.pillar === pillarMap[pillar.key]);
    return { ...pillar, value: percent(rows.filter((answer) => answer.isCorrect).length, rows.length), attempted: rows.length };
  });
  const weakest = pillarScores.filter((pillar) => pillar.attempted).sort((a, b) => a.value - b.value)[0];
  return { attempted, preCorrect, preTotal, postCorrect, postTotal, challengeCorrect, challengeTotal, pillarScores, weakest };
}

export default async function ReportsPage({ searchParams }: { searchParams?: { success?: string; error?: string } }) {
  const user = await requireUser(UserRole.TEACHER);
  const [students, missions] = await Promise.all([getStudents(), getMissions(user.id)]);
  const allAnalyses = missions.flatMap((mission) => students.map((student) => analyzeStudentMission(student, mission)));
  const activeStudents = new Set(
    students.filter((student) => missions.some((mission) => {
      const item = analyzeStudentMission(student, mission);
      return item.challengeTotal > 0;
    })).map((student) => student.id)
  ).size;
  const supportCount = allAnalyses.filter((item) => item.needsSupport).length;

  return (
    <AppShell role="Guru" title="Laporan CT" nav={teacherNav} userName={user.name}>
      <div className="space-y-5">
        <Notice success={searchParams?.success} error={searchParams?.error} />

        <Card className="teacher-band">
          <p className="inline-flex items-center gap-2 rounded-lg border-2 border-white/25 bg-white/10 px-3 py-1 text-sm font-black text-white/90">
            <ChartNoAxesCombined size={16} aria-hidden="true" />
            Laporan hasil belajar
          </p>
          <h2 className="mt-3 text-3xl font-black text-white">Ringkasan Semua Kuis</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Metric label="Total kuis" value={String(missions.length)} tone="light" />
            <Metric label="Siswa aktif" value={`${activeStudents}/${students.length}`} tone="light" />
            <Metric label="Butuh pendampingan" value={String(supportCount)} tone="light" />
            <Metric label="Essay AI" value={String(students.reduce((sum, student) => sum + student.challengeAnswers.filter((answer) => answer.aiFeedback).length, 0))} tone="light" />
          </div>
          <p className="mt-4 text-sm font-semibold leading-6 text-white/75">
            Laporan ini memisahkan analisis keseluruhan dan analisis per kuis, supaya nilai dari beberapa kuis tidak tercampur tanpa konteks.
          </p>
        </Card>

        {!missions.length ? (
          <Card><p className="font-semibold text-slate-500">Belum ada kuis. Buat kuis terlebih dahulu.</p></Card>
        ) : null}

        {missions.map((mission) => {
          const summary = missionSummary(students, mission);
          const supportStudents = students
            .map((student) => ({ student, analysis: analyzeStudentMission(student, mission) }))
            .filter((item) => item.analysis.needsSupport);

          return (
            <Card key={mission.id}>
              <details open>
                <summary className="cursor-pointer text-2xl font-black text-ink">{mission.title}</summary>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{mission.description || mission.storyIntro}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <Metric label="Siswa mengerjakan" value={`${summary.attempted.length}/${students.length}`} tone="sky" />
                  <Metric label="Soal benar" value={`${summary.challengeCorrect}/${summary.challengeTotal}`} tone="leaf" />
                  <Metric label="Akurasi quiz" value={`${summary.challengeTotal ? Math.round((summary.challengeCorrect / summary.challengeTotal) * 100) : 0}%`} tone="coral" />
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border-2 border-slate-100 p-4">
                    <h3 className="text-xl font-black text-ink">Analisis Pilar Kuis</h3>
                    <div className="mt-4 grid gap-3">
                      {summary.pillarScores.map((pillar) => (
                        <div key={pillar.key}>
                          <div className="mb-1 flex justify-between font-black">
                            <span>{pillar.title}</span>
                            <span>{pillar.attempted ? `${pillar.value}%` : "Belum ada jawaban"}</span>
                          </div>
                          <ProgressBar value={pillar.attempted ? pillar.value : 0} color={pillar.color} />
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                      {summary.weakest
                        ? `Aspek paling perlu ditingkatkan pada kuis ini adalah ${summary.weakest.title} (${summary.weakest.value}%).`
                        : "Belum cukup data untuk menentukan aspek terlemah."}
                    </p>
                  </div>

                  <div className="rounded-lg border-2 border-slate-100 p-4">
                    <h3 className="text-xl font-black text-ink">Siswa Perlu Pendampingan</h3>
                    <div className="mt-4 grid gap-3">
                      {supportStudents.map(({ student, analysis }) => (
                        <div key={student.id} className="rounded-lg border-2 border-slate-100 p-3">
                          <h4 className="font-black text-ink">{student.name}</h4>
                          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                            Akurasi {analysis.accuracy}%. {analysis.recommendation}
                          </p>
                        </div>
                      ))}
                      {!supportStudents.length ? <p className="font-semibold text-slate-500">Belum ada siswa prioritas pada kuis ini.</p> : null}
                    </div>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto rounded-lg border-2 border-slate-200">
                  <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-3 font-black">Siswa</th>
                        <th className="p-3 font-black">Benar</th>
                        <th className="p-3 font-black">Akurasi</th>
                        <th className="p-3 font-black">Analisis</th>
                        <th className="p-3 font-black">Reset</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const analysis = analyzeStudentMission(student, mission);
                        return (
                          <tr key={student.id} className="border-t-2 border-slate-100 align-top">
                            <td className="p-3 font-black text-ink">{student.name}</td>
                            <td className="p-3 font-semibold">{analysis.challengeCorrect}/{analysis.challengeTotal}</td>
                            <td className="p-3 font-semibold">{analysis.accuracy}%</td>
                            <td className="p-3">
                              <details className="rounded-lg border-2 border-slate-100 p-2">
                                <summary className="cursor-pointer font-black text-leafDark">Detail</summary>
                                <div className="mt-3 space-y-3 font-semibold leading-6 text-slate-600">
                                  <p>Akurasi total: {analysis.accuracy}%</p>
                                  <p>Aspek lemah: {analysis.weakest ? `${analysis.weakest.title} (${analysis.weakest.value}%)` : "Belum ada data"}</p>
                                  <p>Rekomendasi: {analysis.recommendation}</p>
                                  <details className="rounded-lg border-2 border-slate-100 p-2" open>
                                    <summary className="cursor-pointer font-black text-ink">Jawaban Kuis ({analysis.challengeTotal})</summary>
                                    <div className="mt-3 grid gap-3">
                                      {missionAnswers(student, mission).challengeAnswers.map((answer, answerIndex) => (
                                        <div key={answer.id} className="rounded-lg border-2 border-slate-100 bg-white p-3">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="font-black text-ink">Soal {answerIndex + 1}</p>
                                            <span className={answerStatus(answer.isCorrect)}>{answer.isCorrect ? "Benar" : "Salah"}</span>
                                          </div>
                                          <p className="mt-2 text-sm font-black text-slate-700">{answer.challenge.prompt}</p>
                                          {answer.challenge.options.length ? (
                                            <div className="mt-2 grid gap-1">
                                              {answer.challenge.options.map((option) => (
                                                <p key={option.id} className={`rounded-lg px-2 py-1 text-xs font-semibold ${option.isCorrect ? "bg-leaf/10 text-leafDark" : "bg-slate-50 text-slate-500"}`}>
                                                  {option.text}{option.isCorrect ? " (kunci)" : ""}
                                                </p>
                                              ))}
                                            </div>
                                          ) : null}
                                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                                            <div className="rounded-lg bg-slate-50 p-2">
                                              <p className="text-xs font-black uppercase text-slate-500">Jawaban siswa</p>
                                              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{displayAnswer(answer.answer)}</p>
                                            </div>
                                            <div className="rounded-lg bg-leaf/10 p-2">
                                              <p className="text-xs font-black uppercase text-leafDark">Kunci/Rubrik</p>
                                              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{displayAnswer(answer.challenge.correctAnswer)}</p>
                                            </div>
                                          </div>
                                          {answer.aiFeedback ? (
                                            <div className="mt-3 rounded-lg bg-sky/10 p-2">
                                              <p className="text-xs font-black uppercase text-sky">Review AI</p>
                                              <p className="mt-1 font-black text-ink">Skor AI: {answer.aiScore ?? 0}/10</p>
                                              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{answer.aiFeedback}</p>
                                            </div>
                                          ) : null}
                                        </div>
                                      ))}
                                      {!analysis.challengeTotal ? <p className="font-semibold text-slate-500">Siswa belum mengerjakan kuis ini.</p> : null}
                                    </div>
                                  </details>
                                </div>
                              </details>
                            </td>
                            <td className="p-3">
                              <form action={resetStudentMissionAction} className="flex gap-2">
                                <input type="hidden" name="studentId" value={student.id} />
                                <input type="hidden" name="missionId" value={mission.id} />
                                <button className="h-10 rounded-lg border-2 border-coral bg-white px-3 font-black text-coral">Reset</button>
                              </form>
                            </td>
                          </tr>
                        );
                      })}
                      {!students.length ? <tr><td className="p-3 font-semibold text-slate-500" colSpan={6}>Belum ada siswa.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </details>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

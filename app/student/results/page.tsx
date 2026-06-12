import { BadgeCheck, Lightbulb } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Metric, ProgressBar } from "@/components/ui";
import { studentNav } from "@/lib/app-data";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export default async function StudentResultsPage() {
  const user = await requireUser(UserRole.STUDENT);
  const challengeAnswers = await prisma.studentChallengeAnswer.findMany({
    where: { studentId: user.id },
    include: { challenge: { include: { level: true } } }
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

  return (
    <AppShell role="Siswa" title="Hasil Belajar" nav={studentNav} userName={user.name}>
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
    </AppShell>
  );
}

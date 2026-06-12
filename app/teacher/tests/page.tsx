import { Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { Notice } from "@/components/notice";
import { QuestionBuilder } from "@/components/question-builder";
import { formatPillar, formatPillarShort, teacherNav } from "@/lib/app-data";
import { deleteTestQuestionAction, duplicateTestQuestionAction, updateTestQuestionAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CTPillar, UserRole } from "@prisma/client";

export default async function TeacherTestsPage({ searchParams }: { searchParams?: { success?: string; error?: string } }) {
  const user = await requireUser(UserRole.TEACHER);
  const missions = await prisma.mission.findMany({
    where: { createdById: user.id },
    include: { tests: { include: { questions: { include: { options: { orderBy: { order: "asc" } } } } } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell role="Guru" title="Kelola Soal Tes" nav={teacherNav} userName={user.name}>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card>
          <Notice success={searchParams?.success} error={searchParams?.error} />
          <h2 className="text-2xl font-black text-ink">Tambah Soal</h2>
          <QuestionBuilder missions={missions.map((mission) => ({ id: mission.id, title: mission.title }))} pillars={Object.values(CTPillar)} />
        </Card>
        <Card>
          <h2 className="text-2xl font-black text-ink">Bank Soal</h2>
          <div className="mt-4 grid gap-3">
            {missions.flatMap((mission) => mission.tests.flatMap((test) => test.questions.map((question) => (
              <div key={question.id} className="rounded-lg border-2 border-slate-100 p-3">
                <p className="text-sm font-black text-sky">{mission.title} - Bank Soal</p>
                <h3 className="mt-1 font-black text-ink">{question.prompt}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-600">Pilar: {formatPillar(question.pillar)} | Tipe: {question.type} | Kunci/Rubrik: {String(question.correctAnswer)}</p>
                <details className="mt-3 rounded-lg border-2 border-slate-100 p-3">
                  <summary className="cursor-pointer font-black text-ink">Edit soal</summary>
                  <form action={updateTestQuestionAction} className="mt-3">
                    <input type="hidden" name="questionId" value={question.id} />
                    <label className="block text-sm font-black text-ink">Pilar CT</label>
                    <select name="pillar" defaultValue={question.pillar} className="mt-2 h-11 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold">
                      {Object.values(CTPillar).map((pillar) => <option key={pillar} value={pillar}>{formatPillar(pillar)} - {formatPillarShort(pillar)}</option>)}
                    </select>
                    <label className="mt-3 block text-sm font-black text-ink">Tipe soal</label>
                    <select name="questionType" defaultValue={question.type} className="mt-2 h-11 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold">
                      <option value="MULTIPLE_CHOICE">Pilihan ganda</option>
                      <option value="TRUE_FALSE">True/False</option>
                      <option value="SHORT_ANSWER">Essay singkat</option>
                    </select>
                    <textarea name="prompt" defaultValue={question.prompt} className="mt-3 min-h-24 w-full rounded-lg border-2 border-slate-200 p-3 font-semibold" />
                    {[1, 2, 3, 4].map((n) => (
                      <input
                        key={n}
                        name={`option${n}`}
                        defaultValue={question.options[n - 1]?.text || ""}
                        className="mt-3 h-11 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold"
                        placeholder={`Opsi ${n}, kosongkan untuk essay`}
                      />
                    ))}
                    <input name="answer" defaultValue={String(question.correctAnswer)} className="mt-3 h-11 w-full rounded-lg border-2 border-leaf px-3 font-semibold" placeholder="Kunci jawaban" />
                    <button className="mt-3 h-11 rounded-lg border-2 border-leafDark bg-leaf px-4 font-black text-white shadow-lift">Simpan Edit</button>
                  </form>
                </details>
                <form action={deleteTestQuestionAction} className="mt-3">
                  <input type="hidden" name="questionId" value={question.id} />
                  <button className="h-10 rounded-lg border-2 border-coral bg-white px-4 font-black text-coral">Hapus Soal</button>
                </form>
                <form action={duplicateTestQuestionAction} className="mt-3">
                  <input type="hidden" name="questionId" value={question.id} />
                  <button className="h-10 rounded-lg border-2 border-sky bg-white px-4 font-black text-sky">Duplikasi Soal</button>
                </form>
              </div>
            ))))}
            {!missions.some((mission) => mission.tests.some((test) => test.questions.length)) ? <p className="font-semibold text-slate-500">Belum ada soal.</p> : null}
          </div>
          <button className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-5 font-black text-ink shadow-lift">
            <Save size={19} aria-hidden="true" />
            Tersimpan Otomatis
          </button>
        </Card>
      </div>
    </AppShell>
  );
}

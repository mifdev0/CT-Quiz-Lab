"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { CTPillar } from "@prisma/client";
import { createTestQuestionAction } from "@/app/actions";
import { formatPillar, formatPillarShort } from "@/lib/app-data";

type MissionOption = {
  id: string;
  title: string;
};

export function QuestionBuilder({
  missions,
  pillars
}: {
  missions: MissionOption[];
  pillars: CTPillar[];
}) {
  const [type, setType] = useState("MULTIPLE_CHOICE");
  const isMultipleChoice = type === "MULTIPLE_CHOICE";
  const isTrueFalse = type === "TRUE_FALSE";
  const isEssay = type === "SHORT_ANSWER";

  return (
    <form action={createTestQuestionAction}>
      <label className="mt-5 block text-sm font-black text-ink" htmlFor="missionId">Kuis</label>
      <select id="missionId" name="missionId" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold">
        {missions.map((mission) => <option key={mission.id} value={mission.id}>{mission.title}</option>)}
      </select>

      <label className="mt-4 block text-sm font-black text-ink" htmlFor="testType">Bagian soal</label>
      <select id="testType" name="testType" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold">
        <option value="PRE_TEST">Bank Soal A</option>
        <option value="POST_TEST">Bank Soal B</option>
      </select>

      <label className="mt-4 block text-sm font-black text-ink" htmlFor="pillar">Pilar CT</label>
      <select id="pillar" name="pillar" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold">
        {pillars.map((pillar) => <option key={pillar} value={pillar}>{formatPillar(pillar)} - {formatPillarShort(pillar)}</option>)}
      </select>

      <label className="mt-4 block text-sm font-black text-ink" htmlFor="questionType">Tipe soal</label>
      <select
        id="questionType"
        name="questionType"
        value={type}
        onChange={(event) => setType(event.target.value)}
        className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold"
      >
        <option value="MULTIPLE_CHOICE">Pilihan ganda</option>
        <option value="TRUE_FALSE">True/False</option>
        <option value="SHORT_ANSWER">Essay singkat</option>
      </select>

      <label className="mt-4 block text-sm font-black text-ink" htmlFor="prompt">Pertanyaan</label>
      <textarea id="prompt" name="prompt" className="mt-2 min-h-24 w-full rounded-lg border-2 border-slate-200 p-3 font-semibold" />

      {isMultipleChoice ? (
        <div className="mt-3">
          <p className="rounded-lg bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">
            Isi beberapa opsi, lalu tulis kunci jawaban sama persis dengan salah satu opsi.
          </p>
          {[1, 2, 3, 4].map((n) => (
            <input key={n} name={`option${n}`} className="mt-3 h-11 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold" placeholder={`Opsi ${n}`} />
          ))}
          <select name="answerChoice" className="mt-3 h-11 w-full rounded-lg border-2 border-leaf px-3 font-semibold">
            <option value="option1">Kunci: Opsi 1</option>
            <option value="option2">Kunci: Opsi 2</option>
            <option value="option3">Kunci: Opsi 3</option>
            <option value="option4">Kunci: Opsi 4</option>
          </select>
        </div>
      ) : null}

      {isTrueFalse ? (
        <div className="mt-3">
          <p className="rounded-lg bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">
            Siswa akan melihat pilihan Benar dan Salah.
          </p>
          <select name="answer" className="mt-3 h-11 w-full rounded-lg border-2 border-leaf px-3 font-semibold">
            <option value="Benar">Benar</option>
            <option value="Salah">Salah</option>
          </select>
        </div>
      ) : null}

      {isEssay ? (
        <div className="mt-3">
          <p className="rounded-lg bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">
            Siswa akan mendapat kolom jawaban teks. Jika GROQ_API_KEY aktif, essay direview AI berdasarkan rubrik ini dan toleran terhadap variasi bahasa.
          </p>
          <textarea name="answer" className="mt-3 min-h-24 w-full rounded-lg border-2 border-leaf p-3 font-semibold" placeholder="Kunci jawaban essay singkat" />
        </div>
      ) : null}

      <button className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-leafDark bg-leaf font-black text-white shadow-lift">
        <Plus size={19} aria-hidden="true" />
        Tambah Soal
      </button>
    </form>
  );
}

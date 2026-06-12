"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createChallengeAction } from "@/app/actions";

type LevelOption = {
  id: string;
  title: string;
};

export function ChallengeBuilder({ levels }: { levels: LevelOption[] }) {
  const [type, setType] = useState("MULTIPLE_CHOICE");

  return (
    <form action={createChallengeAction}>
      <label className="mt-5 block text-sm font-black text-ink" htmlFor="levelId">Bagian CT</label>
      <select id="levelId" name="levelId" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold">
        {levels.map((level) => <option key={level.id} value={level.id}>{level.title}</option>)}
      </select>

      <label className="mt-4 block text-sm font-black text-ink" htmlFor="prompt">Instruksi</label>
      <textarea id="prompt" name="prompt" className="mt-2 min-h-28 w-full rounded-lg border-2 border-slate-200 p-3 font-semibold" />

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

      {type === "MULTIPLE_CHOICE" ? (
        <>
          {[1, 2, 3, 4].map((n) => <input key={n} name={`option${n}`} className="mt-3 h-11 w-full rounded-lg border-2 border-slate-200 px-3 font-semibold" placeholder={`Opsi ${n}`} />)}
          <select name="answerChoice" className="mt-3 h-11 w-full rounded-lg border-2 border-leaf px-3 font-semibold">
            <option value="option1">Kunci: Opsi 1</option>
            <option value="option2">Kunci: Opsi 2</option>
            <option value="option3">Kunci: Opsi 3</option>
            <option value="option4">Kunci: Opsi 4</option>
          </select>
        </>
      ) : null}

      {type === "TRUE_FALSE" ? (
        <select name="answer" className="mt-3 h-11 w-full rounded-lg border-2 border-leaf px-3 font-semibold">
          <option value="Benar">Benar</option>
          <option value="Salah">Salah</option>
        </select>
      ) : null}

      {type === "SHORT_ANSWER" ? (
        <textarea name="answer" className="mt-3 min-h-24 w-full rounded-lg border-2 border-leaf p-3 font-semibold" placeholder="Kunci jawaban essay singkat" />
      ) : null}

      <textarea name="feedbackCorrect" className="mt-3 min-h-20 w-full rounded-lg border-2 border-slate-200 p-3 font-semibold" placeholder="Feedback jika benar" />
      <textarea name="feedbackWrong" className="mt-3 min-h-20 w-full rounded-lg border-2 border-slate-200 p-3 font-semibold" placeholder="Feedback jika salah" />

      <button className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-leafDark bg-leaf font-black text-white shadow-lift">
        <Plus size={19} aria-hidden="true" />
        Tambah Soal
      </button>
    </form>
  );
}

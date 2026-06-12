"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";

type Question = {
  pillar: string;
  prompt: string;
  options: string[];
  answer: string;
};

export function TestPlayer({ title, questions }: { title: string; questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const score = useMemo(() => {
    const correct = questions.filter((question, index) => answers[index] === question.answer).length;
    return Math.round((correct / questions.length) * 100);
  }, [answers, questions]);
  const complete = Object.keys(answers).length === questions.length;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.prompt}>
            <p className="mb-2 text-sm font-black text-sky">{question.pillar}</p>
            <h2 className="text-xl font-black text-ink">{index + 1}. {question.prompt}</h2>
            <div className="mt-4 grid gap-2">
              {question.options.map((option) => {
                const selected = answers[index] === option;
                return (
                  <button
                    key={option}
                    onClick={() => setAnswers((current) => ({ ...current, [index]: option }))}
                    className={`min-h-12 rounded-lg border-2 px-4 text-left font-bold ${
                      selected ? "border-leafDark bg-leaf text-white shadow-lift" : "border-slate-200 bg-white text-ink"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
      <Card className="h-fit lg:sticky lg:top-5">
        <p className="text-sm font-black uppercase tracking-normal text-slate-500">{title}</p>
        <h2 className="mt-1 text-3xl font-black text-ink">{complete ? `${score}%` : "Belum selesai"}</h2>
        <div className="mt-4">
          <ProgressBar value={(Object.keys(answers).length / questions.length) * 100} color="bg-sky" />
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          {complete
            ? "Hasil ini menjadi pembanding untuk melihat peningkatan kemampuan CT siswa."
            : "Jawab semua pertanyaan untuk menyimpan gambaran kemampuan awal atau akhir."}
        </p>
        <button
          onClick={() => setAnswers({})}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-200 bg-white font-black text-ink shadow-lift"
        >
          {complete ? <Check size={18} aria-hidden="true" /> : <RotateCcw size={18} aria-hidden="true" />}
          {complete ? "Tersimpan" : "Reset"}
        </button>
      </Card>
    </div>
  );
}

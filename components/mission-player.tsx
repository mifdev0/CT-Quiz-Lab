"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, CircleHelp } from "lucide-react";
import { mission } from "@/lib/app-data";
import { Card, ProgressBar } from "@/components/ui";

export function MissionPlayer() {
  const [level, setLevel] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const current = mission.levels[level];
  const isCorrect =
    selected.length === current.correct.length && current.correct.every((answer) => selected.includes(answer));
  const done = level === mission.levels.length - 1 && checked && isCorrect;

  function toggle(option: string) {
    setChecked(false);
    setSelected((items) => (items.includes(option) ? items.filter((item) => item !== option) : [...items, option]));
  }

  function next() {
    if (level < mission.levels.length - 1) {
      setLevel((value) => value + 1);
      setSelected([]);
      setChecked(false);
    }
  }

  const Icon = current.icon;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card>
        <div className="flex items-start gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-leaf text-white shadow-lift">
            <Icon size={28} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-normal text-leafDark">Level {level + 1}</p>
            <h2 className="text-3xl font-black leading-tight text-ink">{current.title}</h2>
          </div>
        </div>
        <p className="mt-5 rounded-lg border-2 border-slate-100 bg-slate-50 p-4 text-base font-semibold leading-7 text-slate-700">
          {current.prompt}
        </p>
        <div className="mt-5 grid gap-3">
          {current.options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                onClick={() => toggle(option)}
                className={`min-h-12 rounded-lg border-2 px-4 text-left font-bold ${
                  active ? "border-sky bg-sky text-white shadow-lift" : "border-slate-200 bg-white text-ink"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setChecked(true)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-leafDark bg-leaf px-5 font-black text-white shadow-lift"
          >
            <CheckCircle2 size={19} aria-hidden="true" />
            Cek Jawaban
          </button>
          <button
            onClick={next}
            disabled={!isCorrect || !checked || done}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-5 font-black text-ink shadow-lift disabled:bg-slate-100 disabled:text-slate-400"
          >
            Lanjut
            <ArrowRight size={19} aria-hidden="true" />
          </button>
        </div>
      </Card>
      <div className="space-y-4">
        <Card>
            <p className="text-sm font-black uppercase tracking-normal text-slate-500">Progress Kuis</p>
          <h2 className="mt-1 text-3xl font-black text-ink">{Math.round(((level + (isCorrect && checked ? 1 : 0)) / mission.levels.length) * 100)}%</h2>
          <div className="mt-4">
            <ProgressBar value={((level + (isCorrect && checked ? 1 : 0)) / mission.levels.length) * 100} />
          </div>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black text-ink">
            <CircleHelp size={22} className="text-sky" aria-hidden="true" />
            Feedback
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            {!checked
              ? "Pilih jawaban berdasarkan alasan, bukan tebakan. Fokus pada bukti yang berhubungan dengan masalah."
              : isCorrect
                ? current.feedback
                : "Jawabanmu belum tepat. Periksa lagi apakah pilihanmu benar-benar relevan dengan pilar CT di bagian ini."}
          </p>
        </Card>
      </div>
    </div>
  );
}

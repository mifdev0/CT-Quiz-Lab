"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { BrainCircuit, CheckCircle2, FileQuestion, Flag, LoaderCircle, Sparkles } from "lucide-react";
import { generateInstantMissionAction } from "@/app/actions";

const stages = [
  { label: "Membaca materi", icon: BrainCircuit },
  { label: "Menyusun paket kuis", icon: Flag },
  { label: "Membuat soal kuis", icon: FileQuestion },
  { label: "Membuat variasi tipe soal", icon: FileQuestion },
  { label: "Menyiapkan analisis", icon: Sparkles },
  { label: "Menyimpan ke database", icon: CheckCircle2 }
];

function ProgressStages({ active, submitted }: { active: boolean; submitted: boolean }) {
  const { pending } = useFormStatus();
  const isActive = active || pending;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }
    const timer = window.setInterval(() => {
      setProgress((value) => {
        if (submitted || pending) return Math.min(value + 3, 99);
        return Math.min(value + 9, 100);
      });
    }, 420);
    return () => window.clearInterval(timer);
  }, [isActive, pending, submitted]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-lg border-2 border-white/80 bg-gradient-to-br from-sky/15 via-white to-leaf/15 p-5 shadow-lift ring-1 ring-sky/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="gentle-pulse grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-sky to-leaf text-white shadow-lift">
            <LoaderCircle className="animate-spin" size={23} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-normal text-sky">AI Builder</p>
            <h3 className="text-lg font-black text-ink">{submitted || pending ? "Menyimpan hasil AI ke database" : "AI sedang membuat paket kuis"}</h3>
          </div>
        </div>
        <span className="rounded-lg bg-white/90 px-3 py-2 text-sm font-black text-ink shadow-sm">{progress}%</span>
      </div>
      <div className="h-5 overflow-hidden rounded-full border-2 border-white bg-white shadow-inner">
        <div
          className="progress-shine relative h-full overflow-hidden rounded-full bg-gradient-to-r from-leaf via-sky to-honey transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {stages.map((stage, index) => {
          const stageProgress = ((index + 1) / stages.length) * 100;
          const active = progress >= stageProgress - 10;
          const Icon = stage.icon;
          return (
            <div key={stage.label} className={`flex items-center gap-2 rounded-lg border-2 p-2 text-sm font-bold ${active ? "border-leaf/40 bg-white text-ink" : "border-slate-100 bg-white/60 text-slate-500"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? "bg-leaf text-white" : "bg-slate-200 text-slate-500"}`}>
                <Icon size={16} aria-hidden="true" />
              </span>
              {stage.label}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {submitted || pending
          ? "Konten sudah dikirim ke server. Mohon tunggu sebentar sampai halaman berpindah otomatis."
          : "Mohon tunggu. Sistem sedang membuat paket quiz, variasi soal, kunci jawaban, dan dasar analisis secara otomatis."}
      </p>
      </div>
    </div>
  );
}

function SubmitButton({ preparing }: { preparing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending || preparing}
      className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-leafDark bg-gradient-to-b from-leaf to-leafDark px-5 font-black text-white shadow-lift disabled:border-slate-300 disabled:bg-slate-300"
    >
      <Sparkles size={19} aria-hidden="true" />
      {pending || preparing ? "AI sedang membuat..." : "Buat Instan dengan AI"}
    </button>
  );
}

function SubmitWatcher({ submitted, onDone }: { submitted: boolean; onDone: () => void }) {
  const { pending } = useFormStatus();
  useEffect(() => {
    if (submitted && !pending) {
      onDone();
    }
  }, [submitted, pending, onDone]);
  return null;
}

export function InstantMissionBuilder({ materials }: { materials: { id: string; title: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const allowSubmitRef = useRef(false);
  const [showProgress, setShowProgress] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      ref={formRef}
      action={generateInstantMissionAction}
      onSubmit={(event) => {
        if (allowSubmitRef.current) return;
        event.preventDefault();
        setShowProgress(true);
        window.setTimeout(() => {
          allowSubmitRef.current = true;
          setSubmitted(true);
          setShowProgress(true);
          formRef.current?.requestSubmit();
        }, 5000);
      }}
    >
      <label className="mt-5 block text-sm font-black text-ink" htmlFor="ai-materialId">Pilih materi</label>
      <select
        id="ai-materialId"
        name="materialId"
        className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-white/90 px-3 font-semibold outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/15"
      >
        <option value="">Pilih materi dulu</option>
        {materials.map((material) => (
          <option key={material.id} value={material.id}>{material.title}</option>
        ))}
      </select>
      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">
        Pilih materi pada form kuis, lalu klik tombol ini. AI akan membaca isi materi tersebut dan membuat 15 soal variatif dari materi yang benar-benar tersedia.
      </p>
      <SubmitButton preparing={showProgress && !submitted} />
      <SubmitWatcher
        submitted={submitted}
        onDone={() => {
          setShowProgress(false);
          setSubmitted(false);
          allowSubmitRef.current = false;
        }}
      />
      <ProgressStages active={showProgress} submitted={submitted} />
    </form>
  );
}

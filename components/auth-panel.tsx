"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, UserPlus } from "lucide-react";
import { loginAction, registerAction } from "@/app/actions";

function SubmitButton({
  idle,
  pending,
  icon
}: {
  idle: string;
  pending: string;
  icon: React.ReactNode;
}) {
  const status = useFormStatus();
  return (
    <button
      disabled={status.pending}
      className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-leafDark bg-gradient-to-b from-leaf to-leafDark font-black text-white shadow-lift disabled:border-slate-300 disabled:bg-slate-300"
    >
      {status.pending ? pending : idle}
      {status.pending ? null : icon}
    </button>
  );
}

export function AuthPanel({ error }: { error?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="surface-card rounded-lg border-2 border-white/80 p-4 shadow-lift ring-1 ring-slate-200/80">
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100/90 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`h-11 rounded-lg font-black transition ${mode === "login" ? "bg-white text-ink shadow-lift" : "text-slate-500 hover:text-ink"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`h-11 rounded-lg font-black transition ${mode === "register" ? "bg-white text-ink shadow-lift" : "text-slate-500 hover:text-ink"}`}
        >
          Register
        </button>
      </div>

      {error ? <p className="mt-4 rounded-lg border-2 border-coral bg-coral/10 p-3 font-bold text-coral">{error}</p> : null}

      {mode === "login" ? (
        <form action={loginAction}>
          <h2 className="mt-5 text-2xl font-black text-ink">Masuk Akun</h2>
          <label className="mt-5 block text-sm font-black text-ink" htmlFor="login-email">Email</label>
          <input id="login-email" name="email" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-white/90 px-3 font-semibold outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/15" placeholder="nama@sekolah.id" />
          <label className="mt-4 block text-sm font-black text-ink" htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-white/90 px-3 font-semibold outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/15" placeholder="password" />
          <SubmitButton idle="Masuk" pending="Memproses login..." icon={<ArrowRight size={19} aria-hidden="true" />} />
        </form>
      ) : (
        <form action={registerAction}>
          <h2 className="mt-5 text-2xl font-black text-ink">Buat Akun</h2>
          <label className="mt-5 block text-sm font-black text-ink" htmlFor="register-name">Nama lengkap</label>
          <input id="register-name" name="name" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-white/90 px-3 font-semibold outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/15" placeholder="Nama lengkap" />
          <label className="mt-4 block text-sm font-black text-ink" htmlFor="register-email">Email</label>
          <input id="register-email" name="email" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-white/90 px-3 font-semibold outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/15" placeholder="nama@sekolah.id" />
          <label className="mt-4 block text-sm font-black text-ink" htmlFor="register-password">Password</label>
          <input id="register-password" name="password" type="password" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-white/90 px-3 font-semibold outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/15" placeholder="Minimal 6 karakter" />
          <label className="mt-4 block text-sm font-black text-ink" htmlFor="register-role">Role</label>
          <select id="register-role" name="role" className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-white/90 px-3 font-semibold outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/15">
            <option value="STUDENT">Siswa</option>
            <option value="TEACHER">Guru</option>
          </select>
          <SubmitButton idle="Buat Akun" pending="Membuat akun..." icon={<UserPlus size={19} aria-hidden="true" />} />
        </form>
      )}
    </div>
  );
}

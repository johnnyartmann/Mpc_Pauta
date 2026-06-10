"use client";

import { useActionState } from "react";
import Image from "next/image";
import { login } from "@/actions/auth";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, initialState);

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0c1e33 0%, #132742 30%, #1a3358 60%, #0e1b2e 100%)",
      }}
    >
      {/* ── Decorative Background Elements ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, rgba(45,108,180,0.15) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, rgba(212,160,23,0.1) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-[420px] mx-4 relative z-10 animate-fade-in-up">
        {/* ── Login Card with Glass Effect ── */}
        <div
          className="rounded-2xl p-8 border border-white/10"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3), 0 10px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          {/* ── Logo & Title ── */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div
                className="rounded-xl p-1 shadow-lg"
                style={{ background: "linear-gradient(135deg, #1e3a5f, #2d6cb4)" }}
              >
                <Image src="/logo_mpc.jpg" alt="MPC/SC" width={72} height={72} className="rounded-lg" priority />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#1e3a5f" }}>
              MPC/SC
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Ministério Público de Contas</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-slate-300" />
              <p className="text-xs text-slate-400">Gestão de Pauta e Decisões — TCE/SC</p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-slate-300" />
            </div>
          </div>

          {/* ── Form ── */}
          <form action={action} className="space-y-5">
            {state?.error && (
              <div className="toast toast-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {state.error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input id="email" name="email" type="email" autoComplete="email" required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
                  placeholder="seu@email.com" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input id="password" name="password" type="password" autoComplete="current-password" required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
                  placeholder="Sua senha" />
              </div>
            </div>

            <button type="submit" disabled={isPending}
              className="btn btn-primary btn-block py-2.5 text-sm"
              style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d6cb4 100%)" }}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Entrando...
                </span>
              ) : "Entrar"}
            </button>
          </form>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-[11px] text-slate-400/60 mt-6 font-medium">
          © {new Date().getFullYear()} MPC/SC — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}

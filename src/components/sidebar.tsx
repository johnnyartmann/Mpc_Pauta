"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";

interface SidebarProps {
  role: string;
  userName: string;
}

/* ── SVG Icon components ── */
function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function IconNewspaper() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: direction === "left" ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s ease" }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

const iconMap: Record<string, React.FC> = {
  dashboard: IconDashboard,
  upload: IconUpload,
  list: IconList,
  newspaper: IconNewspaper,
  search: IconSearch,
  users: IconUsers,
};

export function Sidebar({ role, userName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const links = role === "registrador"
    ? [
        { href: "/registrador", label: "Dashboard", icon: "dashboard" },
        { href: "/registrador/importar", label: "Importar", icon: "upload" },
        { href: "/registrador/pautas", label: "Pauta", icon: "list" },
        { href: "/registrador/diario", label: "Parecer/Decisão", icon: "newspaper" },
        { href: "/registrador/busca", label: "Buscador", icon: "search" },
      ]
    : role === "procurador"
    ? [
        { href: "/procurador", label: "Dashboard", icon: "dashboard" },
        { href: "/procurador/pautas", label: "Pauta", icon: "list" },
        { href: "/procurador/diario", label: "Parecer/Decisão", icon: "newspaper" },
        { href: "/procurador/busca", label: "Buscador", icon: "search" },
      ]
    : [
        { href: "/registrador/admin/usuarios", label: "Usuários", icon: "users" },
      ];

  const isActive = (href: string) => {
    if (href.endsWith("/importar")) return pathname.startsWith(href);
    if (href.endsWith("/pautas")) return pathname.startsWith(href);
    if (href.endsWith("/busca")) return pathname.startsWith(href);
    if (href.includes("/diario")) return pathname.startsWith(href);
    if (href.includes("/admin")) return pathname.startsWith(href);
    return pathname === href;
  };

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className={`flex flex-col transition-all duration-300 ease-in-out shrink-0 ${collapsed ? "w-[68px]" : "w-[248px]"}`}
      style={{
        background: "linear-gradient(180deg, #0e1b2e 0%, #132742 50%, #0e1b2e 100%)",
      }}
    >
      {/* ── Logo / Header ── */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3 py-4 border-b border-white/8`}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative shrink-0">
              <Image src="/logo_mpc.jpg" alt="MPC/SC" width={36} height={36} className="rounded-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0e1b2e]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white tracking-wide">MPC/SC</h2>
              <p className="text-[10px] text-slate-400 font-medium truncate">Gestão de Pauta e Decisões</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Image src="/logo_mpc.jpg" alt="MPC/SC" width={28} height={28} className="rounded-lg" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all duration-200 ${collapsed ? "mt-0" : "ml-auto"}`}
          title={collapsed ? "Expandir" : "Recolher"}
        >
          <IconChevron direction={collapsed ? "right" : "left"} />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Menu</p>
        )}
        {links.map((link) => {
          const Icon = iconMap[link.icon] || IconDashboard;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 relative ${
                active
                  ? "bg-white/12 text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/6 hover:text-slate-200"
              }`}
              title={collapsed ? link.label : undefined}
            >
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: "linear-gradient(180deg, #f5d060, #d4a017)" }}
                />
              )}
              <span className={`shrink-0 w-5 flex justify-center transition-colors duration-200 ${active ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                <Icon />
              </span>
              {!collapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── User Info ── */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 capitalize">{role}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout ── */}
      <form action={logout} className="px-2 pb-3 pt-1">
        <button
          type="submit"
          className={`flex items-center gap-3 w-full px-3 py-2 text-[13px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 ${collapsed ? "justify-center" : ""}`}
          title="Sair"
        >
          <span className="shrink-0 w-5 flex justify-center">
            <IconLogout />
          </span>
          {!collapsed && <span>Sair</span>}
        </button>
      </form>
    </aside>
  );
}

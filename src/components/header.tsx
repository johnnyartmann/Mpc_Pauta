import { auth } from "@/lib/auth";

export async function Header() {
  const session = await auth();
  const userName = session?.user?.name || "";
  const role = (session?.user as any)?.role || "";

  const roleLabel = role === "registrador" ? "Área do Registrador" : role === "procurador" ? "Área do Procurador" : "Administração";

  const badgeConfig: Record<string, { bg: string; text: string; icon: string }> = {
    registrador: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: "📋" },
    procurador: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: "⚖️" },
    administrador: { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", icon: "🛡️" },
  };

  const badge = badgeConfig[role] || badgeConfig.administrador;
  const badgeLabel = role === "registrador" ? "Registrador" : role === "procurador" ? "Procurador" : "Administrador";

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-3 flex items-center justify-between shrink-0"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div>
        <h1 className="text-base font-bold text-slate-800 tracking-tight">{roleLabel}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${badge.bg} ${badge.text}`}>
          <span className="text-[10px]">{badge.icon}</span>
          {badgeLabel}
        </span>
        <div className="w-px h-5 bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
            {initials}
          </div>
          <span className="text-sm font-medium text-slate-600">{userName}</span>
        </div>
      </div>
    </header>
  );
}

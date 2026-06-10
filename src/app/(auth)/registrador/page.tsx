import { auth } from "@/lib/auth";
import { getPautas } from "@/actions/processo";
import Link from "next/link";

export default async function RegistradorDashboard() {
  const session = await auth();
  const userName = session?.user?.name || "Usuario";

  let pautas: any[] = [];
  let totalProcessos = 0;
  let processosConcluidos = 0;

  try {
    const result = await getPautas();
    pautas = result || [];
    totalProcessos = pautas.reduce((sum: number, p: any) => sum + (p._count?.processos || p.processos?.length || 0), 0);
    processosConcluidos = pautas.reduce((sum: number, p: any) => {
      return sum + (p.processos || []).filter((pp: any) => {
        const doc = pp.documentos?.[0];
        return doc?.parecerMpc && doc?.propostaVoto;
      }).length;
    }, 0);
  } catch {
    // Handle errors gracefully - show zero stats
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="page-title">
          <span className="inline-block mr-2">👋</span>
          Bem-vindo, {userName}
        </h1>
        <p className="page-subtitle">Painel de controle do registrador</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Total de Pautas</p>
              <p className="text-3xl font-bold text-gray-800">{pautas.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Processos Cadastrados</p>
              <p className="text-3xl font-bold text-gray-800">{totalProcessos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-amber">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Concluídos</p>
              <p className="text-3xl font-bold text-gray-800">{processosConcluidos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link href="/registrador/importar" className="btn btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Nova Importação
        </Link>
        <Link href="/registrador/pautas" className="btn btn-secondary">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Ver Pautas
        </Link>
      </div>

      {/* Recent Pautas Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pautas Recentes
        </h2>
        {pautas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="empty-state-text">
              Nenhuma pauta importada. Clique em &quot;Nova Importação&quot; para começar.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Pauta</th>
                  <th>Importado em</th>
                  <th>Processos</th>
                </tr>
              </thead>
              <tbody>
                {pautas.slice(0, 10).map((pauta: any) => (
                  <tr key={pauta.id}>
                    <td className="px-4 py-3 font-medium text-primary">{pauta.nome}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(pauta.dataImportacao ?? pauta.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="badge badge-info">
                        {pauta._count?.processos || pauta.processos?.length || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

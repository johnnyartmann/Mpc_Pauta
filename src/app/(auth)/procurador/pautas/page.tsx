"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getProcessos, getPautas, getProcuradores } from "@/actions/processo";

export default function ProcuradorPautasList() {
  const [result, setResult] = useState<{ processos: any[]; total: number; page: number; totalPages: number } | null>(null);
  const [pautas, setPautas] = useState<any[]>([]);
  const [procuradores, setProcuradores] = useState<any[]>([]);
  const [filters, setFilters] = useState({ pautaId: "", relator: "", unidadeGestora: "", search: "", procuradorId: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProcessos({ ...filters, page, pageSize: 20 });
      setResult(data);
    } catch {
      setResult(null);
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    getPautas().then(setPautas).catch(() => {});
    getProcuradores().then(setProcuradores).catch(() => {});
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const processos = result?.processos || [];
  const total = result?.total || 0;
  const totalPages = result?.totalPages || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2.5">
          <svg className="w-7 h-7 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Pautas
        </h1>
        <p className="page-subtitle">Consulte as pautas e documentos</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Pauta</label>
            <select
              value={filters.pautaId}
              onChange={(e) => handleFilterChange("pautaId", e.target.value)}
              className="w-full"
            >
              <option value="">Todas</option>
              {pautas.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Relator</label>
            <input
              type="text"
              value={filters.relator}
              onChange={(e) => handleFilterChange("relator", e.target.value)}
              className="w-full"
              placeholder="Filtrar relator..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Unidade Gestora</label>
            <input
              type="text"
              value={filters.unidadeGestora}
              onChange={(e) => handleFilterChange("unidadeGestora", e.target.value)}
              className="w-full"
              placeholder="Filtrar UG..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Procurador</label>
            <select
              value={filters.procuradorId}
              onChange={(e) => handleFilterChange("procuradorId", e.target.value)}
              className="w-full"
            >
              <option value="">Todos</option>
              {procuradores.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Buscar</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full"
              placeholder="Numero, assunto..."
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="table-container p-6">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-10" />
                <div className="skeleton h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
      ) : processos.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0h.008v.008H12.75v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM9.75 12h4.5m-4.5 0V7.5m0 0h4.5" />
          </svg>
          <p className="empty-state-text">
            {total === 0 ? "Nenhuma pauta cadastrada." : "Nenhuma pauta encontrada com os filtros atuais."}
          </p>
        </div>
      ) : (
        <>
          <div className="table-container overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr>
                  <th>Pauta</th>
                  <th>Processo</th>
                  <th>Procurador</th>
                  <th>Relator</th>
                  <th>Unidade Gestora</th>
                  <th>Status</th>
                  <th>Voto Div.</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {processos.map((proc) => {
                  const pp = proc.pautas?.[0];
                  const procurador = pp?.procurador;

                  return (
                    <tr key={proc.id}>
                      <td className="text-slate-600 font-medium">{pp?.pauta?.nome || "-"}</td>
                      <td>
                        <Link href={`/procurador/pautas/${proc.id}`} className="text-primary hover:text-primary-light font-semibold transition-colors">
                          {proc.numeroProcesso}
                        </Link>
                      </td>
                      <td className="text-slate-500">
                        {procurador ? (
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {procurador.name}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="text-slate-500">{proc.relator || "-"}</td>
                      <td className="text-slate-500">{proc.unidadeGestora || "-"}</td>
                      <td>
                        {proc.pautas?.some((pp2: any) => {
                          const doc = pp2.documentos?.[0];
                          return doc?.parecerMpc && doc?.propostaVoto;
                        }) ? (
                          <span className="badge badge-success">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                            Concluído
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                            Pendente
                          </span>
                        )}
                      </td>
                      <td>
                        {pp?.votoDivergente ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-50 text-green-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        ) : (
                          <span className="text-slate-300 text-lg leading-none">—</span>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/procurador/pautas/${proc.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary-light text-sm font-semibold transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Mostrando <span className="font-semibold text-slate-700">{(page - 1) * 20 + 1}-{Math.min(page * 20, total)}</span> de <span className="font-semibold text-slate-700">{total}</span>
            </span>
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="pagination-btn"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-300">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`pagination-btn ${p === page ? "pagination-btn-active" : ""}`}
                  >
                    {p}
                  </button>
                </span>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="pagination-btn"
              >
                Próximo
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

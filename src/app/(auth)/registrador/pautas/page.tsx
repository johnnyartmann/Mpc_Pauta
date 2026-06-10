"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getProcessos, getPautas, assignProcurador, toggleVotoDivergente, getProcuradores, deleteProcessoPauta } from "@/actions/processo";

interface ProcuradorOption {
  id: string;
  name: string;
  email: string;
}

export default function PautasListPage() {
  const [result, setResult] = useState<{ processos: any[]; total: number; page: number; totalPages: number } | null>(null);
  const [pautas, setPautas] = useState<any[]>([]);
  const [procuradores, setProcuradores] = useState<ProcuradorOption[]>([]);
  const [filters, setFilters] = useState({ pautaId: "", relator: "", unidadeGestora: "", search: "", procuradorId: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleAssignProcurador = async (processoPautaId: string, procuradorId: string | null) => {
    try {
      await assignProcurador(processoPautaId, procuradorId);
      setDropdownOpen(null);
      fetchData();
    } catch {}
  };

  const handleToggleVoto = async (processoPautaId: string) => {
    try {
      await toggleVotoDivergente(processoPautaId);
      fetchData();
    } catch {}
  };

  const handleDelete = async (processoPautaId: string) => {
    try {
      await deleteProcessoPauta(processoPautaId);
      setConfirmDelete(null);
      fetchData();
    } catch {}
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
        <p className="page-subtitle">Gerencie as pautas e atribua procuradores</p>
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
                <div className="skeleton h-4 w-20" />
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
                        <Link href={`/registrador/pautas/${proc.id}`} className="text-primary hover:text-primary-light font-semibold transition-colors">
                          {proc.numeroProcesso}
                        </Link>
                      </td>
                      <td>
                        <div className="relative" ref={dropdownOpen === pp?.id ? dropdownRef : undefined}>
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === pp?.id ? null : pp?.id)}
                            className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-all cursor-pointer ${
                              procurador
                                ? "text-slate-700 hover:bg-primary-50"
                                : "text-primary font-semibold hover:bg-primary-50"
                            }`}
                          >
                            {procurador ? (
                              <>
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {procurador.name}
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Atribuir
                              </>
                            )}
                          </button>
                          {dropdownOpen === pp?.id && (
                            <div className="dropdown-menu mt-1">
                              <button
                                onClick={() => handleAssignProcurador(pp.id, null)}
                                className="dropdown-item text-slate-400 italic"
                              >
                                Nenhum
                              </button>
                              {procuradores.map((p: ProcuradorOption) => (
                                <button
                                  key={p.id}
                                  onClick={() => handleAssignProcurador(pp.id, p.id)}
                                  className="dropdown-item"
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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
                        <input
                          type="checkbox"
                          checked={pp?.votoDivergente || false}
                          onChange={() => handleToggleVoto(pp.id)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary-light cursor-pointer"
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/registrador/pautas/${proc.id}`}
                            className="inline-flex items-center gap-1 text-primary hover:text-primary-light text-sm font-semibold transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </Link>
                          {confirmDelete === pp?.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(pp.id)}
                                className="btn btn-danger btn-xs">Sim</button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="btn btn-secondary btn-xs">Não</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(pp?.id || null)}
                              className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Excluir
                            </button>
                          )}
                        </div>
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

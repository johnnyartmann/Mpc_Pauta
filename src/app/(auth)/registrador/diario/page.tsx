"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import React from "react";
import Link from "next/link";
import { listarDiarios, getDatasDisponiveis, deleteDiario, assignProcuradorDiario, toggleDivergeDiario } from "@/actions/diario";
import { getProcuradores } from "@/actions/processo";

interface DiarioEntry {
  id: string;
  dataPublicacao: Date;
  numeroEdicao: string | null;
  numeroProcesso: string;
  unidadeGestora: string | null;
  responsavel: string | null;
  interessados: string | null;
  relator: string | null;
  unidadeTecnica: string | null;
  tipo: string;
  numeroDecisao: string | null;
  diverge: boolean;
  parecer: string | null;
  procurador: { id: string; name: string } | null;
}

interface DiarioData {
  dataPublicacao: Date;
  numeroEdicao: string | null;
}

export default function DiarioListPage() {
  const [result, setResult] = useState<{ entradas: DiarioEntry[]; total: number; page: number; totalPages: number } | null>(null);
  const [datas, setDatas] = useState<DiarioData[]>([]);
  const [procuradores, setProcuradores] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    search: "",
    procuradorId: "",
    diverge: undefined as boolean | undefined,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState("");
  const [contentLoading, setContentLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [procuradorDropdownId, setProcuradorDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tipoLabel: Record<string, string> = {
    decisao_singular: "Dec. Singular",
    deliberacao_plenario: "Delib. Plenário",
    parecer_previo: "Parecer Prévio",
  };

  // Debounced search value to avoid spamming requests on each keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Stable filter object for fetchData dependency
  const stableFilters = useMemo(() => ({
    dataInicio: filters.dataInicio || undefined,
    dataFim: filters.dataFim || undefined,
    search: debouncedSearch || undefined,
    procuradorId: filters.procuradorId || undefined,
    diverge: filters.diverge,
  }), [filters.dataInicio, filters.dataFim, debouncedSearch, filters.procuradorId, filters.diverge]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarDiarios({
        ...stableFilters,
        page,
        pageSize: 20,
      });
      setResult(data);
    } catch {
      setResult(null);
    }
    setLoading(false);
  }, [stableFilters, page]);

  // Load reference data ONCE on mount
  useEffect(() => {
    getDatasDisponiveis().then(setDatas).catch(() => {});
    getProcuradores().then(setProcuradores).catch(() => {});
  }, []);

  // Fetch data when filters or page change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProcuradorDropdownId(null);
      }
    };
    if (procuradorDropdownId) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [procuradorDropdownId]);

  const handleRowClick = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setContentLoading(true);
    try {
      const { getDiarioById } = await import("@/actions/diario");
      const entry = await getDiarioById(id);
      setExpandedContent(entry?.conteudoHtml || "<p>conteúdo não disponível.</p>");
    } catch {
      setExpandedContent("<p>Erro ao carregar conteúdo.</p>");
    }
    setContentLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDiario(id);
      setConfirmDelete(null);
      setExpandedId(null);
      fetchData();
    } catch {}
  };

  const handleToggleDiverge = async (id: string) => {
    try {
      await toggleDivergeDiario(id);
      fetchData();
    } catch {}
  };

  const handleAssignProcurador = async (diarioId: string, procuradorId: string | null) => {
    try {
      await assignProcuradorDiario(diarioId, procuradorId);
      setProcuradorDropdownId(null);
      fetchData();
    } catch {}
  };

  const entradas = result?.entradas || [];
  const total = result?.total || 0;
  const totalPages = result?.totalPages || 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-primary-50">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <h1 className="page-title">Parecer/Decisões</h1>
            <p className="page-subtitle">Gerencie os pareceres e decisões do diário oficial</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Data Início</label>
            <input type="date" value={filters.dataInicio} onChange={(e) => { setFilters(f => ({ ...f, dataInicio: e.target.value })); setPage(1); }}
              className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Data Fim</label>
            <input type="date" value={filters.dataFim} onChange={(e) => { setFilters(f => ({ ...f, dataFim: e.target.value })); setPage(1); }}
              className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Procurador</label>
            <select value={filters.procuradorId} onChange={(e) => { setFilters(f => ({ ...f, procuradorId: e.target.value })); setPage(1); }}
              className="w-full">
              <option value="">Todos</option>
              {procuradores.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={filters.diverge === true} onChange={(e) => { setFilters(f => ({ ...f, diverge: e.target.checked ? true : undefined })); setPage(1); }}
                className="rounded border-gray-300 text-primary focus:ring-primary-light w-4 h-4" />
              <span className="text-sm font-medium text-slate-600 group-hover:text-primary transition-colors">Diverge</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Busca</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={filters.search} onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
                className="w-full pl-9" placeholder="Processo, UG, interessados..." />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="skeleton h-4 w-32"></div>
            <div className="skeleton h-4 w-20"></div>
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton h-4 w-8 rounded"></div>
              <div className="skeleton h-4 w-20"></div>
              <div className="skeleton h-5 w-24 rounded-full"></div>
              <div className="skeleton h-4 w-28"></div>
              <div className="skeleton h-4 w-24"></div>
              <div className="skeleton h-4 w-32 hidden md:block"></div>
              <div className="skeleton h-4 w-24 hidden md:block"></div>
              <div className="skeleton h-5 w-20 rounded-full hidden lg:block"></div>
            </div>
          ))}
        </div>
      ) : entradas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <p className="empty-state-text">Nenhuma entrada encontrada.</p>
          <p className="text-xs text-slate-400 mt-1">Vá em &quot;Importar Diário Oficial&quot; para carregar um PDF.</p>
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{total}</span> {total === 1 ? "resultado encontrado" : "resultados encontrados"}
            </p>
          </div>

          {/* Table */}
          <div className="table-container overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr>
                  <th className="w-16">Diverge</th>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Processo</th>
                  <th>Procurador</th>
                  <th>Unid. Gestora</th>
                  <th>Responsável</th>
                  <th>Interessados</th>
                  <th>Relator</th>
                  <th>Unid. Técnica</th>
                  <th>Status</th>
                  <th>N. Decisão</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <tr className={expandedId === entry.id ? "bg-primary-50/40" : ""}>
                      <td className="text-center">
                        <input type="checkbox" checked={entry.diverge} onChange={() => handleToggleDiverge(entry.id)}
                          className="rounded border-gray-300 text-primary focus:ring-primary-light cursor-pointer w-4 h-4" />
                      </td>
                      <td onClick={() => handleRowClick(entry.id)} className="text-slate-500 text-xs whitespace-nowrap cursor-pointer">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(entry.dataPublicacao).toLocaleDateString("pt-BR")}
                        </div>
                      </td>
                      <td onClick={() => handleRowClick(entry.id)} className="cursor-pointer">
                        <span className={`badge ${
                          entry.tipo === "decisao_singular" ? "badge-info" :
                          entry.tipo === "parecer_previo" ? "badge-purple" :
                          "badge-success"
                        }`}>{tipoLabel[entry.tipo] || entry.tipo}</span>
                      </td>
                      <td className="font-semibold text-primary whitespace-nowrap">
                        <Link href={`/registrador/diario/${entry.id}`} className="hover:underline hover:text-primary-light transition-colors">{entry.numeroProcesso}</Link>
                      </td>
                      <td className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setProcuradorDropdownId(procuradorDropdownId === entry.id ? null : entry.id); }}
                          className="text-sm text-left hover:text-primary cursor-pointer w-full transition-colors">
                          {entry.procurador ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {entry.procurador.name}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400 hover:text-primary">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span className="text-xs">Atribuir</span>
                            </span>
                          )}
                        </button>
                        {procuradorDropdownId === entry.id && (
                          <div ref={dropdownRef} className="dropdown-menu left-0 top-full mt-1">
                            <button onClick={() => handleAssignProcurador(entry.id, null)}
                              className="dropdown-item text-slate-400 italic">Nenhum</button>
                            {procuradores.map(p => (
                              <button key={p.id} onClick={() => handleAssignProcurador(entry.id, p.id)}
                                className="dropdown-item">
                                {p.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td onClick={() => handleRowClick(entry.id)} className="text-slate-500 max-w-[150px] truncate cursor-pointer">{entry.unidadeGestora || <span className="text-slate-300">—</span>}</td>
                      <td onClick={() => handleRowClick(entry.id)} className="text-slate-500 max-w-[120px] truncate cursor-pointer">{entry.responsavel || <span className="text-slate-300">—</span>}</td>
                      <td onClick={() => handleRowClick(entry.id)} className="text-slate-500 max-w-[150px] truncate cursor-pointer">{entry.interessados || <span className="text-slate-300">—</span>}</td>
                      <td onClick={() => handleRowClick(entry.id)} className="text-slate-500 max-w-[120px] truncate cursor-pointer">{entry.relator || <span className="text-slate-300">—</span>}</td>
                      <td onClick={() => handleRowClick(entry.id)} className="text-slate-500 max-w-[150px] truncate cursor-pointer">{entry.unidadeTecnica || <span className="text-slate-300">—</span>}</td>
                      <td>
                        {entry.parecer ? (
                          <span className="badge badge-success">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Concluído
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pendente
                          </span>
                        )}
                      </td>
                      <td onClick={() => handleRowClick(entry.id)} className="text-xs text-slate-500 whitespace-nowrap cursor-pointer">{entry.numeroDecisao || <span className="text-slate-300">—</span>}</td>
                      <td>
                        {confirmDelete === entry.id ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                              className="btn btn-danger btn-xs">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Sim
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                              className="btn btn-secondary btn-xs">Não</button>
                          </div>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(entry.id); }}
                            className="btn btn-xs text-danger border border-red-200 bg-white hover:bg-danger-bg hover:border-red-300 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === entry.id && (
                      <tr key={`${entry.id}-detail`}>
                        <td colSpan={13} className="!p-0">
                          <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100">
                            <div className="card p-5 max-h-96 overflow-y-auto">
                              {contentLoading ? (
                                <div className="space-y-3 animate-pulse">
                                  <div className="skeleton h-4 w-3/4"></div>
                                  <div className="skeleton h-4 w-full"></div>
                                  <div className="skeleton h-4 w-5/6"></div>
                                  <div className="skeleton h-4 w-2/3"></div>
                                </div>
                              ) : (
                                <div dangerouslySetInnerHTML={{ __html: expandedContent }} className="prose prose-sm max-w-none [&_p]:mb-2 [&_strong]:text-gray-900" />
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Mostrando <span className="font-semibold text-slate-700">{(page - 1) * 20 + 1}–{Math.min(page * 20, total)}</span> de <span className="font-semibold text-slate-700">{total}</span>
            </span>
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="pagination-btn">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-300">…</span>}
                  <button onClick={() => setPage(p)} className={`pagination-btn ${p === page ? "pagination-btn-active" : ""}`}>{p}</button>
                </span>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="pagination-btn">
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

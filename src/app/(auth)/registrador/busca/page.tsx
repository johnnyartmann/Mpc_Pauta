"use client";

import { useState } from "react";
import { searchDocumentos } from "@/actions/documento";
import Link from "next/link";

interface SearchResult {
  id: string;
  rank: number;
  trecho: string;
  origem: string;
  link: string;
  numero_processo: string;
  pauta_nome: string | null;
}

const origemLabel: Record<string, string> = {
  pauta: "Pauta",
  processo: "Processo",
  diario: "Parecer/Decisão",
};

const origemBadge: Record<string, string> = {
  pauta: "badge-info",
  processo: "badge-success",
  diario: "badge-purple",
};

export default function RegistradorBuscaPage() {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (formData: FormData) => {
    const query = formData.get("query") as string;
    if (!query) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchDocumentos(query);
      setResults(data);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Buscador</h1>
        <p className="page-subtitle">Busca unificada em pautas, processos e parecer/decisões</p>
      </div>

      <form action={handleSearch} className="filter-bar">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              name="query"
              type="text"
              placeholder="Nº processo, assunto, interessados, relator, palavra-chave..."
              required
              minLength={2}
              className="w-full pl-11 py-2.5 text-sm rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Buscando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                Buscar
              </>
            )}
          </button>
        </div>
      </form>

      {results && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="badge badge-info">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>
              {results.length} resultado(s) encontrado(s)
            </span>
          </div>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="w-24">Origem</th>
                  <th className="w-40">Processo</th>
                  <th>Trecho</th>
                  <th className="w-20 text-right">Relev.</th>
                </tr>
              </thead>
              <tbody>
                {results.map((doc) => (
                  <tr key={`${doc.origem}-${doc.id}`}>
                    <td>
                      <span className={`badge ${origemBadge[doc.origem] || "badge-info"}`}>
                        {origemLabel[doc.origem] || doc.origem}
                      </span>
                    </td>
                    <td>
                      <Link href={doc.link} className="text-primary hover:text-primary-light font-semibold hover:underline transition-colors">
                        {doc.numero_processo}
                      </Link>
                      {doc.pauta_nome && (
                        <p className="text-xs text-gray-400 mt-0.5">{doc.pauta_nome}</p>
                      )}
                    </td>
                    <td className="text-gray-600 text-xs leading-relaxed">
                      <span dangerouslySetInnerHTML={{ __html: doc.trecho?.replace(/<mark>/g, '<mark class="bg-yellow-200 px-0.5 rounded">')?.replace(/<\/mark>/g, '</mark>') || "..." }} />
                    </td>
                    <td className="text-right">
                      <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                        {doc.rank?.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results && results.length === 0 && searched && (
        <div className="empty-state">
          <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p className="empty-state-text">Nenhum resultado encontrado.</p>
          <p className="text-xs text-gray-300 mt-1">Tente buscar com termos diferentes</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useActionState, useState, useCallback, useRef } from "react";
import { importarPauta } from "@/actions/pauta";
import { importarDiario, previewDiario } from "@/actions/diario";

interface ImportState {
  error?: string;
  success?: string;
}

interface PreviewEntry {
  numero_processo: string;
  unidade_gestora: string | null;
  responsavel: string;
  interessados: string | null;
  assunto: string | null;
  relator: string | null;
  unidade_tecnica: string | null;
  tipo: string;
  numero_decisao: string | null;
}

interface PreviewResult {
  data_publicacao: string;
  numero_edicao: string | null;
  entradas: PreviewEntry[];
  error?: string;
}

const initialState: ImportState = {};
const importInitialState = { error: "" as string, success: "" as string };

function ImportExcelTab() {
  const [state, action, isPending] = useActionState(importarPauta as any, initialState);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.endsWith(".xlsx")) {
      return;
    }
    setFile(f);
    try {
      const XLSX = await import("xlsx");
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      if (data.length > 1) {
        const headers = (data[1] as string[]) || [];
        const rows = (data.slice(2, 7) as string[][]) || [];
        setPreview({ headers, rows });
      }
    } catch {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  return (
    <div className="space-y-6">
      {state?.error && (
        <div className="toast toast-error">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01"/></svg>
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="toast toast-success">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {state.success}
        </div>
      )}

      <form action={action} className="card p-6 space-y-5">
        <div>
          <label htmlFor="nome" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Nome da Pauta
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            className="w-full"
            placeholder="Ex: Sessão Ordinária 01/2026"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Arquivo Excel</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`drop-zone ${dragOver ? "drop-zone-active" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              name="arquivo"
              accept=".xlsx"
              required
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {file ? (
              <div>
                <svg className="w-10 h-10 mx-auto mb-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <p className="text-sm font-semibold text-primary">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">Clique para trocar o arquivo</p>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                <p className="text-sm font-medium text-gray-500">Arraste um arquivo .xlsx aqui</p>
                <p className="text-xs text-gray-400 mt-1">ou clique para selecionar</p>
              </div>
            )}
          </div>
        </div>

        {preview && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              Pré-visualização (primeiras linhas)
            </h3>
            <div className="table-container">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {preview.headers.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="whitespace-nowrap text-gray-600">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !file}
          className="btn btn-primary btn-block"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Importando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              Importar
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function ImportDiarioTab() {
  const [importState, importAction, isImporting] = useActionState(importarDiario as any, importInitialState);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const tipoLabel: Record<string, string> = {
    decisao_singular: "Decisão Singular",
    deliberacao_plenario: "Deliberação do Plenário",
    parecer_previo: "Parecer Prévio",
  };

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) return;
    setFile(f);
    setPreview(null);
    setPreviewError("");
    setPreviewLoading(true);

    try {
      const formData = new FormData();
      formData.append("arquivo", f);
      const result = await previewDiario(formData);
      if ("error" in result && result.error) {
        setPreviewError(result.error);
      } else {
        setPreview(result as PreviewResult);
      }
    } catch {
      setPreviewError("Erro ao processar o PDF.");
    }
    setPreviewLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      {importState?.error && (
        <div className="toast toast-error">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01"/></svg>
          {importState.error}
        </div>
      )}
      {importState?.success && (
        <div className="toast toast-success">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {importState.success}
        </div>
      )}

      <form ref={formRef} action={importAction} className="space-y-5">
        <div className="card p-6 space-y-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Arquivo PDF</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            className={`drop-zone ${dragOver ? "drop-zone-active" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              name="arquivo"
              accept=".pdf"
              required
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {file ? (
              <div>
                <svg className="w-10 h-10 mx-auto mb-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <p className="text-sm font-semibold text-primary">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">Clique para trocar o arquivo</p>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                <p className="text-sm font-medium text-gray-500">Arraste um arquivo .pdf aqui</p>
                <p className="text-xs text-gray-400 mt-1">ou clique para selecionar</p>
              </div>
            )}
          </div>

          {previewLoading && (
            <div className="flex items-center justify-center gap-3 py-6">
              <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span className="text-sm text-gray-500 font-medium">Processando PDF...</span>
            </div>
          )}

          {previewError && (
            <div className="toast toast-error">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01"/></svg>
              {previewError}
            </div>
          )}
        </div>

        {preview && !previewError && (
          <div className="table-container">
            <div className="px-5 py-3 bg-gradient-to-r from-primary-50 to-white border-b border-gray-200 flex items-center gap-4 text-sm">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                {preview.data_publicacao}
              </span>
              {preview.numero_edicao && <span className="badge badge-info">Edição: {preview.numero_edicao}</span>}
              <span className="badge badge-success">{preview.entradas.length} entrada(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th>Processo</th>
                    <th>Unid. Gestora</th>
                    <th>Responsável</th>
                    <th>Interessados</th>
                    <th>Relator</th>
                    <th>Unid. Técnica</th>
                    <th>Tipo</th>
                    <th>N. Decisão</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.entradas.map((entrada, i) => (
                    <tr key={i}>
                      <td className="font-semibold text-gray-800 whitespace-nowrap">{entrada.numero_processo}</td>
                      <td className="text-gray-500 max-w-[150px] truncate">{entrada.unidade_gestora || "-"}</td>
                      <td className="text-gray-500 max-w-[120px] truncate">{entrada.responsavel || "-"}</td>
                      <td className="text-gray-500 max-w-[150px] truncate">{entrada.interessados || "-"}</td>
                      <td className="text-gray-500 max-w-[120px] truncate">{entrada.relator || "-"}</td>
                      <td className="text-gray-500 max-w-[150px] truncate">{entrada.unidade_tecnica || "-"}</td>
                      <td>
                        <span className={`badge ${
                          entrada.tipo === "decisao_singular" ? "badge-info" :
                          entrada.tipo === "parecer_previo" ? "badge-purple" :
                          "badge-success"
                        }`}>
                          {tipoLabel[entrada.tipo] || entrada.tipo}
                        </span>
                      </td>
                      <td className="text-gray-500">{entrada.numero_decisao || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isImporting || !preview || previewLoading}
          className="btn btn-primary btn-block"
        >
          {isImporting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Importando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              Confirmar Importação
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ImportarPage() {
  const [tab, setTab] = useState<"excel" | "diario">("excel");

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Importar</h1>
        <p className="page-subtitle">Importe dados de pautas do TCE/SC</p>
      </div>

      <div className="tab-group">
        <button
          onClick={() => setTab("excel")}
          className={`tab-btn ${tab === "excel" ? "tab-btn-active" : ""}`}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Excel - Pauta TCE
          </span>
        </button>
        <button
          onClick={() => setTab("diario")}
          className={`tab-btn ${tab === "diario" ? "tab-btn-active" : ""}`}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
            PDF - Diário Oficial
          </span>
        </button>
      </div>

      {tab === "excel" ? <ImportExcelTab /> : <ImportDiarioTab />}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { RichEditor } from "@/components/rich-editor";
import { saveDocumento, extrairVotoPdf, getOrCreateDocumento } from "@/actions/documento";
import { toggleVotoDivergente, updateProcessoField } from "@/actions/processo";

export function ProcessoEditClient({ processo, documento, pautasVinculadas }: {
  processo: any;
  documento: any | null;
  pautasVinculadas: any[];
}) {
  const [selectedPautaId, setSelectedPautaId] = useState<string>(documento?.processoPautaId || pautasVinculadas[0]?.id || "");
  const [parecerMpc, setParecerMpc] = useState(documento?.documento?.parecerMpc || "");
  const [ementaVoto, setEmentaVoto] = useState(documento?.documento?.ementaVoto || "");
  const [propostaVoto, setPropostaVoto] = useState(documento?.documento?.propostaVoto || "");
  const [decisao, setDecisao] = useState(documento?.documento?.decisao || "");
  const [votoDivergenteTexto, setVotoDivergenteTexto] = useState(documento?.documento?.votoDivergenteTexto || "");
  const [saving, setSaving] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPp = pautasVinculadas.find((pp: any) => pp.id === selectedPautaId);
  const [votoDiv, setVotoDiv] = useState(currentPp?.votoDivergente || false);

  const [relatorField, setRelatorField] = useState(processo.relator || "");
  const [unidadeGestoraField, setUnidadeGestoraField] = useState(processo.unidadeGestora || "");
  const [grupoField, setGrupoField] = useState(processo.grupo || "");
  const [interessadosField, setInteressadosField] = useState(processo.interessados || "");
  const [assuntoField, setAssuntoField] = useState(processo.assunto || "");

  const loadPautaDocumento = useCallback(async (ppId: string) => {
    const pp = pautasVinculadas.find((p: any) => p.id === ppId);
    if (!pp) return;
    try {
      const result = await getOrCreateDocumento(processo.id, pp.pautaId);
      setParecerMpc(result.documento?.parecerMpc || "");
      setEmentaVoto(result.documento?.ementaVoto || "");
      setPropostaVoto(result.documento?.propostaVoto || "");
      setDecisao(result.documento?.decisao || "");
      setVotoDivergenteTexto(result.documento?.votoDivergenteTexto || "");
      setVotoDiv(pp.votoDivergente || false);
    } catch {}
  }, [processo.id, pautasVinculadas]);

  const handlePautaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedPautaId(newId);
    await loadPautaDocumento(newId);
  };

  const handleSave = async (field: string, content: string) => {
    if (!selectedPautaId) return;
    setSaving(field);
    try {
      await saveDocumento(selectedPautaId, field, content);
      setSaveMsg("Documento salvo com sucesso.");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch {
      setSaveMsg("Erro ao salvar.");
      setTimeout(() => setSaveMsg(""), 3000);
    }
    setSaving(null);
  };

  const handleProcessoFieldSave = async (field: string, value: string) => {
    setSaving(field);
    try {
      await updateProcessoField(processo.id, field, value);
      setSaveMsg("Campo salvo com sucesso.");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch {
      setSaveMsg("Erro ao salvar.");
      setTimeout(() => setSaveMsg(""), 3000);
    }
    setSaving(null);
  };

  const handleToggleVotoDiv = async () => {
    if (!selectedPautaId) return;
    try {
      const result = await toggleVotoDivergente(selectedPautaId);
      if (result.success) setVotoDiv(result.votoDivergente);
    } catch {}
  };

  const handleImportVoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("");
    const formData = new FormData();
    formData.append("arquivo", file);
    try {
      const result = await extrairVotoPdf(formData);
      if ("error" in result && result.error) {
        setImportMsg(result.error);
      } else if (result.ementa_html || result.proposta_html) {
        if (result.ementa_html) setEmentaVoto(result.ementa_html);
        if (result.proposta_html) setPropostaVoto(result.proposta_html);
        setImportMsg("Ementa e Proposta de Voto extraídas com sucesso! Verifique e salve.");
      } else {
        setImportMsg("Nenhum conteúdo extraído do PDF.");
      }
    } catch {
      setImportMsg("Erro ao processar o PDF.");
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(() => setImportMsg(""), 8000);
  };

  const currentPautaVinculada = pautasVinculadas.find((pp: any) => pp.id === selectedPautaId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{processo.numeroProcesso}</h1>
          <p className="text-sm text-gray-500 mt-1">Edição de documentos e informações</p>
        </div>
        <Link href="/registrador/pautas" className="text-sm text-gray-500 hover:text-gray-700">Voltar</Link>
      </div>

      {saveMsg && (
        <div className={`text-sm rounded-md px-4 py-3 flex items-center gap-2 ${saveMsg.includes("sucesso") ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          <span>{saveMsg.includes("sucesso") ? "✅" : "⚠️"}</span>
          {saveMsg}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-md p-5">
        {pautasVinculadas.length > 1 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Pauta Vinculada</label>
            <select value={selectedPautaId} onChange={handlePautaChange}
              className="border border-gray-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-light">
              {pautasVinculadas.map((pp: any) => (
                <option key={pp.id} value={pp.id}>{pp.pauta?.nome || "Pauta sem nome"}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" checked={votoDiv} onChange={handleToggleVotoDiv} id="voto-div"
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary-light cursor-pointer" />
          <label htmlFor="voto-div" className="text-sm text-gray-700">Voto Divergente</label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <ProcessoEditableField label="Relator" value={relatorField} onChange={setRelatorField} field="relator" onSave={handleProcessoFieldSave} saving={saving} />
          <ProcessoEditableField label="Unidade Gestora" value={unidadeGestoraField} onChange={setUnidadeGestoraField} field="unidadeGestora" onSave={handleProcessoFieldSave} saving={saving} />
          <ProcessoEditableField label="Grupo" value={grupoField} onChange={setGrupoField} field="grupo" onSave={handleProcessoFieldSave} saving={saving} />
          <ProcessoEditableField label="Interessados" value={interessadosField} onChange={setInteressadosField} field="interessados" onSave={handleProcessoFieldSave} saving={saving} />
          <div className="md:col-span-2">
            <ProcessoEditableField label="Assunto" value={assuntoField} onChange={setAssuntoField} field="assunto" onSave={handleProcessoFieldSave} saving={saving} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleImportVoto} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent/90 text-white rounded-md text-xs transition-colors disabled:opacity-50">
              <span>📄</span>
              {importing ? "Extraindo..." : "Importar Voto (PDF)"}
            </button>
            <span className="text-xs text-gray-400">Extrai automaticamente a Ementa e Proposta de Voto</span>
          </div>
          {importMsg && (
            <div className={`mt-2 text-xs rounded-md px-3 py-2 ${importMsg.includes("sucesso") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {importMsg}
            </div>
          )}
        </div>
      </div>

      {currentPautaVinculada && (
        <div className="bg-white border border-gray-200 rounded-md p-5 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Documentos - {currentPautaVinculada.pauta?.nome}</h2>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Parecer MPC</label>
              {saving === "parecerMpc" && <span className="text-xs text-gray-400">Salvando...</span>}
            </div>
            <RichEditor content={parecerMpc} onChange={(html) => setParecerMpc(html)} placeholder="Digite o parecer do MPC..." />
            <button type="button" onClick={() => handleSave("parecerMpc", parecerMpc)}
              className="mt-2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-md text-xs transition-colors">Salvar Parecer</button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Ementa do Voto</label>
              {saving === "ementaVoto" && <span className="text-xs text-gray-400">Salvando...</span>}
            </div>
            <RichEditor content={ementaVoto} onChange={(html) => setEmentaVoto(html)} placeholder="Digite a ementa do voto..." />
            <button type="button" onClick={() => handleSave("ementaVoto", ementaVoto)}
              className="mt-2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-md text-xs transition-colors">Salvar Ementa</button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Proposta de Voto</label>
              {saving === "propostaVoto" && <span className="text-xs text-gray-400">Salvando...</span>}
            </div>
            <RichEditor content={propostaVoto} onChange={(html) => setPropostaVoto(html)} placeholder="Digite a proposta de voto..." />
            <button type="button" onClick={() => handleSave("propostaVoto", propostaVoto)}
              className="mt-2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-md text-xs transition-colors">Salvar Proposta</button>
          </div>

          {votoDiv && (
            <div className="border-l-2 border-red-400 pl-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-red-700">Voto Divergente</label>
                {saving === "votoDivergenteTexto" && <span className="text-xs text-gray-400">Salvando...</span>}
              </div>
              <RichEditor content={votoDivergenteTexto} onChange={(html) => setVotoDivergenteTexto(html)} placeholder="Digite o voto divergente..." />
              <button type="button" onClick={() => handleSave("votoDivergenteTexto", votoDivergenteTexto)}
                className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs transition-colors">Salvar Voto Divergente</button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Decisão</label>
              {saving === "decisao" && <span className="text-xs text-gray-400">Salvando...</span>}
            </div>
            <RichEditor content={decisao} onChange={(html) => setDecisao(html)} placeholder="Digite a decisão..." />
            <button type="button" onClick={() => handleSave("decisao", decisao)}
              className="mt-2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-md text-xs transition-colors">Salvar Decisão</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProcessoEditableField({ label, value, onChange, field, onSave, saving }: {
  label: string; value: string; onChange: (v: string) => void; field: string; onSave: (field: string, value: string) => void; saving: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="flex items-center gap-1 mt-0.5">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-light focus:border-primary-light" />
        <button type="button" onClick={() => onSave(field, value)} disabled={saving === field}
          className="shrink-0 px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors disabled:opacity-50">
          {saving === field ? "..." : "✓"}
        </button>
      </div>
    </div>
  );
}

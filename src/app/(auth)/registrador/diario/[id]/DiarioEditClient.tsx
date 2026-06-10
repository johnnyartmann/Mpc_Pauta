"use client";

import { useState, useRef, useCallback } from "react";
import { saveParecerDiario, updateDiarioField } from "@/actions/diario";
import { RichEditor } from "@/components/rich-editor";

const tipoLabel: Record<string, string> = {
  decisao_singular: "Decisão Singular",
  deliberacao_plenario: "Deliberação do Plenário",
  parecer_previo: "Parecer Prévio",
};

export function DiarioEditClient({ entry }: { entry: any }) {
  const [parecer, setParecer] = useState(entry.parecer || "");
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [unidadeGestora, setUnidadeGestora] = useState(entry.unidadeGestora || "");
  const [responsavel, setResponsavel] = useState(entry.responsavel || "");
  const [interessados, setInteressados] = useState(entry.interessados || "");
  const [assunto, setAssunto] = useState(entry.assunto || "");
  const [relator, setRelator] = useState(entry.relator || "");
  const [unidadeTecnica, setUnidadeTecnica] = useState(entry.unidadeTecnica || "");
  const [numeroDecisao, setNumeroDecisao] = useState(entry.numeroDecisao || "");

  const handleSave = async () => {
    setSaving("parecer");
    try {
      await saveParecerDiario(entry.id, parecer);
      setMessage("Parecer salvo com sucesso.");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Erro ao salvar.");
      setTimeout(() => setMessage(""), 3000);
    }
    setSaving(null);
  };

  const handleFieldSave = async (field: string, value: string) => {
    setSaving(field);
    try {
      await updateDiarioField(entry.id, field, value);
      setMessage("Campo salvo com sucesso.");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Erro ao salvar.");
      setTimeout(() => setMessage(""), 3000);
    }
    setSaving(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{entry.numeroProcesso}</h1>
          <p className="text-sm text-gray-500 mt-1">Edição do parecer e informações</p>
        </div>
      </div>

      {message && (
        <div className={`text-sm rounded-md px-4 py-3 flex items-center gap-2 ${message.includes("sucesso") ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          <span>{message.includes("sucesso") ? "✅" : "⚠️"}</span>
          {message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-md p-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500">Data</p>
            <p className="text-sm text-gray-800 mt-0.5">{new Date(entry.dataPublicacao).toLocaleDateString("pt-BR")}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Edição</p>
            <p className="text-sm text-gray-800 mt-0.5">{entry.numeroEdicao || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Tipo</p>
            <p className="text-sm text-gray-800 mt-0.5">{tipoLabel[entry.tipo] || entry.tipo}</p>
          </div>
          <EditableField label="N. Decisão" value={numeroDecisao} onChange={setNumeroDecisao} field="numeroDecisao" onSave={handleFieldSave} saving={saving} />
          <EditableField label="Relator" value={relator} onChange={setRelator} field="relator" onSave={handleFieldSave} saving={saving} />
          <EditableField label="Unidade Gestora" value={unidadeGestora} onChange={setUnidadeGestora} field="unidadeGestora" onSave={handleFieldSave} saving={saving} />
          <EditableField label="Responsável" value={responsavel} onChange={setResponsavel} field="responsavel" onSave={handleFieldSave} saving={saving} />
          <EditableField label="Interessados" value={interessados} onChange={setInteressados} field="interessados" onSave={handleFieldSave} saving={saving} />
          <EditableField label="Unidade Técnica" value={unidadeTecnica} onChange={setUnidadeTecnica} field="unidadeTecnica" onSave={handleFieldSave} saving={saving} />
          <div className="md:col-span-5">
            <EditableField label="Assunto" value={assunto} onChange={setAssunto} field="assunto" onSave={handleFieldSave} saving={saving} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">Parecer</h3>
          <button onClick={handleSave} disabled={saving === "parecer"}
            className="px-3 py-1 bg-primary hover:bg-primary-dark text-white rounded-md text-xs transition-colors disabled:opacity-50">
            {saving === "parecer" ? "Salvando..." : "Salvar"}
          </button>
        </div>
        <RichEditor content={parecer} onChange={setParecer} placeholder="Digite o parecer..." />
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Conteúdo da Decisão (Diário Oficial)</h3>
        <div className="text-sm text-gray-700 max-h-96 overflow-y-auto border border-gray-200 rounded bg-gray-50 p-4 prose prose-sm max-w-none [&_p]:mb-2 [&_strong]:text-gray-900">
          {entry.conteudoHtml ? (
            <div dangerouslySetInnerHTML={{ __html: entry.conteudoHtml }} />
          ) : (
            <p className="text-gray-400">Conteúdo não disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EditableField({ label, value, onChange, field, onSave, saving }: {
  label: string; value: string; onChange: (v: string) => void; field: string; onSave: (field: string, value: string) => void; saving: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="flex items-center gap-1 mt-0.5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-light focus:border-primary-light"
        />
        <button
          type="button"
          onClick={() => onSave(field, value)}
          disabled={saving === field}
          className="shrink-0 px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors disabled:opacity-50"
        >
          {saving === field ? "..." : "✓"}
        </button>
      </div>
    </div>
  );
}

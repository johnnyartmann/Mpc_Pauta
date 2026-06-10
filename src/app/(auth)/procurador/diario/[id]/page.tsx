import { getDiarioById } from "@/actions/diario";
import { notFound } from "next/navigation";

const tipoLabel: Record<string, string> = {
  decisao_singular: "Decisão Singular",
  deliberacao_plenario: "Deliberação do Plenário",
  parecer_previo: "Parecer Prévio",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DiarioViewPage({ params }: PageProps) {
  const { id } = await params;

  let entry: any;
  try {
    entry = await getDiarioById(id);
  } catch {
    notFound();
  }
  if (!entry) notFound();

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-primary">{entry.numeroProcesso}</h1>

      <div className="bg-white border border-gray-200 rounded-md p-5 grid grid-cols-2 md:grid-cols-5 gap-5 text-sm">
        <div><p className="text-xs font-medium text-gray-500">Data</p><p className="text-sm text-gray-800 mt-0.5">{new Date(entry.dataPublicacao).toLocaleDateString("pt-BR")}</p></div>
        <div><p className="text-xs font-medium text-gray-500">Edição</p><p className="text-sm text-gray-800 mt-0.5">{entry.numeroEdicao || "-"}</p></div>
        <div><p className="text-xs font-medium text-gray-500">Tipo</p><p className="text-sm text-gray-800 mt-0.5">{tipoLabel[entry.tipo] || entry.tipo}</p></div>
        <div><p className="text-xs font-medium text-gray-500">N. Decisão</p><p className="text-sm text-gray-800 mt-0.5">{entry.numeroDecisao || "-"}</p></div>
        <div><p className="text-xs font-medium text-gray-500">Relator</p><p className="text-sm text-gray-800 mt-0.5">{entry.relator || "-"}</p></div>
        <div><p className="text-xs font-medium text-gray-500">Unidade Gestora</p><p className="text-sm text-gray-800 mt-0.5">{entry.unidadeGestora || "-"}</p></div>
        <div><p className="text-xs font-medium text-gray-500">Responsável</p><p className="text-sm text-gray-800 mt-0.5">{entry.responsavel || "-"}</p></div>
        <div><p className="text-xs font-medium text-gray-500">Interessados</p><p className="text-sm text-gray-800 mt-0.5">{entry.interessados || "-"}</p></div>
        <div><p className="text-xs font-medium text-gray-500">Unidade Técnica</p><p className="text-sm text-gray-800 mt-0.5">{entry.unidadeTecnica || "-"}</p></div>
        <div><p className="text-xs font-medium text-gray-500">Assunto</p><p className="text-sm text-gray-800 mt-0.5">{entry.assunto || "-"}</p></div>
      </div>

      {entry.parecer && (
        <div className="bg-white border border-gray-200 rounded-md p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Parecer</h3>
          <div className="text-sm text-gray-700 prose prose-sm max-w-none [&_p]:mb-2 [&_strong]:text-gray-900" dangerouslySetInnerHTML={{ __html: entry.parecer }} />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-md p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Conteúdo da Decisão (Diário Oficial)</h3>
        <div className="text-sm text-gray-700 max-h-96 overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-5 prose prose-sm max-w-none [&_p]:mb-2 [&_strong]:text-gray-900">
          {entry.conteudoHtml ? (
            <div dangerouslySetInnerHTML={{ __html: entry.conteudoHtml }} />
          ) : (
            <p className="text-gray-400">conteúdo não disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
}

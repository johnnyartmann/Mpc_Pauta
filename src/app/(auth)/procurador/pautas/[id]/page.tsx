import { getProcessoById } from "@/actions/processo";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProcuradorPautaDetailPage({ params }: PageProps) {
  const { id } = await params;

  let processo: any;
  try {
    processo = await getProcessoById(id);
  } catch {
    notFound();
  }
  if (!processo) notFound();

  const pautasVinculadas = processo.pautas || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{processo.numeroProcesso}</h1>
        <p className="text-sm text-gray-500 mt-1">Visualizacao de documentos e pareceres</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Relator</label>
            <p className="text-sm text-gray-800">{processo.relator || "-"}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Unidade Gestora</label>
            <p className="text-sm text-gray-800">{processo.unidadeGestora || "-"}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Grupo</label>
            <p className="text-sm text-gray-800">{processo.grupo || "-"}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Interessados</label>
            <p className="text-sm text-gray-800">{processo.interessados || "-"}</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-500 mb-1">Assunto</label>
          <p className="text-sm text-gray-800">{processo.assunto || "-"}</p>
        </div>
      </div>

      {pautasVinculadas.length > 0 ? (
        pautasVinculadas.map((pp: any) => (
          <div key={pp.id} className="bg-white border border-gray-200 rounded-md p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">{pp.pauta?.nome || "Pauta"}</h2>
              <div className="flex items-center gap-3 text-sm">
                {pp.procurador && (
                  <span className="text-gray-500">Procurador: <span className="text-gray-700 font-medium">{pp.procurador.name}</span></span>
                )}
                {pp.votoDivergente && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Voto Divergente</span>
                )}
              </div>
            </div>

            {pp.documentos?.length > 0 ? (
              pp.documentos.map((doc: any) => (
                <div key={doc.id} className="space-y-4 border-t border-gray-100 pt-5">
                  {doc.parecerMpc && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Parecer MPC</h3>
                      <div className="prose prose-sm max-w-none text-gray-600 border border-gray-200 rounded-md p-5 bg-gray-50" dangerouslySetInnerHTML={{ __html: doc.parecerMpc }} />
                    </div>
                  )}
                  {doc.ementaVoto && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Ementa do Voto</h3>
                      <div className="prose prose-sm max-w-none text-gray-600 border border-gray-200 rounded-md p-5 bg-gray-50" dangerouslySetInnerHTML={{ __html: doc.ementaVoto }} />
                    </div>
                  )}
                  {doc.propostaVoto && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Proposta de Voto</h3>
                      <div className="prose prose-sm max-w-none text-gray-600 border border-gray-200 rounded-md p-5 bg-gray-50" dangerouslySetInnerHTML={{ __html: doc.propostaVoto }} />
                    </div>
                  )}
                  {doc.decisao && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Decisao</h3>
                      <div className="prose prose-sm max-w-none text-gray-600 border border-gray-200 rounded-md p-5 bg-gray-50" dangerouslySetInnerHTML={{ __html: doc.decisao }} />
                    </div>
                  )}
                  {!doc.parecerMpc && !doc.ementaVoto && !doc.propostaVoto && !doc.decisao && (
                    <p className="text-sm text-gray-400">Nenhum documento cadastrado para esta pauta.</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Nenhum documento cadastrado para esta pauta.</p>
            )}
          </div>
        ))
      ) : (
        <div className="bg-white border border-gray-200 rounded-md p-8 text-center text-gray-400">
          Nenhuma pauta vinculada a este processo.
        </div>
      )}
    </div>
  );
}

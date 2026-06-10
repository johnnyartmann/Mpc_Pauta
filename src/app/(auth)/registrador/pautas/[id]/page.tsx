import { getProcessoById } from "@/actions/processo";
import { getOrCreateDocumento } from "@/actions/documento";
import { ProcessoEditClient } from "./ProcessoEditClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProcessoEditPage({ params }: PageProps) {
  const { id } = await params;

  let processo: any;
  try {
    processo = await getProcessoById(id);
  } catch {
    notFound();
  }
  if (!processo) notFound();

  const pautasVinculadas = processo.pautas || [];

  let documento: any = null;
  if (pautasVinculadas.length > 0) {
    const firstPautaId = pautasVinculadas[0].pautaId;
    try {
      documento = await getOrCreateDocumento(id, firstPautaId);
    } catch {}
  }

  return (
    <ProcessoEditClient
      processo={processo}
      documento={documento}
      pautasVinculadas={pautasVinculadas}
    />
  );
}

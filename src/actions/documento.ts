"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { processarVotoPDF } from "@/lib/pdf-processor";

export async function getOrCreateDocumento(
  processoId: string,
  pautaId: string
) {
  await verifySession();

  let pp = await prisma.processoPauta.findUnique({
    where: {
      pautaId_processoId: { pautaId, processoId },
    },
    include: { documentos: true },
  });

  if (!pp) {
    pp = await prisma.processoPauta.create({
      data: { pautaId, processoId },
      include: { documentos: true },
    });
  }

  if (pp.documentos.length === 0) {
    const doc = await prisma.documento.create({
      data: { processoPautaId: pp.id },
    });
    return { documento: doc, processoPautaId: pp.id };
  }

  return { documento: pp.documentos[0], processoPautaId: pp.id };
}

export async function saveDocumento(
  processoPautaId: string,
  field: string,
  content: string
) {
  const session = await verifySession();

  const validFields = ["parecerMpc", "ementaVoto", "propostaVoto", "decisao", "votoDivergenteTexto"];
  if (!validFields.includes(field)) return { error: "Campo inválido." };

  const data: any = {};
  data[field] = content;

  let doc = await prisma.documento.findFirst({ where: { processoPautaId } });
  if (!doc) {
    await prisma.documento.create({ data: { processoPautaId, ...data } });
  } else {
    await prisma.documento.update({ where: { id: doc.id }, data });
  }

  await logAudit({
    usuarioId: session.userId,
    acao: "edicao",
    entidade: "documento",
    entidadeId: processoPautaId,
    detalhes: { campo: field },
  });

  revalidatePath("/registrador/pautas");
  revalidatePath("/procurador/pautas");
  return { success: true };
}

export async function searchDocumentos(query: string) {
  await verifySession();
  if (!query || query.length < 2) return [];

  const words = query.trim().split(/\s+/).filter(w => w.length > 0);
  const tsquery = words.map(w => `${w}:*`).join(' & ');

  try {
    const [docResults, procResults, diarioResults] = await Promise.all([
      // Search documentos (Pautas)
      prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          d.id, 
          ts_rank(d."searchVector", to_tsquery('portuguese', $1)) AS rank,
          ts_headline('portuguese', COALESCE(d.parecer_mpc, '') || ' ' || COALESCE(d.ementa_voto, '') || ' ' || COALESCE(d.proposta_voto, '') || ' ' || COALESCE(d.decisao, ''), to_tsquery('portuguese', $1), 'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') AS trecho,
          'pauta' AS origem,
          pp.processo_id,
          pp.id AS pp_id,
          proc.numero_processo,
          p.nome AS pauta_nome
        FROM documentos d
        JOIN processos_pauta pp ON pp.id = d.processo_pauta_id
        JOIN processos proc ON proc.id = pp.processo_id
        JOIN pautas p ON p.id = pp.pauta_id
        WHERE d."searchVector" @@ to_tsquery('portuguese', $1)
        ORDER BY rank DESC
        LIMIT 30`,
        tsquery
      ),
      // Search processos
      prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          id,
          ts_rank("searchVector", to_tsquery('portuguese', $1)) AS rank,
          ts_headline('portuguese', COALESCE(assunto, '') || ' ' || COALESCE(interessados, ''), to_tsquery('portuguese', $1), 'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') AS trecho,
          'processo' AS origem,
          id AS processo_id,
          numero_processo
        FROM processos
        WHERE "searchVector" @@ to_tsquery('portuguese', $1)
        ORDER BY rank DESC
        LIMIT 30`,
        tsquery
      ),
      // Search diario_oficial
      prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          id,
          ts_rank("searchVector", to_tsquery('portuguese', $1)) AS rank,
          ts_headline('portuguese', COALESCE(parecer, '') || ' ' || COALESCE(conteudo_html, '') || ' ' || COALESCE(assunto, ''), to_tsquery('portuguese', $1), 'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') AS trecho,
          'diario' AS origem,
          id AS processo_id,
          numero_processo
        FROM diario_oficial
        WHERE "searchVector" @@ to_tsquery('portuguese', $1)
        ORDER BY rank DESC
        LIMIT 30`,
        tsquery
      ),
    ]);

    const results: any[] = [];

    docResults.forEach((r: any) => results.push({
      id: r.id,
      rank: r.rank,
      trecho: r.trecho || "",
      origem: "pauta",
      link: `/registrador/pautas/${r.processo_id}`,
      numero_processo: r.numero_processo,
      pauta_nome: r.pauta_nome,
    }));

    procResults.forEach((r: any) => results.push({
      id: r.id,
      rank: r.rank,
      trecho: r.trecho || "",
      origem: "processo",
      link: `/registrador/pautas/${r.processo_id}`,
      numero_processo: r.numero_processo,
      pauta_nome: null,
    }));

    diarioResults.forEach((r: any) => results.push({
      id: r.id,
      rank: r.rank,
      trecho: r.trecho || "",
      origem: "diario",
      link: `/registrador/diario/${r.id}`,
      numero_processo: r.numero_processo,
      pauta_nome: null,
    }));

    results.sort((a, b) => b.rank - a.rank);
    return results.slice(0, 50);
  } catch (err) {
    console.error("Erro na busca unificada:", err);
    return [];
  }
}



export async function extrairVotoPdf(formData: FormData) {
  const session = await verifySession();
  if (session.role !== "registrador") return { error: "Acesso não autorizado." };

  const file = formData.get("arquivo") as File;
  if (!file || file.size === 0) return { error: "Selecione um arquivo PDF." };
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) return { error: "Arquivo muito grande. Limite: 50MB." };
  if (!file.name.toLowerCase().endsWith(".pdf")) return { error: "O arquivo deve ser um PDF." };

  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, `${uuidv4()}.pdf`);


  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tmpPath, buffer);
  } catch {
    return { error: "Erro ao salvar o arquivo temporário." };
  }

  try {
    const result = await processarVotoPDF(tmpPath);
    return { ementa_html: result.ementa_html || "", proposta_html: result.proposta_html || "" };
  } catch (err: any) {
    return { error: `Erro ao processar PDF: ${err.message}` };
  } finally {
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { processarPDF, type ExtractResult } from "@/lib/pdf-processor";

interface EntradaDiario {
  numero_processo: string;
  unidade_gestora: string | null;
  interessados: string | null;
  assunto: string | null;
  relator: string | null;
  unidade_tecnica: string | null;
  tipo: string;
  numero_decisao: string | null;
  conteudo_html: string | null;
}

export async function importarDiario(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (session.role !== "registrador") {
    return { error: "Acesso não autorizado." };
  }

  const file = formData.get("arquivo") as File;
  if (!file || file.size === 0) {
    return { error: "Selecione um arquivo PDF." };
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { error: "O arquivo deve ser um PDF." };
  }

  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, `${uuidv4()}.pdf`);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tmpPath, buffer);
  } catch {
    return { error: "Erro ao salvar o arquivo temporario." };
  }

  let extractResult: ExtractResult;
  try {
    extractResult = await processarPDF(tmpPath);
  } finally {
    try { fs.unlinkSync(tmpPath); } catch {}
  }

  if (extractResult.error) {
    return { error: extractResult.error };
  }

  if (!extractResult.entradas || extractResult.entradas.length === 0) {
    return { error: "Nenhuma entrada encontrada no PDF. Verifique se o arquivo e um Diario Oficial valido." };
  }

  const dp = extractResult.data_publicacao || "";
  const parts = dp.split("-");
  const dataPublicacao = parts.length === 3
    ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    : new Date();
  let novosCount = 0;
  let existentesCount = 0;

  for (const entrada of extractResult.entradas) {
    if (!entrada.numero_processo) continue;

    const existing = await prisma.diarioOficial.findFirst({
      where: {
        numeroProcesso: entrada.numero_processo,
        dataPublicacao,
        numeroDecisao: entrada.numero_decisao || null,
      },
    });

    if (existing) {
      existentesCount++;
      continue;
    }

    await prisma.diarioOficial.create({
      data: {
        dataPublicacao,
        numeroEdicao: extractResult.numero_edicao,
        numeroProcesso: entrada.numero_processo,
        unidadeGestora: entrada.unidade_gestora,
        responsavel: (entrada as any).responsavel || "",
        interessados: entrada.interessados,
        assunto: entrada.assunto,
        relator: entrada.relator,
        unidadeTecnica: entrada.unidade_tecnica,
        tipo: entrada.tipo,
        numeroDecisao: entrada.numero_decisao,
        conteudoHtml: entrada.conteudo_html,
        importadoPorId: session.userId,
      },
    });
    novosCount++;
  }

  const total = extractResult.entradas.length;

  await logAudit({
    usuarioId: session.userId,
    acao: "importacao",
    entidade: "diario_oficial",
    detalhes: {
      data_publicacao: extractResult.data_publicacao,
      edicao: extractResult.numero_edicao,
      total,
      novos: novosCount,
      existentes: existentesCount,
    },
  });

  revalidatePath("/registrador/diario");

  return {
    success: `Diario importado com sucesso! ${total} entrada(s): ${novosCount} nova(s), ${existentesCount} já existente(s).`,
    total,
    novos: novosCount,
    existentes: existentesCount,
  };
}

export async function previewDiario(formData: FormData) {
  const session = await verifySession();
  if (session.role !== "registrador") {
    return { error: "Acesso não autorizado." };
  }

  const file = formData.get("arquivo") as File;
  if (!file || file.size === 0) {
    return { error: "Selecione um arquivo PDF." };
  }

  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, `${uuidv4()}.pdf`);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tmpPath, buffer);
  } catch {
    return { error: "Erro ao salvar o arquivo temporario." };
  }

  let extractResult: ExtractResult;
  try {
    extractResult = await processarPDF(tmpPath);
  } finally {
    try { fs.unlinkSync(tmpPath); } catch {}
  }

  if (extractResult.error) {
    return { error: extractResult.error };
  }

  return {
    data_publicacao: extractResult.data_publicacao,
    numero_edicao: extractResult.numero_edicao,
    entradas: extractResult.entradas.map(e => ({
      numero_processo: e.numero_processo,
      unidade_gestora: e.unidade_gestora,
      responsavel: (e as any).responsavel || "",
      interessados: e.interessados,
      assunto: e.assunto,
      relator: e.relator,
      unidade_tecnica: e.unidade_tecnica,
      tipo: e.tipo,
      numero_decisao: e.numero_decisao,
    })),
  };
}

export async function listarDiarios(filters?: {
  dataInicio?: string;
  dataFim?: string;
  search?: string;
  procuradorId?: string;
  diverge?: boolean;
  page?: number;
  pageSize?: number;
}) {
  await verifySession();

  const where: any = {};
  if (filters?.dataInicio) {
    where.dataPublicacao = { ...(where.dataPublicacao || {}), gte: new Date(filters.dataInicio) };
  }
  if (filters?.dataFim) {
    where.dataPublicacao = { ...(where.dataPublicacao || {}), lte: new Date(filters.dataFim) };
  }
  if (filters?.search) {
    where.OR = [
      { numeroProcesso: { contains: filters.search, mode: "insensitive" } },
      { unidadeGestora: { contains: filters.search, mode: "insensitive" } },
      { interessados: { contains: filters.search, mode: "insensitive" } },
      { assunto: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.procuradorId) {
    where.procuradorId = filters.procuradorId;
  }
  if (filters?.diverge !== undefined) {
    where.diverge = filters.diverge;
  }

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const [entradas, total] = await Promise.all([
    prisma.diarioOficial.findMany({
      where,
      orderBy: { dataPublicacao: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        dataPublicacao: true,
        numeroEdicao: true,
        numeroProcesso: true,
        unidadeGestora: true,
        responsavel: true,
        interessados: true,
        relator: true,
        unidadeTecnica: true,
        tipo: true,
        numeroDecisao: true,
        diverge: true,
        parecer: true,
        procurador: { select: { id: true, name: true } },
      },
    }),
    prisma.diarioOficial.count({ where }),
  ]);

  return { entradas, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getDiarioById(id: string) {
  await verifySession();
  return prisma.diarioOficial.findUnique({ where: { id } });
}

export async function getDatasDisponiveis() {
  await verifySession();
  const result = await prisma.diarioOficial.findMany({
    select: { dataPublicacao: true, numeroEdicao: true },
    distinct: ["dataPublicacao"],
    orderBy: { dataPublicacao: "desc" },
    take: 100,
  });
  return result;
}

export async function deleteDiario(id: string) {
  const session = await verifySession();
  if (session.role !== "registrador") return { error: "Acesso não autorizado." };

  const entry = await prisma.diarioOficial.findUnique({ where: { id } });
  if (!entry) return { error: "Registro não encontrado." };

  await prisma.diarioOficial.delete({ where: { id } });

  await logAudit({
    usuarioId: session.userId,
    acao: "exclusao",
    entidade: "diario_oficial",
    entidadeId: id,
    detalhes: { numeroProcesso: entry.numeroProcesso, dataPublicacao: entry.dataPublicacao },
  });

  revalidatePath("/registrador/diario");
  return { success: "Registro excluído com sucesso." };
}

export async function saveParecerDiario(diarioId: string, content: string) {
  const session = await verifySession();
  if (session.role !== "registrador") return { error: "Acesso não autorizado." };

  await prisma.diarioOficial.update({
    where: { id: diarioId },
    data: { parecer: content },
  });

  await logAudit({
    usuarioId: session.userId,
    acao: "edicao",
    entidade: "diario_oficial",
    entidadeId: diarioId,
    detalhes: { campo: "parecer" },
  });

  revalidatePath("/registrador/diario");
  return { success: true };
}

export async function assignProcuradorDiario(diarioId: string, procuradorId: string | null) {
  const session = await verifySession();
  if (session.role !== "registrador") return { error: "Acesso não autorizado." };

  await prisma.diarioOficial.update({
    where: { id: diarioId },
    data: { procuradorId: procuradorId || null },
  });

  revalidatePath("/registrador/diario");
  return { success: true };
}

export async function toggleDivergeDiario(diarioId: string) {
  const session = await verifySession();
  if (session.role !== "registrador") return { error: "Acesso não autorizado." };

  const entry = await prisma.diarioOficial.findUnique({ where: { id: diarioId } });
  if (!entry) return { error: "Registro não encontrado." };

  await prisma.diarioOficial.update({
    where: { id: diarioId },
    data: { diverge: !entry.diverge },
  });

  await logAudit({
    usuarioId: session.userId,
    acao: entry.diverge ? "desmarcar_diverge" : "marcar_diverge",
    entidade: "diario_oficial",
    entidadeId: diarioId,
    detalhes: { numeroProcesso: entry.numeroProcesso },
  });

  revalidatePath("/registrador/diario");
  return { success: true, diverge: !entry.diverge };
}

export async function updateDiarioField(diarioId: string, field: string, value: string) {
  const session = await verifySession();
  if (session.role !== "registrador") return { error: "Acesso não autorizado." };

  const data: any = {};
  data[field] = value || null;

  await prisma.diarioOficial.update({ where: { id: diarioId }, data });

  await logAudit({
    usuarioId: session.userId,
    acao: "edicao",
    entidade: "diario_oficial",
    entidadeId: diarioId,
    detalhes: { campo: field },
  });

  revalidatePath("/registrador/diario");
  return { success: true };
}

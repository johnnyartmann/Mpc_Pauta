"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";

export async function importarPauta(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (session.role !== "registrador") {
    return { error: "Acesso não autorizado." };
  }

  const nome = formData.get("nome") as string;
  const file = formData.get("arquivo") as File;

  if (!nome || !nome.trim()) {
    return { error: "Informe um nome para a pauta." };
  }
  if (!file || file.size === 0) {
    return { error: "Selecione um arquivo Excel." };
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return { error: "Erro ao ler o arquivo." };
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return { error: "Arquivo inválido. Envie um .xlsx válido." };
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  if (data.length < 3) {
    return { error: "Planilha vazia ou com formato inválido." };
  }

  const headers = data[1] as string[];
  const expectedHeaders = [
    "Grupo",
    "Processo",
    "Relator",
    "Unidade Gestora",
    "Assunto",
    "Interessados",
  ];

  const headerMatch = expectedHeaders.every((h, i) => {
    const actual = String(headers[i] || "").trim();
    return actual === h;
  });

  if (!headerMatch) {
    return {
      error:
        "Cabeçalho da planilha não corresponde ao esperado. Esperado: Grupo, Processo, Relator, Unidade Gestora, Assunto, Interessados",
    };
  }

  const pauta = await prisma.pauta.create({
    data: {
      nome: nome.trim(),
      arquivoOriginal: file.name,
      importadoPorId: session.userId,
    },
  });

  await logAudit({
    usuarioId: session.userId,
    acao: "importacao",
    entidade: "pauta",
    entidadeId: pauta.id,
    detalhes: { nome: pauta.nome, arquivo: file.name },
  });

  let novosCount = 0;
  let existentesCount = 0;
  let totalLinhas = 0;
  const linhasIgnoradas: number[] = [];

  const rowsToProcess: {
    grupo: string;
    numeroProcesso: string;
    relator: string;
    unidadeGestora: string;
    assunto: string;
    interessados: string;
    rowIndex: number;
  }[] = [];

  const uniqueNumeros = new Set<string>();

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    totalLinhas++;
    if (!row || row.length < 2) {
      linhasIgnoradas.push(i + 1);
      continue;
    }

    const grupo = String(row[0] || "").trim();
    const numeroProcesso = String(row[1] || "").trim();
    const relator = String(row[2] || "").trim();
    const unidadeGestora = String(row[3] || "").trim();
    const assunto = String(row[4] || "").trim();
    const interessados = String(row[5] || "").trim();

    if (!numeroProcesso) {
      linhasIgnoradas.push(i + 1);
      continue;
    }

    if (uniqueNumeros.has(numeroProcesso)) {
      continue;
    }
    uniqueNumeros.add(numeroProcesso);

    rowsToProcess.push({
      grupo,
      numeroProcesso,
      relator,
      unidadeGestora,
      assunto,
      interessados,
      rowIndex: i + 1,
    });
  }

  const numerosList = Array.from(uniqueNumeros);
  const processosExistentes = await prisma.processo.findMany({
    where: {
      numeroProcesso: { in: numerosList },
    },
  });

  const existenteMap = new Map<string, typeof processosExistentes[0]>();
  for (const p of processosExistentes) {
    existenteMap.set(p.numeroProcesso, p);
  }

  const novosProcessosData: any[] = [];
  const updatesToRun: any[] = [];
  const todosProcessosMap = new Map<string, { id: string }>();

  for (const row of rowsToProcess) {
    const existing = existenteMap.get(row.numeroProcesso);

    if (!existing) {
      const newId = uuidv4();
      novosProcessosData.push({
        id: newId,
        numeroProcesso: row.numeroProcesso,
        grupo: row.grupo || null,
        relator: row.relator || null,
        unidadeGestora: row.unidadeGestora || null,
        assunto: row.assunto || null,
        interessados: row.interessados || null,
        updatedAt: new Date(),
      });
      todosProcessosMap.set(row.numeroProcesso, { id: newId });
      novosCount++;
    } else {
      todosProcessosMap.set(row.numeroProcesso, { id: existing.id });
      existentesCount++;

      const hasChanged =
        existing.grupo !== (row.grupo || null) ||
        existing.relator !== (row.relator || null) ||
        existing.unidadeGestora !== (row.unidadeGestora || null) ||
        existing.assunto !== (row.assunto || null) ||
        existing.interessados !== (row.interessados || null);

      if (hasChanged) {
        updatesToRun.push(
          prisma.processo.update({
            where: { id: existing.id },
            data: {
              grupo: row.grupo || null,
              relator: row.relator || null,
              unidadeGestora: row.unidadeGestora || null,
              assunto: row.assunto || null,
              interessados: row.interessados || null,
            },
          })
        );
      }
    }
  }

  if (novosProcessosData.length > 0) {
    await prisma.processo.createMany({
      data: novosProcessosData,
      skipDuplicates: true,
    });
  }

  if (updatesToRun.length > 0) {
    await prisma.$transaction(updatesToRun);
  }

  const processoPautaData = rowsToProcess.map((row) => {
    const proc = todosProcessosMap.get(row.numeroProcesso);
    return {
      id: uuidv4(),
      pautaId: pauta.id,
      processoId: proc!.id,
    };
  });

  if (processoPautaData.length > 0) {
    await prisma.processoPauta.createMany({
      data: processoPautaData,
      skipDuplicates: true,
    });
  }

  revalidatePath("/registrador/pautas");
  revalidatePath("/registrador");

  return {
    success: `Pauta "${nome.trim()}" importada com sucesso! ${novosCount} novo(s), ${existentesCount} já existente(s). ${totalLinhas} linhas processadas${linhasIgnoradas.length > 0 ? `, ${linhasIgnoradas.length} ignorada(s) (sem numero de processo): linhas ${linhasIgnoradas.join(", ")}` : ""}.`,
  };
}

"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

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

    let processo = await prisma.processo.findUnique({
      where: { numeroProcesso },
    });

    if (!processo) {
      processo = await prisma.processo.create({
        data: {
          numeroProcesso,
          grupo: grupo || null,
          relator: relator || null,
          unidadeGestora: unidadeGestora || null,
          assunto: assunto || null,
          interessados: interessados || null,
        },
      });
      novosCount++;
    } else {
      existentesCount++;
      await prisma.processo.update({
        where: { id: processo.id },
        data: {
          grupo: grupo || null,
          relator: relator || null,
          unidadeGestora: unidadeGestora || null,
          assunto: assunto || null,
          interessados: interessados || null,
        },
      });
    }

    await prisma.processoPauta.upsert({
      where: {
        pautaId_processoId: {
          pautaId: pauta.id,
          processoId: processo.id,
        },
      },
      create: {
        pautaId: pauta.id,
        processoId: processo.id,
      },
      update: {},
    });
  }

  revalidatePath("/registrador/pautas");
  revalidatePath("/registrador");

  return {
    success: `Pauta "${nome.trim()}" importada com sucesso! ${novosCount} novo(s), ${existentesCount} já existente(s). ${totalLinhas} linhas processadas${linhasIgnoradas.length > 0 ? `, ${linhasIgnoradas.length} ignorada(s) (sem numero de processo): linhas ${linhasIgnoradas.join(", ")}` : ""}.`,
  };
}

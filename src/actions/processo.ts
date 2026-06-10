"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getProcessos(filters?: {
  pautaId?: string;
  relator?: string;
  unidadeGestora?: string;
  search?: string;
  procuradorId?: string;
  page?: number;
  pageSize?: number;
}) {
  await verifySession();

  const where: any = {};
  if (filters?.pautaId) {
    where.pautas = { some: { pautaId: filters.pautaId } };
  }
  if (filters?.procuradorId) {
    if (where.pautas?.some) {
      where.pautas.some.procuradorId = filters.procuradorId;
    } else {
      where.pautas = { some: { procuradorId: filters.procuradorId } };
    }
  }
  if (filters?.relator) {
    where.relator = { contains: filters.relator, mode: "insensitive" };
  }
  if (filters?.unidadeGestora) {
    where.unidadeGestora = { contains: filters.unidadeGestora, mode: "insensitive" };
  }
  if (filters?.search) {
    where.OR = [
      { numeroProcesso: { contains: filters.search, mode: "insensitive" } },
      { assunto: { contains: filters.search, mode: "insensitive" } },
      { interessados: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const [processos, total] = await Promise.all([
    prisma.processo.findMany({
      where,
      include: {
        pautas: {
          include: {
            pauta: { select: { id: true, nome: true } },
            procurador: { select: { id: true, name: true } },
            documentos: { select: { id: true, parecerMpc: true, propostaVoto: true, atualizadoEm: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.processo.count({ where }),
  ]);

  return { processos, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getProcessoById(id: string) {
  await verifySession();
  return prisma.processo.findUnique({
    where: { id },
    include: {
      pautas: {
        include: {
          pauta: { select: { id: true, nome: true, dataImportacao: true } },
          procurador: { select: { id: true, name: true } },
          documentos: true,
        },
      },
    },
  });
}

export async function getPautas() {
  await verifySession();
  return prisma.pauta.findMany({
    orderBy: { dataImportacao: "desc" },
    take: 100,
    include: {
      _count: { select: { processos: true } },
      processos: {
        include: {
          documentos: true,
        },
      },
    },
  });
}

export async function assignProcurador(processoPautaId: string, procuradorId: string | null) {
  const session = await verifySession();
  if (session.role !== "registrador") return { error: "Acesso não autorizado." };

  await prisma.processoPauta.update({
    where: { id: processoPautaId },
    data: { procuradorId: procuradorId || null },
  });

  await logAudit({
    usuarioId: session.userId,
    acao: "atribuicao_procurador",
    entidade: "processo_pauta",
    entidadeId: processoPautaId,
    detalhes: { procuradorId: procuradorId || null },
  });

  revalidatePath("/registrador/pautas");
  return { success: true };
}

export async function toggleVotoDivergente(processoPautaId: string) {
  const session = await verifySession();
  if (session.role !== "registrador") return { error: "Acesso não autorizado." };

  const pp = await prisma.processoPauta.findUnique({ where: { id: processoPautaId } });
  if (!pp) return { error: "Registro nao encontrado." };

  await prisma.processoPauta.update({
    where: { id: processoPautaId },
    data: { votoDivergente: !pp.votoDivergente },
  });

  await logAudit({
    usuarioId: session.userId,
    acao: "toggle_voto_divergente",
    entidade: "processo_pauta",
    entidadeId: processoPautaId,
    detalhes: { votoDivergente: !pp.votoDivergente },
  });

  revalidatePath("/registrador/pautas");
  return { success: true, votoDivergente: !pp.votoDivergente };
}

export async function deleteProcessoPauta(processoPautaId: string) {
  const session = await verifySession();
  if (session.role !== "registrador") return { error: "Acesso não autorizado." };

  await prisma.processoPauta.delete({ where: { id: processoPautaId } });

  await logAudit({
    usuarioId: session.userId,
    acao: "exclusao",
    entidade: "processo_pauta",
    entidadeId: processoPautaId,
  });

  revalidatePath("/registrador/pautas");
  return { success: true };
}

export async function updateProcessoField(processoId: string, field: string, value: string) {
  const session = await verifySession();
  if (session.role !== "registrador") return { error: "Acesso não autorizado." };

  const data: any = {};
  data[field] = value || null;

  await prisma.processo.update({ where: { id: processoId }, data });

  await logAudit({
    usuarioId: session.userId,
    acao: "edicao",
    entidade: "processo",
    entidadeId: processoId,
    detalhes: { campo: field },
  });

  revalidatePath("/registrador/pautas");
  return { success: true };
}

export async function getProcuradores() {
  await verifySession();
  return prisma.user.findMany({
    where: { role: "procurador", active: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

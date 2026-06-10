import "server-only";
import { prisma } from "./prisma";
import { headers } from "next/headers";

export async function logAudit(params: {
  usuarioId: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  detalhes?: Record<string, unknown>;
}) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "";

    await prisma.auditLog.create({
      data: {
        ...params,
        ipAddress: ip,
      } as any,
    });
  } catch {
    // Never block business logic for audit failures
  }
}

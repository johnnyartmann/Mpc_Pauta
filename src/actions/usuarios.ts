"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function listUsers() {
  const session = await verifySession();
  if (session.role !== "administrador") return { error: "Acesso não autorizado." };
  
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return { users };
}

export async function createUser(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (session.role !== "administrador") return { error: "Acesso não autorizado." };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name?.trim()) return { error: "Nome é obrigatório." };
  if (!email?.trim()) return { error: "Email é obrigatório." };
  if (!password || password.length < 6) return { error: "Senha deve ter no mínimo 6 caracteres." };

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) return { error: "Email já cadastrado." };

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "procurador",
      active: true,
    },
  });

  await logAudit({
    usuarioId: session.userId,
    acao: "criacao",
    entidade: "usuario",
    entidadeId: user.id,
    detalhes: { nome: user.name, email: user.email, role: user.role },
  });

  revalidatePath("/registrador/admin/usuarios");
  return { success: `Usuario "${user.name}" criado com sucesso.` };
}

export async function toggleUserActive(userId: string) {
  const session = await verifySession();
  if (session.role !== "administrador") return { error: "Acesso não autorizado." };

  if (userId === session.userId) return { error: "Você não pode desativar seu próprio usuário." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado." };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  });

  await logAudit({
    usuarioId: session.userId,
    acao: user.active ? "desativacao" : "ativacao",
    entidade: "usuario",
    entidadeId: user.id,
    detalhes: { nome: user.name, email: user.email },
  });

  revalidatePath("/registrador/admin/usuarios");
  return { success: `Usuario "${updated.name}" ${updated.active ? "ativado" : "desativado"} com sucesso.` };
}

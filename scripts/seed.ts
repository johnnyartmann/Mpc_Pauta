import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

async function seed() {
  dotenv.config({ override: true });
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/mpc_pauta?schema=public",
    }),
  });

  const hash = bcrypt.hashSync("mpc2026", 10);
  const adminHash = bcrypt.hashSync("admin", 10);

  await prisma.user.upsert({
    where: { email: "registrador@mpc.sc.gov.br" },
    update: {},
    create: {
      id: uuidv4(),
      name: "Joao Registrador",
      email: "registrador@mpc.sc.gov.br",
      passwordHash: hash,
      role: "registrador",
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "procurador@mpc.sc.gov.br" },
    update: {},
    create: {
      id: uuidv4(),
      name: "Maria Procuradora",
      email: "procurador@mpc.sc.gov.br",
      passwordHash: hash,
      role: "procurador",
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@mpc.sc.gov.br" },
    update: { passwordHash: adminHash, role: "administrador" },
    create: {
      id: uuidv4(),
      name: "Administrador",
      email: "admin@mpc.sc.gov.br",
      passwordHash: adminHash,
      role: "administrador",
      active: true,
    },
  });

  const users = await prisma.user.findMany();
  console.log("Usuarios:");
  users.forEach((u) => console.log(`  ${u.email} - ${u.role}`));

  await prisma.$disconnect();
}

seed().catch(console.error);

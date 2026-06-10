import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SistemaPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const role = (session.user as any).role;
  if (role === "registrador") redirect("/registrador");
  if (role === "procurador") redirect("/procurador");
  if (role === "administrador") redirect("/registrador/admin/usuarios");
  redirect("/?error=unauthorized");
}

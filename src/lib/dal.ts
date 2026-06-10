import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }
  return {
    isAuth: true,
    userId: (session.user as any).id,
    role: (session.user as any).role,
  };
});

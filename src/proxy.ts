import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (path.startsWith("/registrador/admin")) {
    if (!session?.user)
      return NextResponse.redirect(new URL("/", req.nextUrl));
    if (role !== "administrador") {
      return NextResponse.redirect(new URL("/registrador", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (path.startsWith("/registrador")) {
    if (!session?.user)
      return NextResponse.redirect(new URL("/", req.nextUrl));
    if (role === "procurador") {
      return NextResponse.redirect(new URL("/procurador", req.nextUrl));
    }
    if (role === "administrador") {
      return NextResponse.redirect(new URL("/registrador/admin/usuarios", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (path.startsWith("/procurador")) {
    if (!session?.user)
      return NextResponse.redirect(new URL("/", req.nextUrl));
    if (role !== "procurador") {
      return NextResponse.redirect(new URL(role === "administrador" ? "/registrador/admin/usuarios" : "/registrador", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

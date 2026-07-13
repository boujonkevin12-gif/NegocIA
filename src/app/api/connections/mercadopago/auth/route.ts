import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  const clientId = process.env.MP_CLIENT_ID || process.env.MP_PUBLIC_KEY;
  if (!clientId) {
    return NextResponse.json({ error: "MP_CLIENT_ID no configurado" }, { status: 500 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/connections/mercadopago/callback`;

  const authUrl = new URL("https://www.mercadopago.com.ar/authorization");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("platform_id", "mp");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", session.user.id);

  return NextResponse.redirect(authUrl.toString());
}

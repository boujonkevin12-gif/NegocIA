import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptCredentials } from "@/lib/financial-providers/encryption";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/banks?error=missing_params", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }

  const clientId = process.env.MP_CLIENT_ID || process.env.MP_PUBLIC_KEY;
  const clientSecret = process.env.MP_ACCESS_TOKEN;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/dashboard/banks?error=mp_not_configured", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/connections/mercadopago/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error("MercadoPago token exchange error:", err);
      return NextResponse.redirect(
        new URL("/dashboard/banks?error=token_exchange_failed", process.env.NEXTAUTH_URL || "http://localhost:3000")
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, user_id, email } = tokenData;

    // Get user info from MercadoPago
    const userResponse = await fetch(`https://api.mercadopago.com/users/me?access_token=${access_token}`);
    let userName = email || "MercadoPago";
    if (userResponse.ok) {
      const userData = await userResponse.json();
      userName = userData.first_name
        ? `${userData.first_name} ${userData.last_name || ""}`.trim()
        : email || "MercadoPago";
    }

    // Check if connection already exists for this user and provider
    const existing = await prisma.providerConnection.findFirst({
      where: {
        userId: state,
        providerId: "mercadopago",
      },
    });

    const encryptedCreds = encryptCredentials({
      access_token,
      refresh_token: refresh_token || "",
      mp_user_id: String(user_id || ""),
    });

    if (existing) {
      await prisma.providerConnection.update({
        where: { id: existing.id },
        data: {
          credentials: encryptedCreds,
          label: userName,
          status: "ACTIVE",
          lastError: null,
        },
      });
    } else {
      await prisma.providerConnection.create({
        data: {
          userId: state,
          providerId: "mercadopago",
          providerType: "BANK",
          label: userName,
          credentials: encryptedCreds,
          status: "ACTIVE",
        },
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard/banks?connected=mercadopago", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  } catch (error) {
    console.error("MercadoPago callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/banks?error=callback_failed", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }
}

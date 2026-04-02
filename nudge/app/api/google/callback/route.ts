export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/google/callback
 * Handles the OAuth redirect from Google after the user grants access.
 * Exchanges the auth code for tokens and stores them in the Integration table.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // organizationId
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&error=google_denied", req.url)
    );
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

    // Exchange auth code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("[Google OAuth] Token exchange failed:", tokenData.error);
      return NextResponse.redirect(
        new URL("/settings?tab=integrations&error=google_token_failed", req.url)
      );
    }

    // Fetch the Google user profile so we can store the email
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    // Upsert the integration record
    await prisma.integration.upsert({
      where: {
        organizationId_type: {
          organizationId: state,
          type: "GOOGLE_CALENDAR",
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? undefined,
        isActive: true,
        metadata: {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          scope: tokenData.scope,
          expiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
        },
      },
      create: {
        organizationId: state,
        type: "GOOGLE_CALENDAR",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        isActive: true,
        metadata: {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          scope: tokenData.scope,
          expiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
        },
      },
    });

    return NextResponse.redirect(
      new URL("/settings?tab=integrations&success=google_connected", req.url)
    );
  } catch (err) {
    console.error("[Google OAuth Callback]", err);
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&error=google_server_error", req.url)
    );
  }
}

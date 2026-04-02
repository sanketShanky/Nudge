export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/slack/callback
 * Handles the OAuth redirect from Slack after user authorizes the app.
 * Exchanges code for access token, stores in Integration table.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // organizationId
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&error=slack_denied", req.url)
    );
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/callback`;

    // Exchange code for token
    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.ok) {
      console.error("[Slack OAuth] Token exchange failed:", tokenData.error);
      return NextResponse.redirect(
        new URL("/settings?tab=integrations&error=slack_token_failed", req.url)
      );
    }

    // Upsert the integration record
    await prisma.integration.upsert({
      where: {
        organizationId_type: {
          organizationId: state,
          type: "SLACK",
        },
      },
      update: {
        accessToken: tokenData.access_token,
        isActive: true,
        metadata: {
          teamId: tokenData.team?.id,
          teamName: tokenData.team?.name,
          botUserId: tokenData.bot_user_id,
          scope: tokenData.scope,
        },
      },
      create: {
        organizationId: state,
        type: "SLACK",
        accessToken: tokenData.access_token,
        isActive: true,
        metadata: {
          teamId: tokenData.team?.id,
          teamName: tokenData.team?.name,
          botUserId: tokenData.bot_user_id,
          scope: tokenData.scope,
        },
      },
    });

    return NextResponse.redirect(
      new URL("/settings?tab=integrations&success=slack_connected", req.url)
    );
  } catch (err) {
    console.error("[Slack OAuth Callback]", err);
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&error=slack_server_error", req.url)
    );
  }
}

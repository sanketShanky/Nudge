export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

/**
 * GET /api/slack/connect
 * Redirects the user to the Slack OAuth authorization page.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId || clientId === "placeholder") {
    return NextResponse.redirect(
      new URL(
        "/settings?error=slack_not_configured",
        req.url
      )
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/callback`;
  const scopes = [
    "chat:write",
    "users:read",
    "users:read.email",
    "channels:read",
    "im:write",
  ].join(",");

  const slackAuthUrl = new URL("https://slack.com/oauth/v2/authorize");
  slackAuthUrl.searchParams.set("client_id", clientId);
  slackAuthUrl.searchParams.set("scope", scopes);
  slackAuthUrl.searchParams.set("redirect_uri", redirectUri);
  slackAuthUrl.searchParams.set("state", user.memberships[0]?.organizationId || "");

  return NextResponse.redirect(slackAuthUrl.toString());
}

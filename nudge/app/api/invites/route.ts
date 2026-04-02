import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/invites
 * Body: { email: string, role?: "MEMBER" | "ADMIN" }
 * Creates an invite record and (when MOCK_EMAIL is false) sends invite email via Resend.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 403 });

  const member = user.memberships[0];
  if (member.role !== "OWNER" && member.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 });
  }

  const { email, role = "MEMBER" } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Check if already a member
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { where: { organizationId: orgId } } },
  });
  if (existingUser?.memberships?.length) {
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });
  }

  // Check for existing pending invite
  const existingInvite = await prisma.invite.findFirst({
    where: { organizationId: orgId, email, acceptedAt: null },
  });
  if (existingInvite) {
    return NextResponse.json({ error: "Invite already pending for this email" }, { status: 409 });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.invite.create({
    data: {
      email,
      role: role as any,
      organizationId: orgId,
      expiresAt,
    },
  });

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join/${invite.token}`;
  const org = user.memberships[0]?.organization;

  if (process.env.MOCK_EMAIL === "true") {
    console.log(`[MOCK_EMAIL] Invite sent to ${email}:`, { inviteLink, org: org?.name });
  } else {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: `You're invited to join ${org?.name} on Nudge`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1e1b4b;">You're invited to Nudge 🎉</h2>
            <p><strong>${user.name || user.email}</strong> has invited you to join their workspace <strong>${org?.name}</strong> on Nudge.</p>
            <a href="${inviteLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Accept Invitation
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">This invitation expires in 7 days.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[POST /api/invites] Email send failed:", err);
    }
  }

  return NextResponse.json({ invite }, { status: 201 });
}

/** GET /api/invites — list pending invites for the org */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 403 });

  const invites = await prisma.invite.findMany({
    where: { organizationId: orgId, acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { prisma } from "@/lib/db/prisma";

/** DELETE /api/invites/[inviteId] — revoke a pending invite */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 403 });

  const member = user.memberships[0];
  if (member.role !== "OWNER" && member.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invite = await prisma.invite.findFirst({
    where: { id: inviteId, organizationId: orgId },
  });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.invite.delete({ where: { id: inviteId } });
  return NextResponse.json({ success: true });
}

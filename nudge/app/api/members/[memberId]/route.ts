import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { prisma } from "@/lib/db/prisma";
import { MemberRole } from "@prisma/client";

/** PATCH /api/members/[memberId] — update role */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 403 });

  const callerMember = user.memberships[0];
  if (callerMember.role !== "OWNER") {
    return NextResponse.json({ error: "Only owners can change roles" }, { status: 403 });
  }

  const { role } = await req.json();
  if (!Object.values(MemberRole).includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const target = await prisma.member.findFirst({
    where: { id: memberId, organizationId: orgId },
  });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot change owner role" }, { status: 400 });
  }

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: { role: role as MemberRole },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ member: updated });
}

/** DELETE /api/members/[memberId] — remove from org */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 403 });

  const callerMember = user.memberships[0];
  if (callerMember.role !== "OWNER" && callerMember.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await prisma.member.findFirst({
    where: { id: memberId, organizationId: orgId },
  });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });
  }
  // Prevent self-removal
  if (target.userId === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  await prisma.member.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}

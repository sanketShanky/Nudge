import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { TeamClient } from "@/components/team/TeamClient";

export default async function TeamPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return <div>No workspace found.</div>;

  const now = new Date();

  const [members, invites] = await Promise.all([
    prisma.member.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          include: {
            actionItems: {
              where: { meeting: { organizationId: orgId } },
              select: { status: true, dueDate: true },
            },
          },
        },
      },
      orderBy: { role: "asc" },
    }),
    prisma.invite.findMany({
      where: { organizationId: orgId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const currentMemberId = members.find((m) => m.userId === user.id)?.id;
  const currentRole = members.find((m) => m.userId === user.id)?.role || "MEMBER";

  return (
    <TeamClient
      members={members as any}
      invites={invites as any}
      currentMemberId={currentMemberId || ""}
      currentRole={currentRole}
      now={now.toISOString()}
    />
  );
}

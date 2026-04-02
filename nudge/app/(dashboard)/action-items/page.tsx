import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { ActionItemsClient } from "@/components/action-items/ActionItemsClient";

export default async function ActionItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; assignee?: string; q?: string }>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return <div>No workspace found.</div>;

  const params = await searchParams;
  const { status, priority, assignee, q } = params;

  const where: any = {
    meeting: { organizationId: orgId },
  };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignee) where.assigneeId = assignee;
  if (q) where.title = { contains: q, mode: "insensitive" };

  const [items, orgMembers] = await Promise.all([
    prisma.actionItem.findMany({
      where,
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      include: {
        assignee: true,
        meeting: { select: { id: true, title: true, meetingDate: true } },
      },
    }),
    prisma.user.findMany({
      where: { memberships: { some: { organizationId: orgId } } },
      select: { id: true, name: true, email: true, avatarUrl: true },
    }),
  ]);

  return (
    <ActionItemsClient
      items={items as any}
      orgMembers={orgMembers}
      currentUserId={user.id}
    />
  );
}

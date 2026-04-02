import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { MeetingDetailClient } from "@/components/meetings/MeetingDetailClient";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      actionItems: {
        include: { assignee: true },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      },
      attendees: true,
      createdBy: true,
    },
  });

  if (!meeting) notFound();

  const orgMembers = user.memberships[0]?.organizationId
    ? await prisma.user.findMany({
        where: {
          memberships: { some: { organizationId: user.memberships[0].organizationId } },
        },
        select: { id: true, name: true, email: true, avatarUrl: true },
      })
    : [];

  return <MeetingDetailClient meeting={meeting as any} orgMembers={orgMembers} />;
}

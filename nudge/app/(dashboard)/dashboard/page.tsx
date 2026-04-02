import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RecentMeetings } from "@/components/dashboard/RecentMeetings";
import { OverdueItems } from "@/components/dashboard/OverdueItems";
import { TeamScoreCard } from "@/components/dashboard/TeamScoreCard";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const orgId = user.memberships[0]?.organizationId;

  if (!orgId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No workspace found. Please complete onboarding.
      </div>
    );
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalOpen, totalOverdue, meetingsThisMonth, allItemsThisMonth] = await Promise.all([
    prisma.actionItem.count({
      where: { meeting: { organizationId: orgId }, status: { in: ["OPEN", "IN_PROGRESS"] as any } },
    }),
    prisma.actionItem.count({
      where: {
        meeting: { organizationId: orgId },
        status: { in: ["OPEN", "IN_PROGRESS"] as any },
        dueDate: { lt: now },
      },
    }),
    prisma.meeting.count({
      where: { organizationId: orgId, meetingDate: { gte: startOfMonth } },
    }),
    prisma.actionItem.findMany({
      where: { meeting: { organizationId: orgId, meetingDate: { gte: startOfMonth } } },
      select: { status: true },
    }),
  ]);

  const completedThisMonth = allItemsThisMonth.filter((i) => i.status === "DONE").length;
  const completionRate =
    allItemsThisMonth.length > 0
      ? Math.round((completedThisMonth / allItemsThisMonth.length) * 100)
      : 0;

  const recentMeetings = await prisma.meeting.findMany({
    where: { organizationId: orgId },
    orderBy: { meetingDate: "desc" },
    take: 5,
    include: {
      attendees: true,
      actionItems: { select: { status: true } },
    },
  });

  const overdueItemsList = await prisma.actionItem.findMany({
    where: {
      meeting: { organizationId: orgId },
      status: { in: ["OPEN", "IN_PROGRESS"] as any },
      dueDate: { lt: now },
    },
    orderBy: { dueDate: "asc" },
    take: 10,
    include: {
      assignee: true,
      meeting: { select: { id: true, title: true } },
    },
  });

  const orgMembers = await prisma.member.findMany({
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
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <StatsRow
        totalOpen={totalOpen}
        totalOverdue={totalOverdue}
        completionRate={completionRate}
        meetingsThisMonth={meetingsThisMonth}
      />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <RecentMeetings meetings={recentMeetings as any} />
          <OverdueItems items={overdueItemsList as any} />
        </div>
        <div className="space-y-8">
          <TeamScoreCard members={orgMembers as any} />
        </div>
      </div>
    </div>
  );
}

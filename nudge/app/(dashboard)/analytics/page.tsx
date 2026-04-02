import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import {
  ActivityBarChart,
  AssigneeBarChart,
  CompletionTrendChart,
  StatusPieChart,
} from "@/components/analytics/Charts";
import { TeamScoreCard } from "@/components/dashboard/TeamScoreCard";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true },
  });

  const orgId = user?.memberships[0]?.organizationId;
  if (!orgId) return <div>No Org ID</div>;

  // Build last 6 months range
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return { start: startOfMonth(d), end: endOfMonth(d), name: format(d, "MMM") };
  });

  // Fetch all action items across 6 months
  const [allItems, orgMembers] = await Promise.all([
    prisma.actionItem.findMany({
      where: {
        meeting: { organizationId: orgId },
        createdAt: { gte: months[0].start, lte: months[5].end },
      },
      select: {
        status: true,
        createdAt: true,
        assignee: { select: { name: true, email: true } },
      },
    }),
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
    }),
  ]);

  // Activity bar chart — items created per month
  const activityData = months.map(({ name, start, end }) => ({
    name,
    items: allItems.filter(
      (i) => new Date(i.createdAt) >= start && new Date(i.createdAt) <= end
    ).length,
  }));

  // Completion trend chart — % done per month
  const trendData = months.map(({ name, start, end }) => {
    const monthItems = allItems.filter(
      (i) => new Date(i.createdAt) >= start && new Date(i.createdAt) <= end
    );
    const done = monthItems.filter((i) => i.status === "DONE").length;
    return {
      name,
      rate: monthItems.length > 0 ? Math.round((done / monthItems.length) * 100) : 0,
    };
  });

  // Status pie chart — current totals
  const statusCounts = allItems.reduce<Record<string, number>>(
    (acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    },
    {}
  );
  const statusData = [
    { name: "Open", value: statusCounts["OPEN"] || 0 },
    { name: "In Progress", value: statusCounts["IN_PROGRESS"] || 0 },
    { name: "Done", value: statusCounts["DONE"] || 0 },
    { name: "Cancelled", value: statusCounts["CANCELLED"] || 0 },
  ].filter((s) => s.value > 0);

  // Assignee bar chart — items per assignee
  const assigneeCounts: Record<string, number> = {};
  for (const item of allItems) {
    if (item.assignee) {
      const key = item.assignee.name || item.assignee.email.split("@")[0];
      assigneeCounts[key] = (assigneeCounts[key] || 0) + 1;
    }
  }
  const assigneeData = Object.entries(assigneeCounts)
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => b.items - a.items)
    .slice(0, 8);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground mt-1">
          Visualize team performance and action item lifecycle.
        </p>
      </div>

      {allItems.length === 0 ? (
        <div className="rounded-xl border bg-white p-16 text-center text-zinc-400">
          <p className="text-lg font-medium">No data yet</p>
          <p className="text-sm mt-1">
            Create meetings and process action items to see analytics.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ActivityBarChart data={activityData} />
            <CompletionTrendChart data={trendData} />
            {statusData.length > 0 && <StatusPieChart data={statusData} />}
            {assigneeData.length > 0 && <AssigneeBarChart data={assigneeData} />}
          </div>

          <div className="mt-8">
            <TeamScoreCard members={orgMembers as any} />
          </div>
        </>
      )}
    </div>
  );
}

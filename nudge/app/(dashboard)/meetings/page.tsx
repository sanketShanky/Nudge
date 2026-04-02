import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { RecentMeetings } from "@/components/dashboard/RecentMeetings";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

export default async function MeetingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return <div>No workspace found.</div>;

  const allMeetings = await prisma.meeting.findMany({
    where: { organizationId: orgId },
    orderBy: { meetingDate: "desc" },
    include: {
      attendees: true,
      actionItems: { select: { status: true } },
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meetings</h2>
          <p className="text-muted-foreground mt-1">
            All processed transcripts and captured action items.
          </p>
        </div>
        <Link href="/meetings/new">
          <Button className="bg-brand-600 hover:bg-brand-500 shadow-sm gap-2 h-10 px-5">
            <Plus className="h-4 w-4" /> New Meeting
          </Button>
        </Link>
      </div>
      <RecentMeetings meetings={allMeetings as any} />
    </div>
  );
}

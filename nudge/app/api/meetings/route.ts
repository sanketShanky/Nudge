export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db/prisma";
import { extractActionItems } from "@/lib/ai/extract-action-items";
import { NextRequest, NextResponse } from "next/server";
import { TranscriptSource } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = dbUser.memberships[0]?.organizationId;
    if (!orgId) return NextResponse.json({ error: "User not in an organization" }, { status: 403 });

    const body = await req.json();
    const { title, transcript, attendeeEmails, meetingDate, source } = body;

    if (!title || !transcript) {
      return NextResponse.json({ error: "Title and transcript are required" }, { status: 400 });
    }

    // Run AI extraction (mocked if MOCK_AI=true)
    const parsedDate = meetingDate ? new Date(meetingDate) : new Date();
    const attendeeList = ((attendeeEmails as string[]) || []).map((email: string) => ({
      name: email.split("@")[0],
      email,
    }));
    const extraction = await extractActionItems(transcript, parsedDate, attendeeList);

    // Resolve / create attendees
    const attendeesToCreate = ((attendeeEmails as string[]) || []).map((email: string) => ({
      email,
      name: email.split("@")[0],
    }));

    // Create meeting with action items
    const meeting = await prisma.meeting.create({
      data: {
        title,
        transcript,
        transcriptSource: ((source as string) || "MANUAL") as TranscriptSource,
        meetingDate: parsedDate,
        status: "READY",
        summary: extraction.summary || null,
        organizationId: orgId,
        createdById: dbUser.id,
        attendees: {
          create: attendeesToCreate,
        },
        actionItems: {
          create: extraction.actionItems.map((item) => ({
            title: item.title,
            source: item.source,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            priority: item.priority as any,
            status: "OPEN" as any,
            ...(item.assigneeEmail
              ? {
                  assignee: {
                    connectOrCreate: {
                      where: { email: item.assigneeEmail },
                      create: {
                        email: item.assigneeEmail,
                        name: item.assigneeName || item.assigneeEmail.split("@")[0],
                      },
                    },
                  },
                }
              : {}),
          })),
        },
      },
      include: {
        actionItems: { include: { assignee: true } },
        attendees: true,
      },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/meetings]", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

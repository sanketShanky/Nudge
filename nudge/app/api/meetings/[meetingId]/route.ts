export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ActionStatus, Priority } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      actionItems: { include: { assignee: true }, orderBy: { createdAt: "asc" } },
      attendees: true,
      createdBy: true,
    },
  });

  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ meeting });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const meeting = await prisma.meeting.update({
    where: { id: meetingId },
    data: body,
  });

  return NextResponse.json({ meeting });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cascade deletes action items via Prisma schema
  await prisma.meeting.delete({ where: { id: meetingId } });
  return NextResponse.json({ success: true });
}


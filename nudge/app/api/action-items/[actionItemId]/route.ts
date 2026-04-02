export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ActionStatus, Priority } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ actionItemId: string }> }
) {
  const { actionItemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status, priority, dueDate, assigneeEmail, assigneeName, title } = body;

  const updateData: any = {};
  if (status) updateData.status = status as ActionStatus;
  if (priority) updateData.priority = priority as Priority;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
  if (title) updateData.title = title;

  // Handle assignee linking
  if (assigneeEmail) {
    const existingUser = await prisma.user.findUnique({ where: { email: assigneeEmail } });
    if (existingUser) {
      updateData.assignee = { connect: { id: existingUser.id } };
    } else {
      updateData.assignee = {
        create: { email: assigneeEmail, name: assigneeName || assigneeEmail.split("@")[0] },
      };
    }
  } else if (assigneeEmail === null) {
    updateData.assignee = { disconnect: true };
  }

  const item = await prisma.actionItem.update({
    where: { id: actionItemId },
    data: updateData,
    include: { assignee: true },
  });

  return NextResponse.json({ item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ actionItemId: string }> }
) {
  const { actionItemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.actionItem.delete({ where: { id: actionItemId } });
  return NextResponse.json({ success: true });
}

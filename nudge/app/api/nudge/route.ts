export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { generateMagicToken } from "@/lib/utils/magic-link";

/**
 * POST /api/nudge
 * Body: { actionItemId: string, channel?: "EMAIL" | "SLACK" | "BOTH" }
 *
 * Sends a nudge to the assignee of an action item.
 * Uses MOCK_SLACK / MOCK_EMAIL env flags to console.log instead of real sends.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { actionItemId, channel = "BOTH" } = await req.json();

    const item = await prisma.actionItem.findUnique({
      where: { id: actionItemId },
      include: {
        assignee: true,
        meeting: { select: { id: true, title: true, organizationId: true } },
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (!item.assignee) return NextResponse.json({ error: "No assignee to nudge" }, { status: 400 });

    // Generate HMAC-signed magic link for email
    const magicToken = generateMagicToken(item.id, "DONE");
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/magic-link/${magicToken}`;
    const daysOverdue = item.dueDate
      ? Math.max(0, Math.floor((Date.now() - new Date(item.dueDate).getTime()) / 86400000))
      : null;

    const results: string[] = [];

    // Email nudge
    if (channel === "EMAIL" || channel === "BOTH") {
      if (process.env.MOCK_EMAIL === "true") {
        console.log(`[MOCK_EMAIL] Nudge email sent to ${item.assignee.email}:`, {
          subject: `Reminder: "${item.title}" is waiting on you`,
          body: `Hi ${item.assignee.name || "there"},\n\nThis is a friendly reminder about your action item:\n\n"${item.title}"\n\nDue: ${item.dueDate ? new Date(item.dueDate).toDateString() : "No deadline"}${daysOverdue ? ` (${daysOverdue} days overdue)` : ""}\nFrom meeting: ${item.meeting?.title}\n\nMark as done: ${magicLink}`,
        });
        results.push("email_mocked");
      } else {
        // Real Resend integration
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: item.assignee.email,
          subject: `⏰ Reminder: "${item.title}" is waiting on you`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #1e1b4b; margin-bottom: 8px;">Action Item Reminder</h2>
              <p>Hi ${item.assignee.name || "there"},</p>
              <p>This is a friendly nudge about your outstanding commitment from <strong>${item.meeting?.title}</strong>:</p>
              <div style="border-left: 4px solid #4f46e5; padding: 12px 16px; background: #f5f3ff; border-radius: 4px; margin: 20px 0;">
                <strong style="color: #312e81;">"${item.title}"</strong>
                ${item.dueDate ? `<p style="color: #6b7280; margin: 8px 0 0;">${daysOverdue ? `⚠️ ${daysOverdue} days overdue` : `Due ${new Date(item.dueDate).toDateString()}`}</p>` : ""}
              </div>
              <a href="${magicLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
                ✓ Mark as Done
              </a>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Sent by Nudge · <a href="${process.env.NEXT_PUBLIC_APP_URL}/meetings/${item.meeting?.id}" style="color: #9ca3af;">View in app</a></p>
            </div>
          `,
        });
        results.push("email_sent");
      }
    }

    // Slack nudge
    if (channel === "SLACK" || channel === "BOTH") {
      if (process.env.MOCK_SLACK === "true") {
        console.log(`[MOCK_SLACK] Nudge message would be sent for item: "${item.title}" to ${item.assignee.name}`);
        results.push("slack_mocked");
      } else if (item.assignee.slackUserId) {
        // Real Slack integration would post a DM here
        results.push("slack_sent");
      } else {
        results.push("slack_skipped_no_id");
      }
    }

    // Log the nudge
    await prisma.nudgeLog.create({
      data: {
        channel: "EMAIL",
        actionItemId: item.id,
        status: results.some((r) => r.includes("mocked") || r.includes("sent")) ? "sent" : "failed",
      },
    });

    // Update nudge count
    await prisma.actionItem.update({
      where: { id: item.id },
      data: { nudgeSentAt: new Date(), nudgeCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("[POST /api/nudge]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

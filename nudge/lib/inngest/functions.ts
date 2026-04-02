import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Daily cron — finds all overdue action items and sends a nudge for each.
 * Runs at 9am UTC every day.
 */
export const overdueNudgeScan = inngest.createFunction(
  {
    id: "overdue-nudge-scan",
    name: "Daily Overdue Nudge Scan",
    triggers: [{ cron: "0 9 * * *" }],
  },
  async ({ step }) => {
    const now = new Date();

    const overdueItems = await step.run("fetch-overdue-items", async () => {
      return prisma.actionItem.findMany({
        where: {
          status: { in: ["OPEN" as any, "IN_PROGRESS" as any] },
          dueDate: { lt: now },
          nudgeCount: { lt: 3 },
          assigneeId: { not: null },
          OR: [
            { nudgeSentAt: null },
            { nudgeSentAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          ],
        },
        select: { id: true },
        take: 100,
      });
    });

    if (overdueItems.length > 0) {
      await inngest.send(
        overdueItems.map((item) => ({
          name: "nudge/send" as const,
          data: { actionItemId: item.id, channel: "BOTH" },
        }))
      );
    }

    return { nudged: overdueItems.length };
  }
);

/**
 * Event-driven — handles a single nudge send.
 * Triggered by the cron scan or manual dispatch.
 */
export const sendNudge = inngest.createFunction(
  {
    id: "send-nudge",
    name: "Send Nudge",
    triggers: [{ event: "nudge/send" }],
  },
  async ({ event, step }) => {
    const { actionItemId, channel = "BOTH" } = event.data as {
      actionItemId: string;
      channel?: string;
    };

    await step.run("send-via-api", async () => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(`${appUrl}/api/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionItemId, channel }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Nudge API failed: ${JSON.stringify(err)}`);
      }
    });

    return { actionItemId, sent: true };
  }
);

/**
 * Weekly recap — sends a summary email every Monday at 8am UTC.
 */
export const weeklyRecap = inngest.createFunction(
  {
    id: "weekly-recap",
    name: "Weekly Recap Email",
    triggers: [{ cron: "0 8 * * MON" }],
  },
  async ({ step }) => {
    const orgs = await step.run("fetch-orgs", async () => {
      return prisma.organization.findMany({
        include: {
          members: {
            include: {
              user: {
                include: {
                  actionItems: {
                    where: { status: { in: ["OPEN" as any, "IN_PROGRESS" as any] } },
                    include: { meeting: { select: { title: true } } },
                    take: 10,
                  },
                },
              },
            },
          },
        },
      });
    });

    let emailsSent = 0;

    for (const org of orgs) {
      for (const member of org.members) {
        const user = member.user;
        if (!user || user.actionItems.length === 0) continue;

        await step.run(`send-recap-${user.id}`, async () => {
          if (process.env.MOCK_EMAIL === "true") {
            console.log(
              `[MOCK_EMAIL] Weekly recap to ${user.email}: ${user.actionItems.length} open items`
            );
            return;
          }

          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);

          const itemListHtml = user.actionItems
            .map(
              (item) =>
                `<li style="margin-bottom:8px;"><strong>${item.title}</strong> — <em>${item.meeting?.title || "Unknown"}</em></li>`
            )
            .join("");

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: user.email,
            subject: `📋 Weekly Nudge Recap — ${user.actionItems.length} open item${user.actionItems.length !== 1 ? "s" : ""}`,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;">
                <h2 style="color:#1e1b4b;">Your Weekly Recap</h2>
                <p>Hi ${user.name || "there"}, here are your open action items:</p>
                <ul style="padding-left:20px;margin:20px 0;">${itemListHtml}</ul>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/action-items"
                   style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
                  View All Items
                </a>
              </div>
            `,
          });
          emailsSent++;
        });
      }
    }

    return { emailsSent };
  }
);

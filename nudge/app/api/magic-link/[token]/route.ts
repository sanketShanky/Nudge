import { NextRequest, NextResponse } from "next/server";
import { verifyMagicToken } from "@/lib/utils/magic-link";

/**
 * GET /api/magic-link/[token]
 * Allows assignees to update their action item status via a signed email link — no login required.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const { actionItemId, newStatus } = verifyMagicToken(token);

    const { prisma } = await import("@/lib/db/prisma");
    const item = await prisma.actionItem.update({
      where: { id: actionItemId },
      data: {
        status: newStatus as any,
        ...(newStatus === "DONE" ? { completedAt: new Date() } : {}),
      },
      include: { meeting: { select: { title: true } } },
    });

    const successUrl = new URL("/magic-link/success", req.url);
    successUrl.searchParams.set("item", item.title);
    successUrl.searchParams.set("status", newStatus);
    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error("[magic-link]", err);
    return NextResponse.redirect(new URL("/magic-link/error", req.url));
  }
}

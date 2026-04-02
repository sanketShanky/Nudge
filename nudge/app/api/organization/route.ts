import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { prisma } from "@/lib/db/prisma";

/** PATCH /api/organization — update org name / slug */
export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 403 });

  // Only OWNER or ADMIN can change org settings
  const member = user.memberships[0];
  if (member.role !== "OWNER" && member.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, slug } = await req.json();

  const updateData: any = {};
  if (name?.trim()) updateData.name = name.trim();
  if (slug?.trim()) {
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    // Check uniqueness
    const existing = await prisma.organization.findFirst({
      where: { slug: cleanSlug, NOT: { id: orgId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }
    updateData.slug = cleanSlug;
  }

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: updateData,
    select: { id: true, name: true, slug: true, plan: true },
  });

  return NextResponse.json({ org });
}

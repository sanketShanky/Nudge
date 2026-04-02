import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Returns the authenticated Supabase user AND their Prisma DB record.
 * If the Prisma user/org doesn't exist yet, they are created automatically
 * (acts as the post-signup provisioning step).
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user?.email) return null;

  // Try to find existing DB user
  let dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { memberships: { include: { organization: true } } },
  });

  // Auto-provision: create User + Org + Member if this is their first API call
  if (!dbUser) {
    const name = user.user_metadata?.name || user.email.split("@")[0];
    const orgName = `${name}'s Workspace`;
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);

    // Ensure slug uniqueness
    const existing = await prisma.organization.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {}, // no-op if already exists (handles race conditions)
      create: {
        email: user.email,
        name,
        memberships: {
          create: {
            role: "OWNER",
            organization: {
              create: {
                name: orgName,
                slug: finalSlug,
                plan: "FREE",
              },
            },
          },
        },
      },
      include: { memberships: { include: { organization: true } } },
    });

    console.log(`[auth] Auto-provisioned user + org for ${user.email}`);
  }

  return dbUser;
}

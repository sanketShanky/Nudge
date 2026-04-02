import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const org = user.memberships[0]?.organization;
  if (!org) redirect("/onboarding");

  const integration = await prisma.integration.findFirst({
    where: { organizationId: org.id, type: "SLACK" },
  });

  return (
    <SettingsClient
      user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
      org={{ id: org.id, name: org.name, slug: org.slug, plan: org.plan }}
      slackConnected={!!integration?.isActive}
    />
  );
}

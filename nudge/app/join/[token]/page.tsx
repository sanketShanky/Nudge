import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || new Date() > invite.expiresAt) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in — redirect to signup with token hint
  if (!user) {
    redirect(`/signup?invite=${token}`);
  }

  // Check email matches
  if (user.email !== invite.email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white border rounded-2xl shadow p-10 max-w-md text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-3">Email mismatch</h1>
          <p className="text-zinc-500">
            This invite was sent to <strong>{invite.email}</strong> but you are
            signed in as <strong>{user.email}</strong>.
          </p>
          <p className="text-zinc-400 text-sm mt-4">
            Please sign in with the correct email to accept this invite.
          </p>
        </div>
      </div>
    );
  }

  // Accept the invite
  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser) redirect("/login");

  // Check already a member
  const existing = await prisma.member.findFirst({
    where: { userId: dbUser.id, organizationId: invite.organizationId },
  });

  if (!existing) {
    await prisma.member.create({
      data: {
        userId: dbUser.id,
        organizationId: invite.organizationId,
        role: invite.role,
      },
    });
  }

  await prisma.invite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  redirect("/dashboard");
}

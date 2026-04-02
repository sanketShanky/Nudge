import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar and TopBar are client components, layout wraps them */}
      {/* Import them dynamically to keep layout as server component */}
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}

// We need a separate client wrapper for sidebar/topbar
import DashboardShell from "@/components/layout/DashboardShell";

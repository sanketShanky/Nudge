"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Plus } from "lucide-react";

export default function TopBar() {
  const { toggleSidebar } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();

  // Dynamic page title based on pathname
  let pageTitle = "Dashboard";
  if (pathname.includes("/meetings")) pageTitle = "Meetings";
  if (pathname.includes("/action-items")) pageTitle = "Action Items";
  if (pathname.includes("/team")) pageTitle = "Team";
  if (pathname.includes("/analytics")) pageTitle = "Analytics";
  if (pathname.includes("/settings")) pageTitle = "Settings";

  return (
    <header className="h-16 flex items-center justify-between border-b bg-white px-4 md:px-8">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 text-zinc-500 hover:text-zinc-900 transition-colors md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{pageTitle}</h1>
      </div>

      <div className="flex items-center space-x-3">
        <Button 
          onClick={() => router.push("/meetings/new")}
          className="bg-brand-600 hover:bg-brand-500 hidden sm:flex h-9 shrink-0 gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Meeting</span>
        </Button>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-600">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
        <div className="w-8 h-8 rounded-full ml-1 overflow-hidden bg-zinc-200">
          <img src="https://i.pravatar.cc/100?img=3" alt="Avatar" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
}

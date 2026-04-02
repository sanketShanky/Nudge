"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import { Home, Video, CheckSquare, Users, BarChart, Settings, LogOut, Search, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar() {
  const { isSidebarOpen } = useUIStore();
  const pathname = usePathname();
  const supabase = createClient();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Meetings", href: "/meetings", icon: Video },
    { name: "Action Items", href: "/action-items", icon: CheckSquare },
    { name: "Team", href: "/team", icon: Users },
    { name: "Analytics", href: "/analytics", icon: BarChart },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out border-r border-slate-800",
        isSidebarOpen ? "w-60" : "w-16 hidden md:flex"
      )}
    >
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="w-8 h-8 flex-shrink-0 bg-brand-500 rounded flex items-center justify-center font-bold text-white">
            N
          </div>
          {isSidebarOpen && <span className="font-semibold text-lg text-white">Nudge</span>}
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors",
                isActive ? "bg-slate-800 text-white" : "text-slate-400"
              )}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 h-5 w-5",
                  isSidebarOpen ? "mr-3" : "mr-0",
                  isActive ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300"
                )}
                aria-hidden="true"
              />
              {isSidebarOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors",
            pathname.startsWith("/settings") ? "bg-slate-800 text-white" : "text-slate-400"
          )}
        >
          <Settings
            className={cn(
              "flex-shrink-0 h-5 w-5",
              isSidebarOpen ? "mr-3" : "mr-0"
            )}
            aria-hidden="true"
          />
          {isSidebarOpen && <span>Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            "w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white text-slate-400 transition-colors"
          )}
        >
          <LogOut
            className={cn(
              "flex-shrink-0 h-5 w-5",
              isSidebarOpen ? "mr-3" : "mr-0"
            )}
            aria-hidden="true"
          />
          {isSidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

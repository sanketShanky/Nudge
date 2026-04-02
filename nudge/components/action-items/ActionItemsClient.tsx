"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2, Circle, AlertCircle, Send, Trash2, MoreHorizontal,
  Search, Filter, CalendarX2, ArrowUpDown, SlidersHorizontal, X
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PRIORITY_CONFIG: Record<string, { label: string; class: string; dot: string }> = {
  URGENT: { label: "Urgent", class: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  HIGH: { label: "High", class: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400" },
  MEDIUM: { label: "Medium", class: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-400" },
  LOW: { label: "Low", class: "bg-zinc-100 text-zinc-600 border-zinc-200", dot: "bg-zinc-400" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; class: string }> = {
  OPEN: { label: "Open", icon: Circle, class: "text-zinc-400" },
  IN_PROGRESS: { label: "In Progress", icon: AlertCircle, class: "text-blue-500" },
  DONE: { label: "Done", icon: CheckCircle2, class: "text-green-500" },
  CANCELLED: { label: "Cancelled", icon: Circle, class: "text-zinc-300" },
};

interface ActionItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  source: string | null;
  assignee: { id: string; name: string | null; email: string; avatarUrl: string | null } | null;
  meeting: { id: string; title: string; meetingDate: string } | null;
}

interface Props {
  items: ActionItem[];
  orgMembers: { id: string; name: string | null; email: string; avatarUrl: string | null }[];
  currentUserId: string;
}

export function ActionItemsClient({ items: initialItems, orgMembers, currentUserId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [items, setItems] = useState<ActionItem[]>(initialItems);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Local filter state
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "");

  const filtered = items.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (priorityFilter && item.priority !== priorityFilter) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.id)));
    }
  };

  const updateItem = async (id: string, patch: Partial<ActionItem>) => {
    setLoadingId(id);
    const res = await fetch(`/api/action-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { toast.error("Update failed"); setLoadingId(null); return; }
    const { item } = await res.json();
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...item } : i)));
    setLoadingId(null);
  };

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/action-items/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Delete failed"); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
    toast.success("Deleted");
  };

  const bulkUpdateStatus = async (status: string) => {
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => updateItem(id, { status } as any)));
    setSelected(new Set());
    toast.success(`${ids.length} items updated to ${status}`);
  };

  const nudgeItem = async (item: ActionItem) => {
    setLoadingId(`nudge-${item.id}`);
    const res = await fetch("/api/nudge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionItemId: item.id, channel: "BOTH" }),
    });
    if (!res.ok) {
      toast.error("Failed to send nudge");
    } else {
      toast.success(`Nudge sent to ${item.assignee?.name || item.assignee?.email || "assignee"}!`);
    }
    setLoadingId(null);
  };

  const summaryStats = {
    total: items.length,
    open: items.filter((i) => i.status === "OPEN").length,
    inProgress: items.filter((i) => i.status === "IN_PROGRESS").length,
    done: items.filter((i) => i.status === "DONE").length,
    overdue: items.filter((i) =>
      (i.status === "OPEN" || i.status === "IN_PROGRESS") &&
      i.dueDate && new Date(i.dueDate) < new Date()
    ).length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Action Items</h2>
          <p className="text-muted-foreground mt-1">Track and manage all commitments across your meetings.</p>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: summaryStats.total, color: "text-zinc-700" },
          { label: "Open", value: summaryStats.open, color: "text-zinc-600" },
          { label: "In Progress", value: summaryStats.inProgress, color: "text-blue-600" },
          { label: "Done", value: summaryStats.done, color: "text-green-600" },
          { label: "Overdue", value: summaryStats.overdue, color: "text-red-600" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-zinc-200 rounded-xl px-4 py-3 flex flex-col cursor-pointer hover:border-brand-300 transition-colors"
            onClick={() => setStatusFilter(
              s.label === "Open" ? "OPEN" :
              s.label === "In Progress" ? "IN_PROGRESS" :
              s.label === "Done" ? "DONE" : ""
            )}
          >
            <span className={cn("text-2xl font-bold", s.color)}>{s.value}</span>
            <span className="text-xs text-zinc-400 font-medium mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search action items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-white px-3 text-sm text-zinc-700"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-white px-3 text-sm text-zinc-700"
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {(statusFilter || priorityFilter || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 text-zinc-500 hover:text-zinc-700 gap-1.5"
            onClick={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); }}
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-1.5">
            <span className="text-sm font-semibold text-brand-700">{selected.size} selected</span>
            <Button size="sm" variant="ghost" className="h-7 text-green-700 hover:bg-green-50" onClick={() => bulkUpdateStatus("DONE")}>
              Mark done
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-blue-700 hover:bg-blue-50" onClick={() => bulkUpdateStatus("IN_PROGRESS")}>
              In Progress
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-zinc-500 hover:bg-zinc-100" onClick={() => setSelected(new Set())}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] md:grid-cols-[auto_1fr_140px_140px_110px_80px] items-center gap-4 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
          <input
            type="checkbox"
            className="rounded"
            checked={selected.size === filtered.length && filtered.length > 0}
            onChange={toggleAll}
          />
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Task</span>
          <span className="hidden md:block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Assignee</span>
          <span className="hidden md:block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Meeting</span>
          <span className="hidden md:block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Due Date</span>
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No action items found</p>
            <p className="text-sm mt-1">Try adjusting your filters or creating a new meeting.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map((item) => {
              const StatusIcon = STATUS_CONFIG[item.status]?.icon || Circle;
              const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() &&
                (item.status === "OPEN" || item.status === "IN_PROGRESS");
              const isSelected = selected.has(item.id);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto_auto_auto_auto] md:grid-cols-[auto_1fr_140px_140px_110px_80px] items-center gap-4 px-4 py-3.5 group hover:bg-zinc-50/70 transition-colors",
                    isSelected && "bg-brand-50/50",
                    item.status === "DONE" && "opacity-50"
                  )}
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                  />

                  {/* Task Info */}
                  <div className="min-w-0 flex items-start gap-3">
                    <button onClick={() => {
                      const order = ["OPEN", "IN_PROGRESS", "DONE"];
                      const next = order[(order.indexOf(item.status) + 1) % order.length];
                      updateItem(item.id, { status: next } as any);
                    }} className="mt-0.5 shrink-0">
                      <StatusIcon className={cn("h-4.5 w-4.5 h-[18px] w-[18px] shrink-0", STATUS_CONFIG[item.status]?.class)} />
                    </button>
                    <div className="min-w-0">
                      <p className={cn("font-medium text-zinc-900 text-sm truncate", item.status === "DONE" && "line-through text-zinc-400")}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
                          PRIORITY_CONFIG[item.priority]?.class,
                          "px-1.5 py-0.5 rounded border"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_CONFIG[item.priority]?.dot)} />
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="hidden md:flex items-center gap-2">
                    {item.assignee ? (
                      <>
                        <Avatar className="h-6 w-6 border border-zinc-200">
                          <AvatarImage src={item.assignee.avatarUrl || ""} />
                          <AvatarFallback className="text-[10px] bg-brand-100 text-brand-700">
                            {item.assignee.name?.charAt(0) || item.assignee.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-zinc-600 truncate">
                          {item.assignee.name || item.assignee.email.split("@")[0]}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-zinc-300 italic">Unassigned</span>
                    )}
                  </div>

                  {/* Meeting */}
                  <div className="hidden md:block">
                    {item.meeting ? (
                      <a
                        href={`/meetings/${item.meeting.id}`}
                        className="text-sm text-zinc-500 hover:text-brand-600 hover:underline truncate block max-w-[130px]"
                      >
                        {item.meeting.title}
                      </a>
                    ) : (
                      <span className="text-sm text-zinc-300">—</span>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="hidden md:block">
                    {item.dueDate ? (
                      <span className={cn(
                        "text-sm font-medium flex items-center gap-1.5",
                        isOverdue ? "text-red-500" : "text-zinc-500"
                      )}>
                        {isOverdue && <CalendarX2 className="h-3.5 w-3.5" />}
                        {format(new Date(item.dueDate), "MMM d")}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-300">No date</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.assignee && item.status !== "DONE" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-brand-500 hover:text-brand-600 hover:bg-brand-50"
                        onClick={() => nudgeItem(item)}
                        disabled={loadingId === `nudge-${item.id}`}
                        title="Send nudge"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => updateItem(item.id, { status: "DONE" } as any)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Mark done
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateItem(item.id, { status: "IN_PROGRESS" } as any)}>
                          <AlertCircle className="h-4 w-4 mr-2" /> In progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateItem(item.id, { status: "OPEN" } as any)}>
                          <Circle className="h-4 w-4 mr-2" /> Reopen
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400 text-center pb-4">
        Showing {filtered.length} of {items.length} items
      </p>
    </div>
  );
}

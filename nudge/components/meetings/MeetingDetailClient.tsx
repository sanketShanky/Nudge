"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Calendar, Clock, Users, FileText, CheckCircle2,
  Circle, AlertCircle, Loader2, Send, MoreHorizontal, Trash2,
  UserPlus, CalendarPlus, Flag,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Config ─────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  URGENT: { label: "Urgent", class: "bg-destructive/10 text-destructive border-destructive/20" },
  HIGH:   { label: "High",   class: "bg-orange-100 text-orange-700 border-orange-200" },
  MEDIUM: { label: "Medium", class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  LOW:    { label: "Low",    class: "bg-muted text-muted-foreground border-border" },
} as const;

const STATUS_CONFIG = {
  OPEN:        { label: "Open",        icon: Circle,       class: "text-muted-foreground" },
  IN_PROGRESS: { label: "In Progress", icon: AlertCircle,  class: "text-brand-500" },
  DONE:        { label: "Done",        icon: CheckCircle2, class: "text-green-500" },
  CANCELLED:   { label: "Cancelled",   icon: Circle,       class: "text-muted-foreground/40" },
} as const;

const PRIORITY_OPTIONS = [
  { value: "LOW",    label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH",   label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrgMember {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface ActionItem {
  id: string;
  title: string;
  status: keyof typeof STATUS_CONFIG;
  priority: keyof typeof PRIORITY_CONFIG;
  dueDate: string | null;
  source: string | null;
  assignee: OrgMember | null;
}

interface Meeting {
  id: string;
  title: string;
  meetingDate: string;
  duration: number | null;
  summary: string | null;
  transcript: string;
  status: string;
  createdBy: { name: string | null; email: string } | null;
  attendees: { id: string; name: string | null; email: string }[];
  actionItems: ActionItem[];
}

interface Props {
  meeting: Meeting;
  orgMembers: OrgMember[];
}

// ─── Inline action button (warning/caution style) ────────────────────────────

function InlineActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border",
        "border-yellow-300 bg-yellow-50 text-yellow-700",
        "hover:bg-yellow-100 hover:border-yellow-400 transition-colors"
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

// ─── Assign Owner Dropdown ────────────────────────────────────────────────────

function AssignOwnerDropdown({
  orgMembers,
  onSelect,
  isLoading,
}: {
  orgMembers: OrgMember[];
  onSelect: (member: OrgMember) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <InlineActionButton
        icon={isLoading ? Loader2 : UserPlus}
        label="Assign owner"
        onClick={() => !isLoading && setOpen((v) => !v)}
      />
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-52 bg-popover border border-border rounded-lg shadow-lg py-1 max-h-56 overflow-y-auto">
          {orgMembers.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No members found</p>
          ) : (
            orgMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { onSelect(m); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={m.avatarUrl || ""} />
                  <AvatarFallback className="text-[9px] bg-brand-100 text-brand-700 font-semibold">
                    {(m.name?.charAt(0) ?? m.email.charAt(0)).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-foreground">{m.name ?? m.email.split("@")[0]}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Set Due Date Picker ─────────────────────────────────────────────────────

function SetDueDateButton({
  onSelect,
  isLoading,
}: {
  onSelect: (date: string) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <InlineActionButton
        icon={isLoading ? Loader2 : CalendarPlus}
        label="Set due date"
        onClick={() => !isLoading && setOpen((v) => !v)}
      />
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Select a due date</p>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            className={cn(
              "text-sm border border-input rounded-md px-2 py-1.5 bg-background text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            )}
            onChange={(e) => {
              if (e.target.value) {
                onSelect(e.target.value + "T00:00:00Z");
                setOpen(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Set Priority Dropdown ────────────────────────────────────────────────────

function SetPriorityDropdown({
  onSelect,
  isLoading,
}: {
  onSelect: (priority: keyof typeof PRIORITY_CONFIG) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <InlineActionButton
        icon={isLoading ? Loader2 : Flag}
        label="Set priority"
        onClick={() => !isLoading && setOpen((v) => !v)}
      />
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-36 bg-popover border border-border rounded-lg shadow-lg py-1">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onSelect(opt.value); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  opt.value === "URGENT" && "bg-destructive",
                  opt.value === "HIGH"   && "bg-orange-500",
                  opt.value === "MEDIUM" && "bg-yellow-500",
                  opt.value === "LOW"    && "bg-muted-foreground"
                )}
              />
              <span className="text-foreground">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MeetingDetailClient({ meeting, orgMembers }: Props) {
  const [items, setItems] = useState<ActionItem[]>(meeting.actionItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const updateItem = async (id: string, patch: Record<string, unknown>) => {
    setLoadingId(id);
    const res = await fetch(`/api/action-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!res.ok) {
      toast.error("Failed to update item");
      setLoadingId(null);
      return;
    }

    const { item } = await res.json();
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...item } : i)));
    setLoadingId(null);
  };

  const assignOwner = (itemId: string, member: OrgMember) => {
    toast.promise(
      updateItem(itemId, { assigneeEmail: member.email, assigneeName: member.name }),
      { loading: "Assigning…", success: `Assigned to ${member.name ?? member.email.split("@")[0]}`, error: "Failed" }
    );
  };

  const setDueDate = (itemId: string, date: string) => {
    toast.promise(
      updateItem(itemId, { dueDate: date }),
      { loading: "Saving date…", success: "Due date set", error: "Failed" }
    );
  };

  const setPriority = (itemId: string, priority: keyof typeof PRIORITY_CONFIG) => {
    toast.promise(
      updateItem(itemId, { priority }),
      { loading: "Saving…", success: `Priority set to ${PRIORITY_CONFIG[priority].label}`, error: "Failed" }
    );
  };

  const cycleStatus = (item: ActionItem) => {
    const order: (keyof typeof STATUS_CONFIG)[] = ["OPEN", "IN_PROGRESS", "DONE"];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    toast.promise(
      updateItem(item.id, { status: next }),
      { loading: "Updating…", success: `Marked as ${next.replace("_", " ")}`, error: "Failed" }
    );
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
      toast.success(`Nudge sent to ${item.assignee?.name ?? item.assignee?.email ?? "assignee"}!`);
    }
    setLoadingId(null);
  };

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/action-items/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item deleted");
  };

  const openCount = items.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS").length;
  const doneCount = items.filter((i) => i.status === "DONE").length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Back */}
      <Link href="/meetings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> All Meetings
      </Link>

      {/* Hero Header */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3 flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate">
                {meeting.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(meeting.meetingDate), "MMMM d, yyyy")}
                </span>
                {meeting.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {meeting.duration} min
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {meeting.attendees.length} attendees
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right mr-2">
                <p className="text-sm font-semibold text-foreground">{doneCount}/{items.length}</p>
                <p className="text-xs text-muted-foreground">items done</p>
              </div>
              <div className="w-2 h-12 bg-muted rounded-full overflow-hidden">
                <div
                  className="w-full bg-green-500 rounded-full transition-all duration-700"
                  style={{ height: `${items.length ? (doneCount / items.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Attendee Avatars */}
          {meeting.attendees.length > 0 && (
            <div className="flex items-center gap-2 mt-5 pt-5 border-t border-border">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Attendees</span>
              <div className="flex -space-x-2 ml-2">
                {meeting.attendees.map((a, i) => (
                  <Avatar key={i} className="h-7 w-7 border-2 border-card ring-1 ring-border">
                    <AvatarFallback className="text-[10px] bg-brand-100 text-brand-700 font-semibold">
                      {a.name?.charAt(0) ?? a.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap ml-2">
                {meeting.attendees.map((a, i) => (
                  <span key={i} className="text-xs text-muted-foreground">
                    {a.name ?? a.email.split("@")[0]}{i < meeting.attendees.length - 1 ? "," : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {meeting.summary && (
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Summary</p>
              <p className="text-foreground text-sm leading-relaxed">{meeting.summary}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Action Items
            <span className="ml-2 text-sm text-muted-foreground font-normal">{openCount} open · {doneCount} done</span>
          </h3>
        </div>

        <div className="space-y-2">
          {items.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl text-muted-foreground">
              No action items extracted from this meeting.
            </div>
          )}

          {items.map((item) => {
            const StatusIcon = STATUS_CONFIG[item.status]?.icon ?? Circle;
            const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "DONE";
            const isLoadingItem = loadingId === item.id;

            const hasPriority  = !!item.priority;
            const hasDueDate   = !!item.dueDate;
            const hasAssignee  = !!item.assignee;

            return (
              <div
                key={item.id}
                className={cn(
                  "bg-card border rounded-xl p-5 flex items-start gap-4 group transition-all hover:shadow-sm",
                  item.status === "DONE" ? "border-border opacity-60" : "border-border",
                  isOverdue ? "border-destructive/30 bg-destructive/5" : ""
                )}
              >
                {/* Status Toggle */}
                <button
                  onClick={() => cycleStatus(item)}
                  disabled={isLoadingItem}
                  className="mt-0.5 shrink-0"
                >
                  {isLoadingItem ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <StatusIcon className={cn("h-5 w-5 transition-colors hover:scale-110", STATUS_CONFIG[item.status]?.class)} />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <p className={cn("font-medium text-foreground", item.status === "DONE" && "line-through text-muted-foreground")}>
                    {item.title}
                  </p>

                  {item.source && (
                    <p className="text-xs text-muted-foreground italic pl-3 border-l-2 border-border leading-relaxed">
                      &ldquo;{item.source}&rdquo;
                    </p>
                  )}

                  {/* Metadata row — shows real values or inline action buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">

                    {/* Priority */}
                    {hasPriority ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold uppercase tracking-wider",
                          PRIORITY_CONFIG[item.priority]?.class
                        )}
                      >
                        {PRIORITY_CONFIG[item.priority]?.label}
                      </Badge>
                    ) : item.status !== "DONE" && (
                      <SetPriorityDropdown
                        isLoading={isLoadingItem}
                        onSelect={(p) => setPriority(item.id, p)}
                      />
                    )}

                    {/* Due Date */}
                    {hasDueDate ? (
                      <span className={cn("text-xs font-medium flex items-center gap-1",
                        isOverdue ? "text-destructive" : "text-muted-foreground"
                      )}>
                        <Calendar className="h-3 w-3" />
                        {isOverdue ? "Overdue · " : ""}
                        {format(new Date(item.dueDate!), "MMM d")}
                      </span>
                    ) : item.status !== "DONE" && (
                      <SetDueDateButton
                        isLoading={isLoadingItem}
                        onSelect={(d) => setDueDate(item.id, d)}
                      />
                    )}

                    {/* Assignee */}
                    {hasAssignee ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={item.assignee!.avatarUrl ?? ""} />
                          <AvatarFallback className="text-[8px] bg-brand-100 text-brand-700">
                            {(item.assignee!.name?.charAt(0) ?? item.assignee!.email.charAt(0)).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {item.assignee!.name ?? item.assignee!.email.split("@")[0]}
                      </div>
                    ) : item.status !== "DONE" && (
                      <AssignOwnerDropdown
                        orgMembers={orgMembers}
                        isLoading={isLoadingItem}
                        onSelect={(m) => assignOwner(item.id, m)}
                      />
                    )}
                  </div>
                </div>

                {/* Quick actions (visible on hover) */}
                <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.assignee && item.status !== "DONE" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-brand-600 hover:text-brand-700 hover:bg-brand-50 gap-1.5"
                      onClick={() => nudgeItem(item)}
                      disabled={loadingId === `nudge-${item.id}`}
                    >
                      {loadingId === `nudge-${item.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Nudge
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => updateItem(item.id, { status: "DONE" })}>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Mark done
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateItem(item.id, { status: "IN_PROGRESS" })}>
                        <AlertCircle className="h-4 w-4 mr-2" /> In progress
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transcript Collapsible */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors"
        >
          <span className="flex items-center gap-2 font-medium text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" /> Full Transcript
          </span>
          <span className="text-xs text-muted-foreground">{showTranscript ? "Hide" : "Show"}</span>
        </button>
        {showTranscript && (
          <div className="px-6 pb-6 border-t border-border">
            <pre className="mt-4 text-sm text-foreground/70 whitespace-pre-wrap font-mono leading-relaxed bg-muted/50 rounded-lg p-4 max-h-[400px] overflow-auto">
              {meeting.transcript}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

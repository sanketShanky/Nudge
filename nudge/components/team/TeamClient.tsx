"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Trash2,
  Loader2,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { calculateAccountabilityScore } from "@/lib/utils/accountability-score";

interface Member {
  id: string;
  role: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    slackUserId: string | null;
    actionItems: { status: string; dueDate: string | null }[];
  };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Props {
  members: Member[];
  invites: Invite[];
  currentMemberId: string;
  currentRole: string;
  now: string;
}

export function TeamClient({ members: initialMembers, invites: initialInvites, currentMemberId, currentRole, now }: Props) {
  const router = useRouter();
  const nowDate = new Date(now);

  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [invites, setInvites] = useState<Invite[]>(initialInvites);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [inviting, setInviting] = useState(false);

  // Loading states
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const canManage = currentRole === "OWNER" || currentRole === "ADMIN";

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return toast.error("Email is required");
    setInviting(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInvites((prev) => [data.invite, ...prev]);
      toast.success(`Invite sent to ${inviteEmail}!`);
      setInviteEmail("");
      setInviteOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setLoadingId(inviteId);
    try {
      const res = await fetch(`/api/invites/${inviteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success("Invite revoked");
    } catch {
      toast.error("Failed to revoke invite");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the workspace? This cannot be undone.`)) return;
    setLoadingId(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success(`${memberName} removed`);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    } finally {
      setLoadingId(null);
    }
  };

  const handleChangeRole = async (memberId: string, role: string, memberName: string) => {
    setLoadingId(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: data.member.role } : m))
      );
      toast.success(`${memberName} is now ${role}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to change role");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team</h2>
          <p className="text-muted-foreground mt-1">
            Manage team members and accountability metrics.
          </p>
        </div>
        {canManage && (
          <Button
            className="bg-brand-600 hover:bg-brand-500 shadow-sm gap-2 h-10 px-5"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-4 w-4" /> Invite Member
          </Button>
        )}
      </div>

      {/* Members Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 border-b border-zinc-200">
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead>Accountability</TableHead>
              <TableHead>Action Items</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const u = member.user;
              if (!u) return null;

              const total = u.actionItems.length;
              const completed = u.actionItems.filter((i) => i.status === "DONE").length;
              const open = u.actionItems.filter(
                (i) => i.status === "OPEN" || i.status === "IN_PROGRESS"
              ).length;
              const overdue = u.actionItems.filter(
                (i) =>
                  (i.status === "OPEN" || i.status === "IN_PROGRESS") &&
                  i.dueDate &&
                  new Date(i.dueDate) < nowDate
              ).length;

              const score = calculateAccountabilityScore(total, completed);
              const isCurrentUser = member.id === currentMemberId;
              const isLoading = loadingId === member.id;

              return (
                <TableRow key={member.id} className="hover:bg-zinc-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-zinc-200">
                        <AvatarImage src={u.avatarUrl || ""} />
                        <AvatarFallback className="bg-brand-50 text-brand-700 font-semibold">
                          {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900">
                          {u.name || u.email.split("@")[0]}
                          {isCurrentUser && (
                            <span className="ml-2 text-[10px] font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-zinc-500">{u.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.role === "OWNER"
                          ? "default"
                          : member.role === "ADMIN"
                          ? "secondary"
                          : "outline"
                      }
                      className={member.role === "OWNER" ? "bg-brand-600" : ""}
                    >
                      {member.role === "OWNER" && (
                        <ShieldAlert className="w-3 h-3 mr-1" />
                      )}
                      {member.role === "ADMIN" && (
                        <ShieldCheck className="w-3 h-3 mr-1" />
                      )}
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </Badge>
                      {u.slackUserId && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 gap-1"
                        >
                          Slack
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
                      <div className="flex items-center justify-between text-sm font-semibold text-zinc-800">
                        <span>{score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            score >= 80
                              ? "bg-green-500"
                              : score >= 50
                              ? "bg-amber-400"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${Math.max(score, 5)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-zinc-700">{completed}</span>
                        <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider">
                          Done
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-blue-600">{open}</span>
                        <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider">
                          Open
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-semibold ${
                            overdue > 0 ? "text-red-500" : "text-zinc-400"
                          }`}
                        >
                          {overdue}
                        </span>
                        <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider">
                          Late
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {canManage && (
                    <TableCell className="text-right">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400 ml-auto" />
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-zinc-100"
                              disabled={member.role === "OWNER"}
                            >
                              <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            {currentRole === "OWNER" && member.role !== "OWNER" && (
                              <>
                                {member.role !== "ADMIN" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleChangeRole(member.id, "ADMIN", u.name || u.email)
                                    }
                                  >
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    Make Admin
                                  </DropdownMenuItem>
                                )}
                                {member.role !== "MEMBER" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleChangeRole(member.id, "MEMBER", u.name || u.email)
                                    }
                                  >
                                    Make Member
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {!isCurrentUser && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() =>
                                  handleRemoveMember(member.id, u.name || u.email)
                                }
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="pt-4">
          <h3 className="text-lg font-semibold tracking-tight mb-4">Pending Invites</h3>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50">
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sent</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{inv.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {format(new Date(inv.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          disabled={loadingId === inv.id}
                          onClick={async () => {
                            setLoadingId(inv.id);
                            const res = await fetch("/api/invites", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: inv.email, role: inv.role }),
                            });
                            setLoadingId(null);
                            if (res.ok) toast.success("Invite resent!");
                            else toast.error("Failed to resend");
                          }}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Resend
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          disabled={loadingId === inv.id}
                          onClick={() => handleRevokeInvite(inv.id)}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invite email to add someone to your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-brand-600 hover:bg-brand-500"
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" /> Send Invite
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

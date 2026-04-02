"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Building2,
  Bell,
  Link2,
  MessageSquare,
  Mail,
  AlertCircle,
  ExternalLink,
  Copy,
  Zap,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
  org: { id: string; name: string; slug: string; plan: string };
  slackConnected: boolean;
  googleConnected: boolean;
}

type Tab = "profile" | "workspace" | "notifications" | "integrations" | "billing";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "billing", label: "Plan & Billing", icon: Zap },
];

export function SettingsClient({ user, org, slackConnected: initialSlackConnected, googleConnected: initialGoogleConnected }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle tab from URL param and OAuth success/error
  const tabParam = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabParam || "profile");
  const [slackConnected, setSlackConnected] = useState(initialSlackConnected);
  const [googleConnected, setGoogleConnected] = useState(initialGoogleConnected);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "slack_connected") {
      setSlackConnected(true);
      setActiveTab("integrations");
      toast.success("Slack connected successfully!");
    } else if (success === "google_connected") {
      setGoogleConnected(true);
      setActiveTab("integrations");
      toast.success("Google Calendar connected!");
    } else if (error === "slack_denied") {
      toast.error("Slack connection was cancelled.");
    } else if (error === "slack_not_configured") {
      toast.error("Slack credentials are not configured. Add SLACK_CLIENT_ID to your .env.");
    } else if (error === "slack_token_failed") {
      toast.error("Failed to exchange Slack token. Check your SLACK_CLIENT_SECRET.");
    } else if (error === "google_denied") {
      toast.error("Google connection was cancelled.");
    } else if (error === "google_token_failed") {
      toast.error("Failed to connect Google. Check your GOOGLE_CLIENT_SECRET.");
    } else if (error === "google_not_configured") {
      toast.error("Google OAuth is not configured on the server.");
    } else if (error === "google_server_error") {
      toast.error("A server error occurred during Google sign-in.");
    }
  }, []);

  // Profile state
  const [name, setName] = useState(user.name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Workspace state
  const [orgName, setOrgName] = useState(org.name);
  const [orgSlug, setOrgSlug] = useState(org.slug);
  const [savingOrg, setSavingOrg] = useState(false);

  // Notification prefs (UI toggles only — extend to DB as needed)
  const [emailNudges, setEmailNudges] = useState(true);
  const [slackNudges, setSlackNudges] = useState(true);
  const [weeklyRecap, setWeeklyRecap] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);

  const handleSaveProfile = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Profile updated!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveOrg = async () => {
    setSavingOrg(true);
    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, slug: orgSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Workspace saved!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save workspace");
    } finally {
      setSavingOrg(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your account, workspace, and integrations.
        </p>
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* Sidebar Nav */}
        <nav className="lg:w-48 shrink-0">
          <ul className="space-y-1">
            {TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                    activeTab === tab.id
                      ? "bg-brand-50 text-brand-700 border border-brand-200"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1">
          {/* Profile */}
          {activeTab === "profile" && (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Your Profile</h3>
                <p className="text-sm text-zinc-500">Update your personal details.</p>
              </div>
              <Separator />
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 border-2 border-zinc-200">
                  <AvatarImage src={user.avatarUrl || ""} />
                  <AvatarFallback className="text-2xl bg-brand-100 text-brand-700 font-bold">
                    {name.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                  <p className="text-xs text-zinc-400 mt-1">JPG, PNG, or GIF. Max 2MB.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} disabled className="opacity-60" />
                  <p className="text-xs text-zinc-400">Email is managed by your auth provider.</p>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="bg-brand-600 hover:bg-brand-500"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Workspace */}
          {activeTab === "workspace" && (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Workspace Settings</h3>
                <p className="text-sm text-zinc-500">Manage your organization configuration.</p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Workspace Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400 whitespace-nowrap">nudge.app/</span>
                    <Input
                      value={orgSlug}
                      onChange={(e) =>
                        setOrgSlug(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Workspace ID
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-zinc-700 font-mono">{org.id}</code>
                  <button
                    className="text-zinc-400 hover:text-zinc-600 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(org.id);
                      toast.success("Copied!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <Button
                className="bg-brand-600 hover:bg-brand-500"
                onClick={handleSaveOrg}
                disabled={savingOrg}
              >
                {savingOrg ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>

              <Separator />

              <div>
                <h4 className="text-base font-semibold text-red-600 mb-2">Danger Zone</h4>
                <p className="text-sm text-zinc-500 mb-4">
                  These actions are permanent and cannot be undone.
                </p>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => toast.error("Please contact support to delete your workspace.")}
                >
                  Delete Workspace
                </Button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
                <p className="text-sm text-zinc-500">
                  Control when and how Nudge contacts you and your team.
                </p>
              </div>
              <Separator />

              <div className="space-y-5">
                {[
                  {
                    id: "emailNudges",
                    label: "Email Nudges",
                    description: "Send reminders via email when action items are overdue.",
                    get: emailNudges,
                    set: setEmailNudges,
                    icon: Mail,
                  },
                  {
                    id: "slackNudges",
                    label: "Slack Nudges",
                    description: "Post reminders to Slack threads automatically.",
                    get: slackNudges,
                    set: setSlackNudges,
                    icon: MessageSquare,
                  },
                  {
                    id: "weeklyRecap",
                    label: "Weekly Recap",
                    description: "Send a weekly digest of open items every Monday morning.",
                    get: weeklyRecap,
                    set: setWeeklyRecap,
                    icon: Mail,
                  },
                  {
                    id: "overdueAlerts",
                    label: "Overdue Alerts",
                    description: "Get notified immediately when an item becomes overdue.",
                    get: overdueAlerts,
                    set: setOverdueAlerts,
                    icon: AlertCircle,
                  },
                ].map((pref) => (
                  <div key={pref.id} className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                        <pref.icon className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 text-sm">{pref.label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{pref.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={pref.get}
                      onCheckedChange={(v) => {
                        pref.set(v);
                        toast.success(`${pref.label} ${v ? "enabled" : "disabled"}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeTab === "integrations" && (
            <div className="space-y-4">
              {/* Slack */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl border border-zinc-200 flex items-center justify-center bg-[#4A154B]">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-zinc-900">Slack</h4>
                        {slackConnected ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-zinc-400">
                            Not connected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        Send nudges and receive action item updates directly in Slack.
                      </p>
                    </div>
                  </div>
                  {slackConnected ? (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const res = await fetch("/api/organization", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({}),
                        });
                        // For disconnect we'd call a dedicated endpoint — show toast for now
                        toast.info(
                          "To disconnect Slack, revoke access in your Slack workspace settings."
                        );
                      }}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <a href="/api/slack/connect">
                      <Button className="bg-[#4A154B] hover:bg-[#611f69] text-white">
                        Connect Slack
                        <ExternalLink className="h-3.5 w-3.5 ml-2" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {/* Google Calendar */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl border border-zinc-200 flex items-center justify-center bg-white">
                      <svg className="h-6 w-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-zinc-900">Google Calendar</h4>
                        {googleConnected ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-zinc-400">Not connected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        Auto-import meeting transcripts from Google Meet recordings.
                      </p>
                    </div>
                  </div>
                  {googleConnected ? (
                    <Button
                      variant="outline"
                      onClick={() => toast.info("To disconnect Google, revoke access at myaccount.google.com/permissions.")}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <a href="/api/google/connect">
                      <Button variant="outline">
                        Connect <ExternalLink className="h-3.5 w-3.5 ml-2" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {/* Zoom */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl border border-zinc-200 flex items-center justify-center bg-[#2D8CFF]">
                      <span className="text-white font-bold text-sm">Z</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-zinc-900">Zoom</h4>
                        <Badge variant="outline" className="text-zinc-400">
                          Not connected
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        Receive Zoom webhooks to auto-process meeting recordings.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast.info(
                        "Zoom webhook — add ZOOM_WEBHOOK_SECRET_TOKEN to .env to enable"
                      )
                    }
                  >
                    Connect <ExternalLink className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Billing */}
          {activeTab === "billing" && (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Plan & Billing</h3>
                <p className="text-sm text-zinc-500">Manage your subscription and usage.</p>
              </div>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    name: "Free",
                    price: "$0/mo",
                    features: [
                      "3 meetings/month",
                      "5 team members",
                      "Email nudges",
                      "30-day history",
                    ],
                    current: org.plan === "FREE",
                  },
                  {
                    name: "Team",
                    price: "$29/mo",
                    features: [
                      "Unlimited meetings",
                      "25 team members",
                      "Slack + Email",
                      "Unlimited history",
                      "Analytics",
                    ],
                    current: org.plan === "TEAM",
                  },
                  {
                    name: "Business",
                    price: "$99/mo",
                    features: [
                      "Everything in Team",
                      "Unlimited members",
                      "Zoom integration",
                      "Priority support",
                      "Custom branding",
                    ],
                    current: org.plan === "BUSINESS",
                  },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className={cn(
                      "border rounded-xl p-5 relative",
                      plan.current
                        ? "border-brand-400 bg-brand-50/50 shadow-sm"
                        : "border-zinc-200"
                    )}
                  >
                    {plan.current && (
                      <span className="absolute -top-3 left-4 bg-brand-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Current Plan
                      </span>
                    )}
                    <h4 className="font-bold text-lg text-zinc-900">{plan.name}</h4>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">{plan.price}</p>
                    <ul className="space-y-2 mt-4">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!plan.current && (
                      <Button
                        className="w-full mt-5 bg-brand-600 hover:bg-brand-500"
                        onClick={() =>
                          toast.info(
                            "Stripe integration — add your STRIPE_SECRET_KEY to enable billing"
                          )
                        }
                      >
                        Upgrade to {plan.name}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

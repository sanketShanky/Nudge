"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  // Form State
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState("founder");
  const [invites, setInvites] = useState(["", "", ""]);

  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const finishStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName) return;
    toast.success("Workspace created!");
    setStep(2);
  };

  const finishStep2 = () => {
    setStep(3);
  };

  const finishOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Invites sent successfully!");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mb-12">
        <div className="flex items-center space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= i ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                }`}
              >
                {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
              </div>
              {i < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${step > i ? "bg-brand-600" : "bg-zinc-100 dark:bg-zinc-800"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Create your workspace</h2>
            <p className="text-muted-foreground mt-2">Let's set up a home for your team's action items.</p>
          </div>
          
          <form onSubmit={finishStep1} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  autoFocus
                />
                {slug && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Your URL will be: <span className="font-semibold text-foreground">nudge.com/{slug}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Your role</Label>
                <select 
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="founder">Founder / CEO</option>
                  <option value="engineering_manager">Engineering Manager</option>
                  <option value="operations">Operations</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <Button className="w-full bg-brand-600 hover:bg-brand-500 h-11" type="submit" disabled={!orgName}>
              Create workspace
            </Button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Connect Slack</h2>
            <p className="text-muted-foreground mt-2">
              Nudge uses Slack to send automated reminders and let your team update their action items directly in chat.
            </p>
          </div>
          
          <div className="flex flex-col space-y-4 items-center">
            <Button 
              className="w-full h-12 bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 shadow-sm"
              onClick={() => {
                toast.success("Slack connected (Mocked)!");
                finishStep2();
              }}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521h-6.312A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.522 2.521 2.527 2.527 0 0 1-2.522-2.521V2.522A2.527 2.527 0 0 1 15.166 0a2.528 2.528 0 0 1 2.522 2.522v6.312zM15.166 18.956a2.528 2.528 0 0 1 2.522 2.522A2.528 2.528 0 0 1 15.166 24a2.527 2.527 0 0 1-2.522-2.522v-2.522h2.522zM15.166 17.688a2.528 2.528 0 0 1-2.522-2.522 2.528 2.528 0 0 1 2.522-2.521h6.312A2.528 2.528 0 0 1 24 15.167a2.528 2.528 0 0 1-2.522 2.521h-6.312z" fill="#E01E5A"/>
              </svg>
              Connect Slack
            </Button>
            
            <button 
              onClick={finishStep2}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Invite your team</h2>
            <p className="text-muted-foreground mt-2">Nudge works best when everyone is accountable.</p>
          </div>
          
          <form onSubmit={finishOnboarding} className="space-y-6">
            <div className="space-y-3">
              {invites.map((invite, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={`coworker${index + 1}@example.com`}
                    value={invite}
                    onChange={(e) => {
                      const newInvites = [...invites];
                      newInvites[index] = e.target.value;
                      setInvites(newInvites);
                    }}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex flex-col space-y-4 items-center pt-2">
              <Button className="w-full bg-brand-600 hover:bg-brand-500 h-11" type="submit">
                Send invites & go to dashboard
              </Button>
              
              <button 
                type="button"
                onClick={() => router.push("/dashboard")}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Skip, I'll invite them later
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

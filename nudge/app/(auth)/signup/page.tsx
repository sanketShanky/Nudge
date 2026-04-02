"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        // Normally you use emailConfirmation, but for testing we might disable it or let Supabase auto-confirm if configured
      },
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    toast.success("Account created! Let's set up your workspace.");
    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Create your account</h2>
        <p className="text-muted-foreground mt-2">
          Already have an account? <Link href="/login" className="text-brand-600 hover:text-brand-500 font-medium">Log in</Link>
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Sarah Connor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-red-500">Add {8 - password.length} more characters</p>
            )}
            {password.length >= 8 && (
              <p className="text-xs text-green-600">Password looks good!</p>
            )}
          </div>
        </div>
        
        <Button className="w-full bg-brand-600 hover:bg-brand-500 h-11" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Create account
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground mt-8">
        By continuing, you agree to Nudge's Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

"use client";

import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const item = params.get("item") || "Your action item";
  const status = params.get("status") || "updated";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-12 max-w-md w-full text-center mx-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-3">Status Updated!</h1>
        <p className="text-zinc-600 leading-relaxed">
          <strong>"{item}"</strong> has been marked as{" "}
          <span className="font-semibold text-green-700">{status.replace("_", " ")}</span>.
        </p>
        <p className="text-zinc-400 text-sm mt-4">
          Your team has been notified of this update.
        </p>
        <Link href="/dashboard">
          <Button className="mt-8 bg-brand-600 hover:bg-brand-500 w-full">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function MagicLinkSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

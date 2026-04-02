"use client";

import { XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MagicLinkErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50">
      <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-12 max-w-md w-full text-center mx-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-3">
          Invalid or Expired Link
        </h1>
        <p className="text-zinc-600 leading-relaxed">
          This link is no longer valid. It may have already been used or has
          expired.
        </p>
        <p className="text-zinc-400 text-sm mt-4">
          Contact your team manager if you need to update your action item
          status.
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

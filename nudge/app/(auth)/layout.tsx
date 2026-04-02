import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-zinc-900 text-zinc-50 p-12 lg:p-24 relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-brand-600/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex items-center space-x-2">
          <div className="w-8 h-8 bg-brand-500 rounded-md flex items-center justify-center font-bold pb-0.5">N</div>
          <span className="text-xl font-bold tracking-tight">Nudge</span>
        </div>
        <div className="relative z-10 mt-20 max-w-md">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6">
            Never let an action item die again.
          </h1>
          <p className="text-zinc-400 text-lg mb-12">
            Extract, assign, and track commitments across all your meetings seamlessly.
          </p>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
              <p className="italic text-zinc-300 mb-4 font-medium leading-relaxed">
                "Nudge has completely transformed how our engineering team operates. We actually follow through on our sprint retrospectives now."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?img=1" alt="Avatar" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Sarah O.</p>
                  <p className="text-xs text-zinc-400">Engineering Manager</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
              <p className="italic text-zinc-300 mb-4 font-medium leading-relaxed">
                "It's like having a project manager sitting in every client meeting, telling people exactly what they need to do next."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?img=2" alt="Avatar" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Mark T.</p>
                  <p className="text-xs text-zinc-400">Founder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side form */}
      <div className="flex items-center justify-center p-8 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { calculateAccountabilityScore } from "@/lib/utils/accountability-score";
import Link from "next/link";
import { Trophy } from "lucide-react";

export function TeamScoreCard({ members }: { members: any[] }) {
  if (!members || members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Scoreboard</CardTitle>
        </CardHeader>
        <CardContent>No team members found.</CardContent>
      </Card>
    );
  }

  // Calculate scores and sort
  const scoredMembers = members.map((member) => {
    const actionItems = member.user?.actionItems || [];
    const total = actionItems.length;
    const completed = actionItems.filter((i: any) => i.status === "DONE").length;
    
    // An item completed on time if its dueDate was >= completedAt or if it's done...
    // For simplicity of dashboard display right now assuming all DONE are valid completions
    const score = calculateAccountabilityScore(total, completed);
    
    return {
      ...member,
      total,
      completed,
      score,
    };
  }).sort((a, b) => b.score - a.score);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Team Scoreboard
          </CardTitle>
          <Link href="/team" className="text-sm text-brand-600 hover:text-brand-500 font-medium">Full view</Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 mt-2">
          {scoredMembers.map((member, index) => {
            const user = member.user;
            if (!user) return null;
            
            return (
              <div key={member.id} className="relative group">
                {/* Ranking Number */}
                <div className="absolute -left-2 top-0 bottom-0 flex items-center">
                  <span className={`text-xs font-bold ${
                    index === 0 ? "text-amber-500 text-sm" : 
                    index === 1 ? "text-slate-400" : 
                    index === 2 ? "text-amber-700/60" : "text-zinc-200"
                  }`}>
                    #{index + 1}
                  </span>
                </div>
                
                <div className="ml-5 flex items-center justify-between group-hover:bg-zinc-50 p-2 -my-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-zinc-200 shadow-sm">
                      <AvatarImage src={user.avatarUrl} alt={user.name || "User"} />
                      <AvatarFallback className="bg-brand-50 text-brand-700 font-medium">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-900 leading-none">
                        {user.name || user.email.split('@')[0]}
                      </h4>
                      <div className="text-xs text-zinc-500 font-medium mt-1">
                        {member.completed} of {member.total} done
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-sm font-bold text-zinc-800">
                      {member.score}%
                    </div>
                    {/* Progress Bar */}
                    <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          member.score >= 80 ? "bg-green-500" :
                          member.score >= 50 ? "bg-amber-400" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.max(member.score, 5)}%` }} // At least show 5% so it's visible
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
        </div>
      </CardContent>
    </Card>
  );
}

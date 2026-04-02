"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, ClockAlert, Target, Video } from "lucide-react";

interface Props {
  totalOpen: number;
  totalOverdue: number;
  completionRate: number;
  meetingsThisMonth: number;
}

export function StatsRow({ totalOpen, totalOverdue, completionRate, meetingsThisMonth }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Open Items</CardTitle>
          <CheckSquare className="h-4 w-4 text-brand-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOpen}</div>
          <p className="text-xs text-muted-foreground pt-1">Total active commitments</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <ClockAlert className={`h-4 w-4 ${totalOverdue > 0 ? "text-red-500" : "text-green-500"}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOverdue}</div>
          <p className="text-xs text-muted-foreground pt-1">Action items past deadline</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <Target className="h-4 w-4 text-brand-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <p className="text-xs text-muted-foreground pt-1">Items finished this month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Meetings</CardTitle>
          <Video className="h-4 w-4 text-brand-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{meetingsThisMonth}</div>
          <p className="text-xs text-muted-foreground pt-1">Processed this month</p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDaysOverdue } from "@/lib/utils/date";
import { toast } from "sonner";
import { CalendarX2, Check, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function OverdueItems({ items }: { items: any[] }) {
  const [actingOn, setActingOn] = useState<string | null>(null);

  const handleNudge = async (id: string, title: string) => {
    setActingOn(`nudge-${id}`);
    // Simulate API call using mocked Slack
    setTimeout(() => {
      toast.success(`Nudge sent for "${title}"`);
      setActingOn(null);
    }, 600);
  };

  const handleDone = async (id: string, title: string) => {
    setActingOn(`done-${id}`);
    setTimeout(() => {
      toast.success(`"${title}" marked as done!`);
      setActingOn(null);
    }, 600);
  };

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overdue Action Items</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center text-center pb-8">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="font-medium text-lg text-zinc-900 mb-1">You're all caught up!</h3>
          <p className="text-zinc-500 max-w-sm">No action items are currently overdue in your organization. Great job team!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Overdue Action Items
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
              {items.length}
            </span>
          </CardTitle>
          <Link href="/action-items" className="text-sm text-brand-600 hover:text-brand-500 font-medium">View all</Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 border-b border-zinc-200">
                <TableHead className="w-[300px]">Item</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Meeting</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead className="text-right">Quick Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="group hover:bg-red-50/30">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[280px] text-zinc-900">{item.title}</span>
                      <span className={
                        item.priority === "URGENT" ? "text-xs font-bold text-red-600 uppercase tracking-tight mt-1" :
                        item.priority === "HIGH" ? "text-xs font-semibold text-orange-500 uppercase tracking-tight mt-1" :
                        "text-[10px] text-zinc-400 uppercase tracking-tight mt-1"
                      }>
                        {item.priority} Priority
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border-zinc-200 border">
                          <AvatarImage src={item.assignee.avatarUrl} alt={item.assignee.name || "User"} />
                          <AvatarFallback className="text-[10px] bg-brand-100 text-brand-800">
                            {item.assignee.name?.charAt(0) || item.assignee.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-zinc-600 max-w-[120px] truncate">{item.assignee.name || item.assignee.email.split('@')[0]}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-400 italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500 truncate max-w-[150px]">
                    <Link href={`/meetings/${item.meetingId}`} className="hover:text-brand-600 hover:underline">
                      {item.meeting?.title || "Unknown Meeting"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full w-fit">
                      <CalendarX2 className="w-3.5 h-3.5" />
                      {formatDaysOverdue(item.dueDate)}d
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-2 text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 border-none opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleNudge(item.id, item.title)}
                        disabled={actingOn !== null}
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" /> Nudge
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-2 text-green-700 hover:text-green-800 border-green-200 bg-green-50 hover:bg-green-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDone(item.id, item.title)}
                        disabled={actingOn !== null}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Done
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

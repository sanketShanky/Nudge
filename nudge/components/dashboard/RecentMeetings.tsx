"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "date-fns";
import { Users, FileText, Upload, Video } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RecentMeetings({ meetings }: { meetings: any[] }) {
  if (!meetings || meetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Meetings</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
            <Video className="h-8 w-8 text-brand-600" />
          </div>
          <h3 className="font-medium text-lg text-zinc-900 mb-1">No meetings yet</h3>
          <p className="text-zinc-500 max-w-sm">Process your first transcript or recording to extract action items instantly.</p>
          <Link href="/meetings/new" className="mt-6 text-brand-600 font-medium hover:underline">
            Import meeting →
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Meetings</CardTitle>
          <Link href="/meetings" className="text-sm text-brand-600 hover:text-brand-500 font-medium">View all</Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meetings.map((meeting) => {
            const openItems = meeting.actionItems.filter((i: any) => i.status === "OPEN" || i.status === "IN_PROGRESS").length;
            const totalItems = meeting.actionItems.length;

            return (
              <Link 
                key={meeting.id} 
                href={`/meetings/${meeting.id}`}
                className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                    {meeting.transcriptSource === "ZOOM" ? <Video className="h-5 w-5 text-blue-500" /> : 
                     meeting.transcriptSource === "AUDIO_UPLOAD" ? <Upload className="h-5 w-5 text-purple-500" /> : 
                     <FileText className="h-5 w-5 text-brand-500" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 group-hover:text-brand-700 transition-colors">{meeting.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <time>{formatRelative(new Date(meeting.meetingDate), new Date())}</time>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {meeting.attendees.length}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex -space-x-2 mr-2">
                    {meeting.attendees.slice(0, 3).map((a: any, i: number) => (
                      <Avatar key={i} className="border-2 border-white w-8 h-8">
                        <AvatarFallback className="text-xs bg-zinc-200">{a.name?.charAt(0) || a.email.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                    {meeting.attendees.length > 3 && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-zinc-100 text-[10px] font-medium text-zinc-600">
                        +{meeting.attendees.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={meeting.status === "READY" ? "secondary" : "outline"} className={
                      meeting.status === "READY" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""
                    }>
                      {meeting.status}
                    </Badge>
                    {(openItems > 0 || totalItems > 0) && (
                      <p className="text-xs text-zinc-500 font-medium mt-1">
                        {openItems} / {totalItems} items open
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

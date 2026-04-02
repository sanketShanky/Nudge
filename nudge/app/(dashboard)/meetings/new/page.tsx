"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, FileText, Sparkles, ArrowLeft, Upload, X, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type UploadMode = "paste" | "file";

export default function NewMeetingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>("paste");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0, 16));
  const [attendees, setAttendees] = useState<string[]>([""]);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileRead = (file: File) => {
    if (!file.name.match(/\.(txt|md|vtt|srt)$/i)) {
      toast.error("Please upload a .txt, .md, .vtt, or .srt file");
      return;
    }
    setFileName(file.name);
    // Auto-fill title from filename
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));

    const reader = new FileReader();
    reader.onload = (e) => setTranscript(e.target?.result as string);
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileRead(file);
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Meeting title is required"); return; }
    if (!transcript.trim()) { toast.error("Transcript is required"); return; }

    setIsLoading(true);
    const promise = fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        transcript: transcript.trim(),
        meetingDate,
        attendeeEmails: attendees.filter(Boolean),
        source: "MANUAL",
      }),
    });

    toast.promise(promise, {
      loading: "Extracting action items with AI…",
      success: async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        router.push(`/meetings/${data.meeting.id}`);
        return `Found ${data.meeting.actionItems.length} action items!`;
      },
      error: (err) => err.message || "Something went wrong",
    });

    try {
      const res = await promise;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/meetings/${data.meeting.id}`);
    } catch (_) {
      // handled by toast.promise
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <Link href="/meetings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Meetings
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">New Meeting</h2>
        <p className="text-muted-foreground mt-1">Paste or upload a transcript and we'll extract action items automatically.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meeting Info */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-base text-zinc-900">Meeting Details</h3>

          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              placeholder="Q2 Planning Kickoff"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date & Time</Label>
            <Input
              id="date"
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label>Attendee Emails</Label>
            <div className="space-y-2">
              {attendees.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={`attendee@example.com`}
                    value={email}
                    onChange={(e) => {
                      const next = [...attendees];
                      next[i] = e.target.value;
                      setAttendees(next);
                    }}
                    className="h-10"
                  />
                  {attendees.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-zinc-400 hover:text-red-500 shrink-0"
                      onClick={() => setAttendees(attendees.filter((_, j) => j !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-brand-600 hover:text-brand-700 hover:bg-brand-50 h-9 px-3 gap-1.5"
                onClick={() => setAttendees([...attendees, ""])}
              >
                <Plus className="h-3.5 w-3.5" /> Add attendee
              </Button>
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-base text-zinc-900">Transcript</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Paste text or drop a file (.txt, .md, .vtt, .srt)</p>
          </div>

          {/* Mode Tabs */}
          <div className="inline-flex rounded-lg border bg-zinc-50 p-1 gap-1">
            {(["paste", "file"] as UploadMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                  mode === m
                    ? "bg-white shadow-sm text-zinc-900 border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {m === "paste" ? <><FileText className="inline h-3.5 w-3.5 mr-1.5" />Paste</> : <><Upload className="inline h-3.5 w-3.5 mr-1.5" />Upload</>}
              </button>
            ))}
          </div>

          {mode === "paste" ? (
            <div className="space-y-2">
              <Textarea
                id="transcript"
                placeholder={`Alice: I'll send the revised proposal to the client by end of week.\nBob: I need to get the staging environment up before we can test.\nCharlie: Let's schedule a follow-up with the design team next Monday.`}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="min-h-[280px] font-mono text-sm leading-relaxed resize-y"
                required={mode === "paste"}
              />
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                AI will extract action items, priorities, and assignees automatically.
              </p>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => document.getElementById("file-input")?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all group",
                isDragOver ? "border-brand-400 bg-brand-50" : "border-zinc-200 hover:border-brand-300 hover:bg-brand-50/50"
              )}
            >
              <input
                id="file-input"
                type="file"
                accept=".txt,.md,.vtt,.srt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileRead(file);
                }}
              />
              {fileName ? (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-3 mx-auto">
                    <FileText className="h-6 w-6 text-brand-600" />
                  </div>
                  <p className="font-medium text-zinc-900">{fileName}</p>
                  <p className="text-sm text-zinc-400 mt-1">{transcript.length.toLocaleString()} characters loaded</p>
                  <Button type="button" variant="ghost" size="sm" className="mt-3 text-zinc-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setFileName(null); setTranscript(""); }}>
                    <X className="h-3.5 w-3.5 mr-1" /> Remove file
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl border-2 border-zinc-200 group-hover:border-brand-300 flex items-center justify-center mb-3 mx-auto transition-colors">
                    <Upload className="h-6 w-6 text-zinc-400 group-hover:text-brand-500 transition-colors" />
                  </div>
                  <p className="font-medium text-zinc-700">Drop your transcript here</p>
                  <p className="text-sm text-zinc-400 mt-1">or click to browse</p>
                  <p className="text-xs text-zinc-300 mt-3">.txt · .md · .vtt · .srt</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/meetings">
            <Button type="button" variant="outline" className="h-11 px-6">Cancel</Button>
          </Link>
          <Button
            type="submit"
            disabled={isLoading || !title || !transcript}
            className="h-11 px-8 bg-brand-600 hover:bg-brand-500 gap-2 shadow-sm"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Extracting…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Extract Action Items</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export interface ExtractedActionItem {
  title: string;
  description?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  dueDate?: string; // ISO 8601
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  source: string; // exact quote from transcript
}

export interface ExtractionResult {
  actionItems: ExtractedActionItem[];
  summary: string;
  meetingTitle?: string;
  estimatedDuration?: number;
}

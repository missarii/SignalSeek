export const VERSION = '0.1.0';

export const EVENT_TYPES = [
  "investigation.created","investigation.started","plan.created","plan.updated",
  "search.started","search.completed","source.discovered","source.retrieved",
  "source.extraction_failed","claim.extracted","evidence.evaluated",
  "contradiction.detected","research_gap.detected","report.generating",
  "report.completed","budget.warning","investigation.cancelled","investigation.failed",
  "investigation.completed"
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export interface InvestigationEvent {
  id: string; investigationId: string; type: EventType;
  timestamp: string; payload: Record<string, unknown>;
}
export type Role = "OWNER"|"ADMIN"|"ANALYST"|"VIEWER";
export type InvestigationStatus = "DRAFT"|"QUEUED"|"RUNNING"|"COMPLETED"|"FAILED"|"CANCELLED";
export type EvidenceStatus = "SUPPORTED"|"PARTIALLY_SUPPORTED"|"CONTRADICTED"|"INSUFFICIENT"|"NOT_EVALUATED";

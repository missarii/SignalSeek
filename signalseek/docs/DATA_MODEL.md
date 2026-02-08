# Data model

Source of truth: `prisma/schema.prisma`. Highlights:

- **Tenancy**: User → WorkspaceMember(role) → Workspace; every workspace-scoped query checks membership server-side.
- **Research**: Investigation → ResearchPlan, InvestigationRun, AgentCheckpoint, SearchQuery.
- **Evidence chain**: Source → SourceSnapshot(content,hash) → Passage(locator) → Evidence(quote,method,result) → ClaimEvidenceLink; Claim → Contradiction pairs.
- **Graph**: Entity(workspace,normalized unique) + EntityAlias; Relationship(from,to,type) + RelationshipEvidence — every edge inspectable to its quote.
- **Outputs**: Report → ReportVersion + Citation(key,url,sourceId,excerpt).
- **Monitoring**: Monitor → MonitorSnapshot(claimHash,claims) + ScheduledRun; Alert.
- **Ops**: Integration(kind,provider,status,config), UsageRecord, AuditLog, RefreshToken(hash,rotation), InvestigationEvent(persisted SSE log).
- UUIDs, createdAt/updatedAt, explicit cascades, indexes on hot filters, JSON only for genuinely variable metadata, bounded snapshots (60k chars) — not full docs in hot rows.

# Data model

Source of truth: `prisma/schema.prisma`. Highlights:

- **Tenancy**: User → WorkspaceMember(role) → Workspace; every workspace-scoped query checks membership server-side.

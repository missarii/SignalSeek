import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@signalseek.local';
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: 'Demo Analyst', passwordHash: await argon2.hash('demo-password-123', { type: argon2.argon2id }) },
    });
  }
  let ws = await prisma.workspace.findFirst({ where: { name: 'Demo workspace' } });
  if (!ws) {
    ws = await prisma.workspace.create({ data: { name: 'Demo workspace' } });
    await prisma.workspaceMember.create({ data: { workspaceId: ws.id, userId: user.id, role: 'OWNER' } });
  }
  const invCount = await prisma.investigation.count({ where: { workspaceId: ws.id } });
  if (invCount === 0) {
    const inv = await prisma.investigation.create({
      data: { workspaceId: ws.id, question: 'What is the adoption of open RAN among European telecom operators?',
        description: 'Seeded demonstration investigation (labeled demo content).',
        status: 'COMPLETED', createdById: user.id },
    });
    await prisma.researchPlan.create({
      data: { investigationId: inv.id, objective: `Answer: ${inv.question}`,
        subquestions: ['current state?', 'figures and scopes?', 'disagreements?'],
        searchQueries: [inv.question], sourceCategories: ['web', 'dataset'] },
    });
    const s1 = await prisma.source.create({
      data: { investigationId: inv.id, workspaceId: ws.id, url: 'https://demo.signalseek.local/briefing/1/overview',
        canonicalUrl: 'https://demo.signalseek.local/briefing/1/overview',
        title: 'Demo briefing overview', snippet: 'Demonstration content.', provider: 'mock', contentHash: 'demo1' },
    });
    const s2 = await prisma.source.create({
      data: { investigationId: inv.id, workspaceId: ws.id, url: 'https://demo.signalseek.local/dataset/2/figures',
        canonicalUrl: 'https://demo.signalseek.local/dataset/2/figures',
        title: 'Demo dataset figures', snippet: 'Demonstration content.', provider: 'mock', contentHash: 'demo2' },
    });
    for (const [s, txt] of [[s1, 'Adoption of open RAN reached 41% globally in 2024.'], [s2, 'Adoption of open RAN reached 27% among EU enterprises in 2024.']] as const) {
      const p = await prisma.passage.create({ data: { sourceId: s.id, text: txt, locator: 'chunk-1' } });
      const ev = await prisma.evidence.create({ data: { passageId: p.id, quote: txt, method: 'seed', result: 'SUPPORTED' } });
      const cl = await prisma.claim.create({ data: { investigationId: inv.id, text: txt, status: 'SUPPORTED' } });
      await prisma.claimEvidenceLink.create({ data: { claimId: cl.id, evidenceId: ev.id, relation: 'supports' } });
    }
    await prisma.contradiction.create({
      data: { investigationId: inv.id,
        claimA: 'Adoption of open RAN reached 41% globally in 2024.',
        claimB: 'Adoption of open RAN reached 27% among EU enterprises in 2024.',
        kind: 'different-scope',
        explanation: 'Different geographic scopes (global vs EU enterprises); neither auto-preferred.' },
    });
    const e1 = await prisma.entity.upsert({
      where: { workspaceId_normalized: { workspaceId: ws.id, normalized: 'open ran' } },
      create: { workspaceId: ws.id, name: 'Open RAN', normalized: 'open ran', type: 'Technology' },
      update: {},
    });
    const e2 = await prisma.entity.upsert({
      where: { workspaceId_normalized: { workspaceId: ws.id, normalized: 'european telecom operators' } },
      create: { workspaceId: ws.id, name: 'European telecom operators', normalized: 'european telecom operators', type: 'Organization' },
      update: {},
    });
    const rel = await prisma.relationship.create({ data: { fromId: e1.id, toId: e2.id, type: 'ADOPTED_BY' } });
    const firstEv = await prisma.evidence.findFirst({ where: { passage: { sourceId: s1.id } } });
    if (firstEv) await prisma.relationshipEvidence.create({ data: { relationshipId: rel.id, evidenceId: firstEv.id } });
    const md = `# Intelligence Report (Demo)\n\n**Research question:** ${inv.question}\n\n## Key findings\n- Adoption of open RAN reached 41% globally in 2024. [S1]\n- Adoption of open RAN reached 27% among EU enterprises in 2024. [S2]\n\n## Conflicting claims\n- CONFLICT (different-scope): global 41% vs EU 27%. Scopes differ; neither auto-preferred.\n\n## References and retrieval dates\n- [S1] https://demo.signalseek.local/briefing/1/overview\n- [S2] https://demo.signalseek.local/dataset/2/figures\n`;
    const rep = await prisma.report.create({ data: { workspaceId: ws.id, investigationId: inv.id, title: `Report: ${inv.question.slice(0, 80)}`, markdown: md } });
    await prisma.reportVersion.create({ data: { reportId: rep.id, version: 1, markdown: md } });
    await prisma.citation.create({ data: { reportId: rep.id, key: 'S1', url: s1.canonicalUrl, sourceId: s1.id, excerpt: 'Adoption ... 41% globally' } });
    await prisma.citation.create({ data: { reportId: rep.id, key: 'S2', url: s2.canonicalUrl, sourceId: s2.id, excerpt: 'Adoption ... 27% EU' } });
    const mon = await prisma.monitor.create({ data: { workspaceId: ws.id, topic: 'Open RAN adoption', query: 'open RAN adoption Europe', schedule: 'weekly' } });
    await prisma.monitorSnapshot.create({ data: { monitorId: mon.id, claimHash: 'demo-hash-1', claims: ['41% global', '27% EU'] } });
    await prisma.alert.create({ data: { workspaceId: ws.id, monitorId: mon.id, title: 'Demo alert: baseline established', detail: 'Seeded demonstration alert.' } });
    console.log('seeded demo workspace');
  }
}

main().finally(() => prisma.$disconnect());

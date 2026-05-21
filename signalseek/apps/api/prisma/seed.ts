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

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

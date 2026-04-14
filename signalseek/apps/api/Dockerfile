FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate --schema=./prisma/schema.prisma || true
RUN npm run build
CMD ["sh","-c","npx prisma migrate deploy --schema=./prisma/schema.prisma; node dist/main"]

FROM node:18-alpine AS base

WORKDIR /app

FROM base AS deps
COPY package*.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS production
RUN corepack enable pnpm
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --prod
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3001

CMD ["npm", "run", "start:prod"]

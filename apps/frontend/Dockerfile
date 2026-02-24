FROM node:18-alpine AS base

WORKDIR /app

FROM base AS deps
COPY package*.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM python:3.11-slim AS python-builder
WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r /app/scripts/requirements.txt

RUN python /app/scripts/export_and_quantize.py

FROM node:22 AS node-builder
WORKDIR /app

ARG POSTGRES_PRISMA_URL="postgres://newbee@host.docker.internal:5432/aix"
ARG JWT_SECRET="your-secret"
ARG JWT_EXPIRES_IN="86400"
ARG REFRESH_EXPIRES_IN="2592000"
ARG REFRESH_ROTATE_BEFORE="1296000"

ENV POSTGRES_PRISMA_URL=${POSTGRES_PRISMA_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
ENV REFRESH_EXPIRES_IN=${REFRESH_EXPIRES_IN}
ENV REFRESH_ROTATE_BEFORE=${REFRESH_ROTATE_BEFORE}

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

COPY . .

COPY --from=python-builder /public/models /app/models

RUN pnpm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate


COPY --from=node-builder /app/package.json ./
COPY --from=node-builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=node-builder /app/models ./models
COPY --from=node-builder /app/.next ./.next
COPY --from=node-builder /app/public ./public

RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000
CMD ["pnpm", "start"]


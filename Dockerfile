# syntax=docker/dockerfile:1

FROM node:22.23.4-bookworm-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate
WORKDIR /app

FROM base AS deps
RUN --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
    --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch --store-dir /pnpm/store && rm -rf node_modules

FROM deps AS web-build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY domain/package.json domain/
COPY service/package.json service/
COPY store/package.json store/
COPY trpc/package.json trpc/
COPY tools/package.json tools/
COPY web/package.json web/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --ignore-scripts --store-dir /pnpm/store --filter @wizard/web...
COPY domain/tsconfig.json domain/
COPY domain/src domain/src
COPY web/tsconfig.json web/index.html web/vite.config.ts web/
COPY web/src web/src
ARG VITE_CLERK_PUBLISHABLE_KEY
RUN pnpm --filter @wizard/web build

FROM deps AS api
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY domain/package.json domain/
COPY service/package.json service/
COPY store/package.json store/
COPY trpc/package.json trpc/
COPY tools/package.json tools/
COPY web/package.json web/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --prod --offline --frozen-lockfile --ignore-scripts --store-dir /pnpm/store --filter @wizard/trpc...
COPY domain/src domain/src
COPY store/src store/src
COPY service/src service/src
COPY trpc/src trpc/src
USER node
ENV NODE_ENV=production
EXPOSE 3000
# Not `pnpm deploy`: it puts workspace packages under node_modules, where Node refuses to strip types.
CMD ["node", "--experimental-strip-types", "trpc/src/server.ts"]

FROM nginxinc/nginx-unprivileged:1.30.6-alpine AS web
COPY --link docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --link --from=web-build /app/web/dist /usr/share/nginx/html
EXPOSE 8080

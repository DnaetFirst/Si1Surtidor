FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @surtidor/api --include-workspace-root=false
COPY apps/api apps/api
COPY scripts/clean-api-build.mjs scripts/clean-api-build.mjs
RUN npm run build -w @surtidor/api

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --workspace @surtidor/api --include-workspace-root=false && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
USER node
EXPOSE 3000
CMD ["sh", "-c", "node apps/api/dist/infrastructure/database/cli.js migrate && node apps/api/dist/infrastructure/database/cli.js seed && node apps/api/dist/main.js"]

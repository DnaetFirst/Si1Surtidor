FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY apps apps
COPY scripts/clean-api-build.mjs scripts/clean-api-build.mjs
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=10000
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends apache2 ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && a2enmod proxy proxy_http headers \
    && a2dissite 000-default \
    && sed -i 's/www-data/node/g' /etc/apache2/envvars \
    && printf 'Listen ${APACHE_HTTP_PORT}\n' > /etc/apache2/ports.conf \
    && mkdir -p /var/run/apache2 /var/lock/apache2 \
    && chown -R node:node /var/run/apache2 /var/lock/apache2 /var/log/apache2
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --workspace @surtidor/api --include-workspace-root=false && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/web/dist /var/www/html/
COPY infrastructure/demo-apache.conf /etc/apache2/sites-enabled/surtidor.conf
COPY scripts/start-demo.mjs scripts/start-demo.mjs
USER node
EXPOSE 10000
CMD ["node", "scripts/start-demo.mjs"]

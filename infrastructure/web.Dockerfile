FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @surtidor/web --include-workspace-root=false
COPY apps/web apps/web
RUN npm run build -w @surtidor/web
FROM httpd:2.4-alpine
ENV API_UPSTREAM=http://api:3000
RUN sed -i 's/#LoadModule proxy_module/LoadModule proxy_module/; s/#LoadModule proxy_http_module/LoadModule proxy_http_module/; s/#LoadModule rewrite_module/LoadModule rewrite_module/; s/#LoadModule headers_module/LoadModule headers_module/' /usr/local/apache2/conf/httpd.conf
COPY infrastructure/apache.conf /usr/local/apache2/conf/extra/surtidor.conf
RUN echo 'Include conf/extra/surtidor.conf' >> /usr/local/apache2/conf/httpd.conf
COPY --from=build /app/apps/web/dist /usr/local/apache2/htdocs/

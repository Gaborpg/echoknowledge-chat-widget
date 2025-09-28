# syntax=docker/dockerfile:1.7

# ---- Build ----
FROM node:20-alpine AS build
WORKDIR /app
ENV NG_CLI_ANALYTICS=false npm_config_audit=false npm_config_fund=false npm_config_loglevel=warn
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN --mount=type=cache,target=/root/.cache/angular \
    npx -y ng build EchoKnowledgeChatWidget --configuration production

# ---- Serve ----
FROM nginx:alpine

# Non-root nginx needs writable runtime dirs
RUN adduser -D -H -u 10001 webuser \
 && mkdir -p /run /run/nginx /var/cache/nginx /var/log/nginx \
 && chown -R webuser:webuser /run /var/cache/nginx /var/log/nginx /usr/share/nginx

# SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the actual Angular output
COPY --from=build /app/dist/EchoKnowledgeChatWidget/browser /usr/share/nginx/html

EXPOSE 80
USER webuser
STOPSIGNAL SIGTERM
CMD ["nginx", "-g", "daemon off;"]

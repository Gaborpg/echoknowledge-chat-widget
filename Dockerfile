# syntax=docker/dockerfile:1.7

# ---- Build (Angular embed) ----
FROM node:20-alpine AS build
WORKDIR /app
ENV NG_CLI_ANALYTICS=false \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_loglevel=warn

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .

# Build the EMBED bundle (stable main.js)
RUN --mount=type=cache,target=/root/.cache/angular \
    npx -y ng build EchoKnowledgeChatWidget -c embed

# Sanity checks
RUN test -f dist/EchoKnowledgeChatWidget/browser/main.js

# Emit Chatbase-style loader at /embed.js
RUN set -eux; d=dist/EchoKnowledgeChatWidget/browser; \
  cat > "$d/embed.js" <<'JS'
(function(){const d=document,s=d.currentScript;const base=(s.dataset.base||'').replace(/\/$/,'');if(!base){console.error('[EchoWidget] data-base is required');return}let el=d.querySelector('echo-knowledge-chat-widget');if(!el){el=d.createElement('echo-knowledge-chat-widget');d.body.appendChild(el)}const A={'bot-id':s.dataset.botId||'default','mode':s.dataset.mode||'popup','side':s.dataset.side||'auto','top':s.dataset.top||'10','right':s.dataset.right||'24','width':s.dataset.width||'406px','height':s.dataset.height||'85%','close':s.dataset.close||'outside','primary':s.dataset.primary||'','auto-open':s.dataset.autoOpen||'false'};for(const[k,v]of Object.entries(A))if(v!=null)el.setAttribute(k,String(v));const css=d.createElement('link');css.rel='stylesheet';css.href=base+'/styles.css';d.head.appendChild(css);const poly=base+'/polyfills.js',main=base+'/main.js';fetch(poly,{method:'HEAD',mode:'cors'}).then(r=>r.ok?import(poly):null).finally(()=>import(main));})();
JS
RUN test -f dist/EchoKnowledgeChatWidget/browser/embed.js

# ---- Serve (nginx, non-root) ----
FROM nginx:alpine

# Create a non-root user and writable cache/log dirs
RUN adduser -D -H -u 10001 webuser \
 && mkdir -p /var/cache/nginx /var/log/nginx \
 && chown -R webuser:webuser /var/cache/nginx /var/log/nginx /usr/share/nginx

# Replace the MAIN nginx.conf (no 'user' directive, pid to /tmp)
COPY nginx.main.conf /etc/nginx/nginx.conf

# Site/server config (CORS + SPA)
COPY nginx.site.conf /etc/nginx/conf.d/default.conf

# Static files
COPY --from=build /app/dist/EchoKnowledgeChatWidget/browser /usr/share/nginx/html

EXPOSE 80
USER webuser
STOPSIGNAL SIGTERM
# Only 'daemon off;' here. 'pid' is already set in nginx.main.conf
CMD ["nginx", "-g", "daemon off;"]

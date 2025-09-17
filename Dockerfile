FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist/EchoKnowledgeChatWidget/browser /usr/share/nginx/html
# If the widget needs to call the backend directly, you can reuse the same nginx.conf proxy approach.
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
# Produces: dist/ folder with static HTML/CSS/JS

# ── Stage 2: Serve with Nginx ─────────────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for React Router (SPA routing)
RUN cat > /etc/nginx/conf.d/default.conf << 'NGINX'
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    # All routes fall back to index.html — required for React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy GraphQL to api-gateway
    location /graphql {
        proxy_pass http://api-gateway:8080/graphql;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
NGINX

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

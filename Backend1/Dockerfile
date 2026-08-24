# =======================
# Builder Stage
# =======================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .

# =======================
# Development Stage
# =======================
FROM builder AS dev

WORKDIR /app

EXPOSE 8080
CMD ["npm", "run", "dev"]

# =======================
# Production Stage
# =======================
FROM node:20-alpine AS prod

WORKDIR /app

RUN npm install -g pm2
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/src ./src

ENV NODE_ENV=production
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD node -e "require('http').get('http://127.0.0.1:8080/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]

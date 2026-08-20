# =======================
# Builder Stage
# =======================
FROM node:20-alpine AS builder

WORKDIR /app

# install build deps
COPY package*.json tsconfig*.json ./
RUN npm ci --production=false

# copy source and build
COPY . .
RUN npm run build   # expects a build script that compiles into ./dist

# =======================
# Development Stage (added)
# =======================
FROM builder AS dev

WORKDIR /app

# For dev, we want the source + node_modules available and to run dev script.
# We reuse everything from builder (node_modules and source are already there).
EXPOSE 8080
CMD ["npm", "run", "dev"]

# =======================
# Production Stage
# =======================
FROM node:20-alpine AS prod

WORKDIR /app

# Install only pm2 (runtime) + production deps
RUN npm install -g pm2
COPY package*.json ./
RUN npm ci --only=production

# copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/config/AuthKey.p8 ./AuthKey.p8

# copy pm2 ecosystem if present
COPY ecosystem.config.js ./

ENV NODE_ENV=production
EXPOSE 8080

CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]

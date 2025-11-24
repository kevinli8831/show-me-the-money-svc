# Dockerfile —— 專為 dist/src/main.js 而設
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@latest && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Production
FROM node:20-alpine
WORKDIR /app
# 直接 copy 晒 builder 嘅全部，唔使理結構
COPY --from=builder /app ./

EXPOSE 3000
CMD ["node", "dist/src/main.js"]  
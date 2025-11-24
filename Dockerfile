# Dockerfile（最終完美版，100% work）
FROM node:20-alpine AS builder
WORKDIR /app

# 先 copy 兩個 lock 檔（讓 Docker cache install）
COPY package.json pnpm-lock.yaml ./

# 安裝 pnpm + 依賴
RUN npm install -g pnpm@latest && \
    pnpm install --frozen-lockfile

# 之後先 copy 全部 source code
COPY . .

# build
RUN pnpm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/main"]
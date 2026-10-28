# XY俱乐部官网模板 · 生产镜像
#
# 特点：
#   - 只装运行依赖（express 一个），镜像小
#   - 非 root 运行
#   - 数据（db.json / 会话 / 上传图）全部落在挂载卷里，容器删了数据还在
#
# 用法：
#   docker build -t xy-club .
#   docker run -d -p 3000:3000 -e ADMIN_PASSWORD='换成你的强密码' \
#     -v xy-data:/app/data -v xy-uploads:/app/public/uploads --name xy-club xy-club
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# 先只拷依赖清单，利用镜像层缓存：改代码不会重装依赖
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# 数据目录必须存在且可写；node 用户是官方镜像自带的非 root 用户
RUN mkdir -p /app/data /app/public/uploads && chown -R node:node /app/data /app/public/uploads /app

USER node
EXPOSE 3000

VOLUME ["/app/data", "/app/public/uploads"]

# 探活走 /api/health（不依赖 curl，镜像里不带它）
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

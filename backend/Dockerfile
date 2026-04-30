# Node.js 后端服务 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY server.js ./

# 暴露端口
EXPOSE 8080

# 启动服务
CMD ["node", "server.js"]

# 奖项管理系统后端

用于处理 OA Pages 用户身份认证和权限管理的后端服务。

## 功能

- 获取当前登录用户的 OA Pages 身份
- 权限检查和白名单管理
- CORS 支持，适配 OA Pages 前端

## 部署到 Cloud Studio

### 方法一：直接从 Cloud Studio 部署

1. 打开 Cloud Studio (cloud.studio.woa.com)
2. 创建新工作空间，选择「从代码仓库导入」
3. 导入工蜂仓库: `https://git.woa.com/your-username/award-system-backend`
4. Cloud Studio 会自动识别 Node.js 项目
5. 点击「部署」

### 方法二：使用 Docker 部署

```bash
# 构建镜像
docker build -t award-system-backend .

# 运行容器
docker run -d -p 8080:8080 --name award-backend award-system-backend
```

### 方法三：直接运行

```bash
npm install
npm start
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/current-user` | GET | 获取当前登录用户 |
| `/api/check-access` | GET | 检查用户权限 |
| `/api/admin/whitelist` | GET | 获取白名单（需管理员） |
| `/api/admin/whitelist` | POST | 更新白名单（需管理员） |
| `/api/admin/whitelist/add` | POST | 添加白名单用户（需管理员） |
| `/api/admin/whitelist/:username` | DELETE | 删除白名单用户（需管理员） |

## 管理员操作

添加管理员 Header:
```
X-Admin-Token: award-system-admin-secret-key-2024
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 8080 | 服务端口 |
| NODE_ENV | production | 运行环境 |

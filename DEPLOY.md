# 奖项管理系统 - 部署指南

## 项目结构

```
├── app/              # 主站（主入口）
├── level1-site/      # Level 1 - 普通员工提交流道
├── level2-site/      # Level 2 - 部门确认站点
├── level3-site/      # Level 3 - 最终审批站点
└── backend/          # 后端 API 服务（Node.js + Express）
```

## 部署步骤

### 1. 创建 GitHub 仓库

1. 访问 https://github.com/new 创建新仓库
2. 仓库名称：`award-management-system`
3. 不要勾选 "Initialize this repository with a README"

### 2. 推送代码到 GitHub

```bash
# 添加远程仓库（替换为您的 GitHub 仓库地址）
git remote add origin https://github.com/您的用户名/award-management-system.git

# 推送代码
git push -u origin main
```

### 3. 部署后端（Vercel）

1. 访问 https://vercel.com 并登录
2. 点击 "Add New..." → "Project"
3. 导入您的 GitHub 仓库
4. 选择 `backend` 目录作为 Root Directory
5. 点击 "Deploy"

部署完成后，Vercel 会提供后端 URL，例如：`https://your-backend.vercel.app`

### 4. 更新前端 API 地址

部署后端后，需要更新所有前端的 API 地址：

编辑以下文件，将 `https://award-backend.pages.woa.com` 替换为您的 Vercel 后端地址：

- `level1-site/src/services/api.ts`
- `level2-site/src/services/api.ts`
- `level3-site/src/services/api.ts`

同时更新 `level2-site/src/pages/AdminPage.tsx`、`level2-site/src/pages/HistoryPage.tsx`、`level3-site/src/pages/AdminPage.tsx`、`level3-site/src/pages/HistoryPage.tsx`、`level1-site/src/pages/HistoryPage.tsx` 中的 API 地址。

### 5. 部署前端

前端可以部署到 OA Pages：

1. 将 `app`、`level1-site`、`level2-site`、`level3-site` 分别部署
2. 或使用 Vercel/其他平台部署

## API 端点

部署后端后，以下端点可用：

- `GET /api/applications` - 获取申请列表
- `POST /api/applications` - 提交申请
- `GET /api/my-applications?employeeId=xxx` - 获取我的申请
- `PUT /api/level2/confirm/:id` - 部门确认
- `PUT /api/level3/finalize/:id` - 最终审批
- `PUT /api/reject/:id` - 驳回申请
- `GET /api/knowledge` - 获取知识库
- `GET /api/check-access` - 权限检查

## 环境变量（如需）

Vercel 部署时不需要特殊环境变量（使用内存存储）。

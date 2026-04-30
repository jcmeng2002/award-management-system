# 奖项管理系统部署指南

## Vercel 部署

### 后端
- **URL**: https://backend-olm05emkg-jcmeng2002s-projects.vercel.app
- **数据库**: MongoDB Atlas (已连接)
- **CORS**: 支持所有 vercel.app 和 pages.woa.com 域名

### 前端站点
| 站点 | URL |
|------|-----|
| Level 1 | https://level1-site-m6ne01dd2-jcmeng2002s-projects.vercel.app |
| Level 2 | https://level2-site-p4lvjah82-jcmeng2002s-projects.vercel.app |
| Level 3 | https://level3-site-2u04x3bpl-jcmeng2002s-projects.vercel.app |

### OA Pages 部署 (旧)
| 站点 | URL |
|------|-----|
| Level 1 | https://award-level1.pages.woa.com |
| Level 2 | https://award-level2.pages.woa.com |
| Level 3 | https://award-level3.pages.woa.com |

## 重新部署命令

### 后端
```bash
cd backend
git add -A && git commit -m "update" && git push
npx vercel deploy --prod --yes
```

### 前端 (Level 1/2/3)
```bash
cd level1-site  # 或 level2-site, level3-site
npx vercel deploy --prod --yes
```

## 环境变量
- `MONGODB_URI`: MongoDB Atlas 连接字符串
- `PORT`: 端口 (默认 8080)

## GitHub 仓库
https://github.com/jcmeng2002/award-management-system

# 奖项管理系统部署指南

## 当前部署地址

### 后端
- **URL**: https://backend-39m6uewb7-jcmeng2002s-projects.vercel.app
- **状态**: 运行中（已禁用部署保护）
- **数据库**: MongoDB Atlas

### 前端站点
| 站点 | URL |
|------|-----|
| Level 1 | https://level1-site-jzv5igxc4-jcmeng2002s-projects.vercel.app |
| Level 2 | https://level2-site-9ef5jy8b1-jcmeng2002s-projects.vercel.app |
| Level 3 | https://level3-site-28ymobdjo-jcmeng2002s-projects.vercel.app |

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

## GitHub 仓库
https://github.com/jcmeng2002/award-management-system

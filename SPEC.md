# 腾讯内网版部门奖项管理系统 - 项目规范

## 1. 概念与愿景

一个简洁高效的腾讯内部奖项管理系统，专为部门内部奖项申报、审核状态查询和常见问题解答而设计。界面风格与腾讯企业风格保持一致，强调专业、高效、信息清晰。采用卡片式布局，让用户能够快速找到所需功能。

## 2. 设计语言

### 美学方向
- 腾讯企业风格，简洁专业
- 蓝色主色调，体现科技感和信任感
- 大量留白，信息层次分明

### 配色方案
- Primary: #149BD5 (腾讯蓝)
- Secondary: #1A1A1A (深灰文字)
- Accent: #00B57D (成功绿)
- Warning: #FF6D00 (警告橙)
- Background: #F5F7FA (浅灰背景)
- Card Background: #FFFFFF
- Border: #E5E7EB

### 字体
- 主字体：-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif
- 标题字重：600
- 正文字重：400

### 动效
- 页面切换：淡入效果，200ms ease-out
- 卡片悬停：轻微上浮 + 阴影增强，150ms
- 表单提交：按钮loading状态

## 3. 布局与结构

### 页面结构
- **顶部导航栏**：Logo + 标题 + 用户信息
- **主要内容区**：
  - 首页：功能卡片入口
  - 奖项申请页：表单提交
  - 奖项查询页：搜索 + 结果列表
  - 问答中心页：FAQ折叠面板
- **响应式**：适配桌面端和移动端

### 页面
1. **首页**：展示四大功能模块卡片
2. **提交申请页**：奖项申请表单
3. **查询页面**：输入工号/姓名查询已提交申请
4. **问答中心**：常见问题FAQ

## 4. 功能与交互

### 4.1 首页
- 展示四个功能入口卡片：提交申请、查询申请、问答中心、关于系统
- 卡片点击进入对应页面

### 4.2 奖项申请
- **表单字段**：
  - 员工姓名（文本输入）
  - 工号（文本输入）
  - 部门（选择框）
  - 奖项类型（选择框：月度之星、季度优秀、年度最佳、创新贡献等）
  - 奖项名称（文本输入）
  - 申报理由（多行文本，最少20字）
  - 相关证明材料（文件上传提示）
  - 联系方式（文本输入）
- **提交**：显示loading → 成功提示 → 返回首页
- **验证**：所有字段必填，格式校验

### 4.3 奖项查询
- **搜索**：输入工号或姓名进行搜索
- **结果显示**：
  - 申请状态标签（待审核/已通过/已驳回）
  - 申请详情卡片（奖项类型、申报理由、提交时间等）
- **空状态**：无结果时显示友好提示

### 4.4 问答中心
- FAQ折叠面板
- 分类展示：申报流程、审核进度、材料准备、其他问题
- 点击展开/收起答案

## 5. 组件清单

### 导航栏
- Logo + 系统名称
- 当前用户信息（模拟）
- 响应式菜单

### 功能卡片
- 图标 + 标题 + 描述
- 悬停效果
- 点击跳转

### 表单组件
- 输入框：带标签、占位符、错误提示
- 选择框：下拉选项
- 文本域：多行输入
- 提交按钮：主色调，loading状态

### 状态标签
- 待审核（蓝色）
- 已通过（绿色）
- 已驳回（红色）

### 折叠面板
- 问题标题
- 展开/收起箭头
- 答案内容

## 6. 技术方案

- **框架**：React + TypeScript + Vite
- **样式**：Tailwind CSS + shadcn/ui
- **路由**：React Router
- **状态管理**：React useState/useContext
- **数据存储**：localStorage 模拟后端
- **部署**：oa-pages（腾讯内网部署）

## 7. 数据模型

### 奖项申请
```typescript
interface AwardApplication {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  awardType: string;
  awardName: string;
  reason: string;
  contact: string;
  status: 'pending' | 'approved' | 'rejected';
  submitDate: string;
}
```

### FAQ项
```typescript
interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}
```

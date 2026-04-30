/**
 * 奖项管理系统后端服务
 * 用于统一管理权限、知识库、申请数据
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS 配置 - 允许前端访问
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://award-system.pages.woa.com',
    'https://award-level1.pages.woa.com',
    'https://award-level2.pages.woa.com',
    'https://award-level3.pages.woa.com',
    'https://pages.woa.com',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
app.use(express.json());

// 白名单配置
let whiteList = [
  { username: 'joyahu', permissionLevel: 3, name: 'joyahu', department: '技术部' },
  { username: 'nelsonmeng', permissionLevel: 3, name: 'nelsonmeng', department: '技术部' },
  { username: 'evelynxzhou', permissionLevel: 1, name: 'evelynxzhou', department: '待定' },
];

// 知识库
let knowledgeBase = [
  { id: '1', title: '如何申请月度之星', content: '月度之星每月评选一次，请登录后在申请页面填写相关信息。', category: '申请指南', createDate: '2024-01-01', enabled: true },
  { id: '2', title: '奖项类型说明', content: '系统支持6种奖项类型：月度之星、季度优秀、年度最佳、创新贡献奖、团队协作奖、特殊贡献奖。', category: '奖项说明', createDate: '2024-01-01', enabled: true },
  { id: '3', title: '审核流程', content: '提交申请后，部门负责人会在3个工作日内审核。审核结果会通过系统通知。', category: '审核流程', createDate: '2024-01-01', enabled: true },
];

// 奖项申请
let applications = [];

// 奖项类型配置
const awardTypes = [
  { value: 'monthly-star', label: '月度之星', description: '每月评选一次，表彰当月表现优异的员工', enabled: true },
  { value: 'quarterly-excellent', label: '季度优秀', description: '每季度评选一次，表彰季度内做出突出贡献的员工', enabled: true },
  { value: 'annual-best', label: '年度最佳', description: '年度评选，表彰年度最优秀的员工或团队', enabled: true },
  { value: 'innovation', label: '创新贡献奖', description: '表彰在技术创新、业务创新方面有突出贡献的个人或团队', enabled: true },
  { value: 'teamwork', label: '团队协作奖', description: '表彰在跨部门协作项目中表现突出的团队', enabled: true },
  { value: 'special', label: '特殊贡献奖', description: '表彰在特殊事件或紧急任务中做出重要贡献的个人或团队', enabled: true },
];

// 部门配置
const departments = [
  { value: 'tech', label: '技术部', enabled: true },
  { value: 'product', label: '产品部', enabled: true },
  { value: 'design', label: '设计部', enabled: true },
  { value: 'operation', label: '运营部', enabled: true },
  { value: 'marketing', label: '市场部', enabled: true },
  { value: 'hr', label: '人力资源部', enabled: true },
  { value: 'finance', label: '财务部', enabled: true },
  { value: 'admin', label: '行政部', enabled: true },
];

const ADMIN_TOKEN = 'award-system-admin-secret-key-2024';

// ==================== 健康检查 ====================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'award-system-backend', time: new Date().toISOString() });
});

// ==================== OA Pages 配置 ====================
const OA_PAGES_URL = 'https://award-system.pages.woa.com';

// ==================== 获取当前用户身份 ====================
app.get('/api/current-user', async (req, res) => {
  try {
    const origin = OA_PAGES_URL;
    const cookies = req.headers.cookie || '';
    
    try {
      const response = await axios.get(`${origin}/api/user`, {
        headers: { 'Cookie': cookies, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        timeout: 5000,
      });
      
      if (response.data) {
        const username = response.data.username || response.data.accountName || response.data.ioaAccountName;
        if (username) return res.json({ success: true, username });
      }
    } catch (apiError) {
      console.log('OA Pages API 调用失败:', apiError.message);
    }
    
    const cookieMatch = cookies.match(/(?:^|;\s*)(?:x_oa_user|oa_account|account_name)=([^;]+)/i);
    if (cookieMatch) {
      const username = decodeURIComponent(cookieMatch[1]).trim();
      if (username && username.length < 50) return res.json({ success: true, username });
    }
    
    res.status(401).json({ success: false, error: '无法获取用户身份' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 权限检查 ====================
app.get('/api/check-access', async (req, res) => {
  try {
    const origin = OA_PAGES_URL;
    const cookies = req.headers.cookie || '';
    let username = null;
    
    try {
      const response = await axios.get(`${origin}/api/user`, {
        headers: { 'Cookie': cookies, 'Accept': 'application/json' },
        timeout: 5000,
      });
      username = response.data?.username || response.data?.accountName || response.data?.ioaAccountName;
    } catch {}
    
    if (!username) {
      const cookieMatch = cookies.match(/(?:^|;\s*)(?:x_oa_user|oa_account|account_name)=([^;]+)/i);
      if (cookieMatch) username = decodeURIComponent(cookieMatch[1]).trim();
    }
    
    if (!username) return res.json({ success: false, hasAccess: false, error: '无法识别用户身份' });
    
    const config = whiteList.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (config) {
      return res.json({ success: true, hasAccess: true, user: { employeeId: config.username, name: config.name, department: config.department, permissionLevel: config.permissionLevel } });
    } else {
      return res.json({ success: true, hasAccess: false, username, error: '您不在访问白名单中，请联系管理员' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 白名单管理 ====================
app.get('/api/admin/whitelist', (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  res.json({ success: true, whiteList });
});

app.post('/api/admin/whitelist/add', (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const { username, permissionLevel, name, department } = req.body;
  if (!username || !permissionLevel) return res.status(400).json({ error: '缺少必要参数' });
  if (whiteList.find(u => u.username.toLowerCase() === username.toLowerCase())) return res.status(400).json({ error: '用户已存在' });
  whiteList.push({ username, permissionLevel, name: name || username, department: department || '未知' });
  res.json({ success: true, whiteList });
});

app.delete('/api/admin/whitelist/:username', (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const index = whiteList.findIndex(u => u.username.toLowerCase() === req.params.username.toLowerCase());
  if (index === -1) return res.status(404).json({ error: '用户不存在' });
  whiteList.splice(index, 1);
  res.json({ success: true, whiteList });
});

// ==================== 知识库管理 ====================
app.get('/api/knowledge', (req, res) => {
  const enabled = req.query.enabled;
  let result = knowledgeBase;
  if (enabled !== undefined) result = knowledgeBase.filter(k => k.enabled === (enabled === 'true'));
  res.json({ success: true, data: result });
});

app.post('/api/admin/knowledge', (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const { title, content, category, enabled = true } = req.body;
  if (!title || !content || !category) return res.status(400).json({ error: '缺少必要参数' });
  const newItem = { id: Date.now().toString(), title, content, category, enabled, createDate: new Date().toISOString().split('T')[0] };
  knowledgeBase.push(newItem);
  res.json({ success: true, data: newItem });
});

app.put('/api/admin/knowledge/:id', (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const index = knowledgeBase.findIndex(k => k.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '条目不存在' });
  const { title, content, category, enabled } = req.body;
  knowledgeBase[index] = { ...knowledgeBase[index], ...(title && { title }), ...(content && { content }), ...(category && { category }), ...(enabled !== undefined && { enabled }), updateDate: new Date().toISOString().split('T')[0] };
  res.json({ success: true, data: knowledgeBase[index] });
});

app.delete('/api/admin/knowledge/:id', (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const index = knowledgeBase.findIndex(k => k.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '条目不存在' });
  knowledgeBase.splice(index, 1);
  res.json({ success: true });
});

// ==================== 奖项申请管理 ====================
app.get('/api/applications', (req, res) => {
  const { employeeId, status } = req.query;
  let result = applications;
  if (status) result = result.filter(a => a.status === status);
  if (employeeId) result = result.filter(a => a.employeeId.toLowerCase() === employeeId.toLowerCase());
  result.sort((a, b) => new Date(b.submitDate) - new Date(a.submitDate));
  res.json({ success: true, data: result });
});

app.post('/api/applications', (req, res) => {
  const { employeeName, employeeId, department, awardType, awardName, reason, contact } = req.body;
  if (!employeeName || !employeeId || !awardType || !awardName || !reason) return res.status(400).json({ error: '缺少必要参数' });
  
  const now = new Date().toISOString();
  const newApp = {
    id: Date.now().toString(),
    employeeName, employeeId, department: department || '未知', awardType, awardName, reason, contact: contact || '',
    status: 'pending_level2_confirm',
    submitDate: now.split('T')[0],
    submitTime: now,
    progressHistory: [{ step: 'submitted', status: 'pending_level2_confirm', timestamp: now, description: '员工已提交申请，等待部门确认' }],
  };
  
  applications.push(newApp);
  res.json({ success: true, data: newApp });
});

app.get('/api/applications/:id', (req, res) => {
  const app = applications.find(a => a.id === req.params.id);
  if (!app) return res.status(404).json({ error: '申请不存在' });
  res.json({ success: true, data: app });
});

app.get('/api/my-applications', (req, res) => {
  const { employeeId } = req.query;
  if (!employeeId) return res.status(400).json({ error: '缺少员工ID' });
  const result = applications.filter(a => a.employeeId.toLowerCase() === employeeId.toLowerCase()).sort((a, b) => new Date(b.submitTime || b.submitDate) - new Date(a.submitTime || a.submitDate));
  res.json({ success: true, data: result });
});

// Level 2 确认
app.put('/api/level2/confirm/:id', (req, res) => {
  const index = applications.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '申请不存在' });
  if (applications[index].status !== 'pending_level2_confirm') return res.status(400).json({ error: '当前状态不允许此操作' });
  
  const { confirmedBy, confirmedByName, department, comment } = req.body;
  const now = new Date().toISOString();
  applications[index] = {
    ...applications[index], status: 'pending_level3_confirm',
    level2ConfirmInfo: { confirmedBy, confirmedByName, confirmedAt: now, department, comment },
    progressHistory: [...(applications[index].progressHistory || []), { step: 'level2_confirmed', status: 'pending_level3_confirm', timestamp: now, description: `部门「${department}」已确认，等待最终审批`, operator: confirmedByName || confirmedBy }],
  };
  res.json({ success: true, data: applications[index] });
});

// Level 3 最终确认
app.put('/api/level3/finalize/:id', (req, res) => {
  const index = applications.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '申请不存在' });
  if (applications[index].status !== 'pending_level3_confirm') return res.status(400).json({ error: '当前状态不允许此操作' });
  
  const { confirmedBy, confirmedByName, comment } = req.body;
  const now = new Date().toISOString();
  applications[index] = {
    ...applications[index], status: 'approved',
    level3ConfirmInfo: { confirmedBy, confirmedByName, confirmedAt: now, comment },
    progressHistory: [...(applications[index].progressHistory || []), { step: 'level3_confirmed', status: 'approved', timestamp: now, description: '最终审批已通过', operator: confirmedByName || confirmedBy }],
  };
  res.json({ success: true, data: applications[index] });
});

// 驳回
app.put('/api/reject/:id', (req, res) => {
  const index = applications.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '申请不存在' });
  if (applications[index].status === 'approved' || applications[index].status === 'rejected') return res.status(400).json({ error: '已完成或已驳回的申请不能再处理' });
  
  const { rejectedBy, rejectedByName, reason } = req.body;
  const now = new Date().toISOString();
  applications[index] = {
    ...applications[index], status: 'rejected',
    rejectInfo: { rejectedBy, rejectedByName, rejectedAt: now, reason },
    progressHistory: [...(applications[index].progressHistory || []), { step: 'rejected', status: 'rejected', timestamp: now, description: `申请被驳回：${reason}`, operator: rejectedByName || rejectedBy }],
  };
  res.json({ success: true, data: applications[index] });
});

// 管理员审核
app.put('/api/admin/applications/:id', (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const { id } = req.params;
  const { status, comment, confirmedBy, rejectedReason } = req.body;
  const index = applications.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ error: '申请不存在' });
  
  const now = new Date().toISOString();
  if (status === 'approved') {
    applications[index] = { ...applications[index], status: 'approved', confirmInfo: { confirmedBy, confirmedAt: now, confirmedByName: confirmedBy || '管理员', comment } };
  } else if (status === 'rejected') {
    applications[index] = { ...applications[index], status: 'rejected', rejectInfo: { rejectedBy, rejectedAt: now, reason: rejectedReason || '审核未通过' } };
  } else {
    return res.status(400).json({ error: '无效的状态' });
  }
  res.json({ success: true, data: applications[index] });
});

app.delete('/api/admin/applications/:id', (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const index = applications.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '申请不存在' });
  applications.splice(index, 1);
  res.json({ success: true });
});

// ==================== 配置管理 ====================
app.get('/api/award-types', (req, res) => res.json({ success: true, data: awardTypes }));
app.get('/api/departments', (req, res) => res.json({ success: true, data: departments }));
app.put('/api/admin/award-types', (req, res) => { if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' }); res.json({ success: true, data: awardTypes }); });
app.put('/api/admin/departments', (req, res) => { if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' }); res.json({ success: true, data: departments }); });

// 导出/导入数据
app.get('/api/admin/export', (req, res) => { if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' }); res.json({ success: true, data: { whiteList, knowledgeBase, applications, awardTypes, departments, exportDate: new Date().toISOString() } }); });
app.post('/api/admin/import', (req, res) => { if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' }); const { whiteList: wl, knowledgeBase: kb, applications: apps } = req.body; if (wl) whiteList = wl; if (kb) knowledgeBase = kb; if (apps) applications = apps; res.json({ success: true, message: '数据导入成功' }); });

// ==================== 启动服务器 ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`奖项管理系统后端服务已启动`);
  console.log(`端口: ${PORT}`);
});

module.exports = app;

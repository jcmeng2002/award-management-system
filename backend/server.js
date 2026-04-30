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

// ==================== 内存存储 ====================
// 生产环境应该使用数据库

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

// 奖项申请 - 状态流转：draft -> pending_level2_confirm -> pending_level3_confirm -> approved/rejected
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

// 管理员密钥
const ADMIN_TOKEN = 'award-system-admin-secret-key-2024';

// ==================== 健康检查 ====================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'award-system-backend', time: new Date().toISOString() });
});

// ==================== OA Pages 配置 ====================
const OA_PAGES_URL = 'https://award-system.pages.woa.com';

// ==================== 获取当前用户身份 ====================
/**
 * 调用 OA Pages API 获取当前登录用户
 * OA Pages 会把用户身份信息通过 HttpOnly cookie 传递给后端
 */
app.get('/api/current-user', async (req, res) => {
  try {
    // 使用配置的 OA Pages URL
    const origin = OA_PAGES_URL;
    
    // 调用 OA Pages 的用户信息 API
    // 注意：需要带上原始请求的 cookie
    const cookies = req.headers.cookie || '';
    
    try {
      const response = await axios.get(`${origin}/api/user`, {
        headers: {
          'Cookie': cookies,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        timeout: 5000,
      });
      
      if (response.data) {
        // 提取用户名
        const username = response.data.username || 
                        response.data.accountName || 
                        response.data.ioaAccountName ||
                        response.data.user?.username ||
                        response.data.user?.accountName;
        
        if (username) {
          return res.json({ success: true, username });
        }
      }
    } catch (apiError) {
      console.log('OA Pages API 调用失败:', apiError.message);
    }
    
    // 如果无法从 API 获取，尝试从 cookie 解析
    // 注意：某些 cookie 可能是非 HttpOnly 的
    const cookieMatch = cookies.match(/(?:^|;\s*)(?:x_oa_user|oa_account|account_name)=([^;]+)/i);
    if (cookieMatch) {
      const username = decodeURIComponent(cookieMatch[1]).trim();
      if (username && username.length < 50) {
        return res.json({ success: true, username });
      }
    }
    
    // 如果仍然无法获取，返回错误
    res.status(401).json({ success: false, error: '无法获取用户身份' });
    
  } catch (error) {
    console.error('获取用户身份失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 权限检查 ====================
/**
 * 检查用户是否有权限访问系统
 */
app.get('/api/check-access', async (req, res) => {
  try {
    // 先获取当前用户
    const origin = OA_PAGES_URL;
    const cookies = req.headers.cookie || '';
    
    let username = null;
    
    // 尝试从 OA Pages API 获取
    try {
      const response = await axios.get(`${origin}/api/user`, {
        headers: {
          'Cookie': cookies,
          'Accept': 'application/json',
        },
        timeout: 5000,
      });
      username = response.data?.username || response.data?.accountName || response.data?.ioaAccountName;
    } catch {}
    
    // 尝试从 cookie 获取
    if (!username) {
      const cookieMatch = cookies.match(/(?:^|;\s*)(?:x_oa_user|oa_account|account_name)=([^;]+)/i);
      if (cookieMatch) {
        username = decodeURIComponent(cookieMatch[1]).trim();
      }
    }
    
    if (!username) {
      return res.json({ 
        success: false, 
        hasAccess: false,
        error: '无法识别用户身份' 
      });
    }
    
    // 检查白名单
    const config = whiteList.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (config) {
      return res.json({
        success: true,
        hasAccess: true,
        user: {
          employeeId: config.username,
          name: config.name,
          department: config.department,
          permissionLevel: config.permissionLevel,
        }
      });
    } else {
      return res.json({
        success: true,
        hasAccess: false,
        username: username,
        error: '您不在访问白名单中，请联系管理员'
      });
    }
    
  } catch (error) {
    console.error('权限检查失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 白名单管理（管理员） ====================

// 获取白名单
app.get('/api/admin/whitelist', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  
  // 简单的管理员验证（生产环境应该用更好的方式）
  if (authHeader !== 'award-system-admin-secret-key-2024') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  res.json({ success: true, whiteList });
});

// 更新白名单
app.post('/api/admin/whitelist', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  
  if (authHeader !== 'award-system-admin-secret-key-2024') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { whiteList: newWhiteList } = req.body;
  
  if (!Array.isArray(newWhiteList)) {
    return res.status(400).json({ error: 'whiteList 必须是数组' });
  }
  
  whiteList = newWhiteList;
  res.json({ success: true, whiteList });
});

// 添加白名单用户
app.post('/api/admin/whitelist/add', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  
  if (authHeader !== 'award-system-admin-secret-key-2024') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { username, permissionLevel, name, department } = req.body;
  
  if (!username || !permissionLevel) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const existing = whiteList.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: '用户已存在' });
  }
  
  whiteList.push({ 
    username, 
    permissionLevel, 
    name: name || username, 
    department: department || '未知' 
  });
  
  res.json({ success: true, whiteList });
});

// 删除白名单用户
app.delete('/api/admin/whitelist/:username', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { username } = req.params;
  const index = whiteList.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (index === -1) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  whiteList.splice(index, 1);
  res.json({ success: true, whiteList });
});

// ==================== 知识库管理（管理员） ====================

// 获取知识库列表（所有人可读）
app.get('/api/knowledge', (req, res) => {
  const enabled = req.query.enabled;
  let result = knowledgeBase;
  
  if (enabled !== undefined) {
    result = knowledgeBase.filter(k => k.enabled === (enabled === 'true'));
  }
  
  res.json({ success: true, data: result });
});

// 添加知识库条目
app.post('/api/admin/knowledge', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { title, content, category, enabled = true } = req.body;
  
  if (!title || !content || !category) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const newItem = {
    id: Date.now().toString(),
    title,
    content,
    category,
    enabled,
    createDate: new Date().toISOString().split('T')[0],
  };
  
  knowledgeBase.push(newItem);
  res.json({ success: true, data: newItem });
});

// 更新知识库条目
app.put('/api/admin/knowledge/:id', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { id } = req.params;
  const { title, content, category, enabled } = req.body;
  
  const index = knowledgeBase.findIndex(k => k.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '条目不存在' });
  }
  
  knowledgeBase[index] = {
    ...knowledgeBase[index],
    ...(title && { title }),
    ...(content && { content }),
    ...(category && { category }),
    ...(enabled !== undefined && { enabled }),
    updateDate: new Date().toISOString().split('T')[0],
  };
  
  res.json({ success: true, data: knowledgeBase[index] });
});

// 删除知识库条目
app.delete('/api/admin/knowledge/:id', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { id } = req.params;
  const index = knowledgeBase.findIndex(k => k.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: '条目不存在' });
  }
  
  knowledgeBase.splice(index, 1);
  res.json({ success: true });
});

// 批量更新知识库
app.post('/api/admin/knowledge/batch', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items 必须是数组' });
  }
  
  knowledgeBase = items;
  res.json({ success: true, data: knowledgeBase });
});

// ==================== 奖项申请管理 ====================

// 获取申请列表（所有人可读自己的，管理员可读全部）
app.get('/api/applications', (req, res) => {
  const { employeeId, status } = req.query;
  
  let result = applications;
  
  // 按状态筛选
  if (status) {
    result = result.filter(a => a.status === status);
  }
  
  // 如果指定了员工ID，只返回该员工的申请
  if (employeeId) {
    result = result.filter(a => a.employeeId.toLowerCase() === employeeId.toLowerCase());
  }
  
  // 按日期倒序
  result.sort((a, b) => new Date(b.submitDate) - new Date(a.submitDate));
  
  res.json({ success: true, data: result });
});

// 提交申请（提交后进入 Level 2 确认阶段）
app.post('/api/applications', (req, res) => {
  const { employeeName, employeeId, department, awardType, awardName, reason, contact } = req.body;
  
  if (!employeeName || !employeeId || !awardType || !awardName || !reason) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const now = new Date().toISOString();
  
  const newApp = {
    id: Date.now().toString(),
    employeeName,
    employeeId,
    department: department || '未知',
    awardType,
    awardName,
    reason,
    contact: contact || '',
    status: 'pending_level2_confirm', // 提交后进入 Level 2 确认阶段
    submitDate: now.split('T')[0],
    submitTime: now,
    progressHistory: [
      {
        step: 'submitted',
        status: 'pending_level2_confirm',
        timestamp: now,
        description: '员工已提交申请，等待部门确认',
      }
    ],
  };
  
  applications.push(newApp);
  res.json({ success: true, data: newApp });
});

// 管理员：更新申请状态（审核）
app.put('/api/admin/applications/:id', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { id } = req.params;
  const { status, comment, confirmedBy, rejectedReason } = req.body;
  
  const index = applications.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  const now = new Date().toISOString();
  
  if (status === 'approved') {
    applications[index] = {
      ...applications[index],
      status: 'approved',
      confirmInfo: {
        confirmedBy: confirmedBy || 'admin',
        confirmedAt: now,
        confirmedByName: confirmedBy || '管理员',
        comment: comment || '',
      },
    };
  } else if (status === 'rejected') {
    applications[index] = {
      ...applications[index],
      status: 'rejected',
      rejectInfo: {
        rejectedBy: confirmedBy || 'admin',
        rejectedAt: now,
        reason: rejectedReason || '审核未通过',
      },
    };
  } else {
    return res.status(400).json({ error: '无效的状态' });
  }
  
  res.json({ success: true, data: applications[index] });
});

// ==================== 三站联动状态流转 API ====================

// Level 2 确认申请（从 pending_level2_confirm -> pending_level3_confirm）
app.put('/api/level2/confirm/:id', (req, res) => {
  const { id } = req.params;
  const { confirmedBy, confirmedByName, department, comment } = req.body;
  
  const index = applications.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  const app = applications[index];
  if (app.status !== 'pending_level2_confirm') {
    return res.status(400).json({ error: '当前状态不允许此操作' });
  }
  
  const now = new Date().toISOString();
  
  applications[index] = {
    ...app,
    status: 'pending_level3_confirm',
    level2ConfirmInfo: {
      confirmedBy: confirmedBy || '',
      confirmedByName: confirmedByName || '',
      confirmedAt: now,
      department: department || '',
      comment: comment || '',
    },
    progressHistory: [
      ...(app.progressHistory || []),
      {
        step: 'level2_confirmed',
        status: 'pending_level3_confirm',
        timestamp: now,
        description: `部门「${department || ''}」已确认，等待最终审批`,
        operator: confirmedByName || confirmedBy || '部门负责人',
      }
    ],
  };
  
  res.json({ success: true, data: applications[index] });
});

// Level 3 最终确认（从 pending_level3_confirm -> approved）
app.put('/api/level3/finalize/:id', (req, res) => {
  const { id } = req.params;
  const { confirmedBy, confirmedByName, comment } = req.body;
  
  const index = applications.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  const app = applications[index];
  if (app.status !== 'pending_level3_confirm') {
    return res.status(400).json({ error: '当前状态不允许此操作' });
  }
  
  const now = new Date().toISOString();
  
  applications[index] = {
    ...app,
    status: 'approved',
    level3ConfirmInfo: {
      confirmedBy: confirmedBy || '',
      confirmedByName: confirmedByName || '',
      confirmedAt: now,
      comment: comment || '',
    },
    progressHistory: [
      ...(app.progressHistory || []),
      {
        step: 'level3_confirmed',
        status: 'approved',
        timestamp: now,
        description: '最终审批已通过',
        operator: confirmedByName || confirmedBy || '管理员',
      }
    ],
  };
  
  res.json({ success: true, data: applications[index] });
});

// 驳回申请（任意阶段都可以驳回）
app.put('/api/reject/:id', (req, res) => {
  const { id } = req.params;
  const { rejectedBy, rejectedByName, rejectedAt, reason, rejectLevel } = req.body;
  
  const index = applications.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  const app = applications[index];
  if (app.status === 'approved' || app.status === 'rejected') {
    return res.status(400).json({ error: '已完成或已驳回的申请不能再处理' });
  }
  
  const now = rejectedAt || new Date().toISOString();
  
  applications[index] = {
    ...app,
    status: 'rejected',
    rejectInfo: {
      rejectedBy: rejectedBy || '',
      rejectedByName: rejectedByName || '',
      rejectedAt: now,
      reason: reason || '审核未通过',
      rejectLevel: rejectLevel || 'unknown',
    },
    progressHistory: [
      ...(app.progressHistory || []),
      {
        step: 'rejected',
        status: 'rejected',
        timestamp: now,
        description: `申请被驳回：${reason || '审核未通过'}`,
        operator: rejectedByName || rejectedBy || '',
      }
    ],
  };
  
  res.json({ success: true, data: applications[index] });
});

// 获取申请详情（包含进度历史）
app.get('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  
  const app = applications.find(a => a.id === id);
  if (!app) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  res.json({ success: true, data: app });
});

// 获取员工的申请列表（用于 Level 1 进度查询）
app.get('/api/my-applications', (req, res) => {
  const { employeeId } = req.query;
  
  if (!employeeId) {
    return res.status(400).json({ error: '缺少员工ID' });
  }
  
  const result = applications
    .filter(a => a.employeeId.toLowerCase() === employeeId.toLowerCase())
    .sort((a, b) => new Date(b.submitTime || b.submitDate) - new Date(a.submitTime || a.submitDate));
  
  res.json({ success: true, data: result });
});

// 管理员：删除申请
app.delete('/api/admin/applications/:id', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { id } = req.params;
  const index = applications.findIndex(a => a.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  applications.splice(index, 1);
  res.json({ success: true });
});

// 批量更新申请
app.post('/api/admin/applications/batch', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items 必须是数组' });
  }
  
  applications = items;
  res.json({ success: true, data: applications });
});

// ==================== 配置管理（管理员） ====================

// 获取奖项类型配置
app.get('/api/award-types', (req, res) => {
  const { enabled } = req.query;
  
  if (enabled !== undefined) {
    return res.json({ success: true, data: awardTypes.filter(t => t.enabled === (enabled === 'true')) });
  }
  
  res.json({ success: true, data: awardTypes });
});

// 获取部门配置
app.get('/api/departments', (req, res) => {
  const { enabled } = req.query;
  
  if (enabled !== undefined) {
    return res.json({ success: true, data: departments.filter(d => d.enabled === (enabled === 'true')) });
  }
  
  res.json({ success: true, data: departments });
});

// 更新奖项类型配置
app.put('/api/admin/award-types', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items 必须是数组' });
  }
  
  // 合并配置
  items.forEach(newItem => {
    const index = awardTypes.findIndex(t => t.value === newItem.value);
    if (index !== -1) {
      awardTypes[index] = { ...awardTypes[index], ...newItem };
    } else {
      awardTypes.push(newItem);
    }
  });
  
  res.json({ success: true, data: awardTypes });
});

// 更新部门配置
app.put('/api/admin/departments', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items 必须是数组' });
  }
  
  items.forEach(newItem => {
    const index = departments.findIndex(d => d.value === newItem.value);
    if (index !== -1) {
      departments[index] = { ...departments[index], ...newItem };
    } else {
      departments.push(newItem);
    }
  });
  
  res.json({ success: true, data: departments });
});

// ==================== 全量数据导出/导入（管理员） ====================

// 导出所有数据
app.get('/api/admin/export', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  res.json({
    success: true,
    data: {
      whiteList,
      knowledgeBase,
      applications,
      awardTypes,
      departments,
      exportDate: new Date().toISOString(),
    }
  });
});

// 导入所有数据
app.post('/api/admin/import', (req, res) => {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_TOKEN) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  const { whiteList: wl, knowledgeBase: kb, applications: apps, awardTypes: at, departments: dept } = req.body;
  
  if (wl) whiteList = wl;
  if (kb) knowledgeBase = kb;
  if (apps) applications = apps;
  if (at) awardTypes = at;
  if (dept) departments = dept;
  
  res.json({ success: true, message: '数据导入成功' });
});

// ==================== 启动服务器 ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`奖项管理系统后端服务已启动`);
  console.log(`端口: ${PORT}`);
  console.log(`健康检查: /health`);
  console.log(`获取用户: /api/current-user`);
  console.log(`权限检查: /api/check-access`);
});

module.exports = app;

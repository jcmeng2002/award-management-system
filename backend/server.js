/**
 * 奖项管理系统后端服务
 * 支持 MongoDB 数据持久化
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 8080;

// MongoDB 连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'award_system';

// MongoDB 客户端
let db;
let applications, whiteList, knowledgeBase;

async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db(DB_NAME);
    
    // 初始化集合
    applications = db.collection('applications');
    whiteList = db.collection('whiteList');
    knowledgeBase = db.collection('knowledgeBase');
    
    // 初始化白名单（如果为空）
    const wlCount = await whiteList.countDocuments();
    if (wlCount === 0) {
      await whiteList.insertMany([
        { username: 'joyahu', permissionLevel: 3, name: 'joyahu', department: '技术部' },
        { username: 'nelsonmeng', permissionLevel: 3, name: 'nelsonmeng', department: '技术部' },
        { username: 'evelynxzhou', permissionLevel: 1, name: 'evelynxzhou', department: '待定' },
      ]);
    }
    
    // 初始化知识库（如果为空）
    const kbCount = await knowledgeBase.countDocuments();
    if (kbCount === 0) {
      await knowledgeBase.insertMany([
        { title: '如何申请月度之星', content: '月度之星每月评选一次，请登录后在申请页面填写相关信息。', category: '申请指南', createDate: '2024-01-01', enabled: true },
        { title: '奖项类型说明', content: '系统支持6种奖项类型：月度之星、季度优秀、年度最佳、创新贡献奖、团队协作奖、特殊贡献奖。', category: '奖项说明', createDate: '2024-01-01', enabled: true },
        { title: '审核流程', content: '提交申请后，部门负责人会在3个工作日内审核。审核结果会通过系统通知。', category: '审核流程', createDate: '2024-01-01', enabled: true },
      ]);
    }
    
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error.message);
    console.log('将使用内存存储（数据不会持久化）');
  }
}

// 配置和常量
const awardTypes = [
  { value: 'monthly-star', label: '月度之星', description: '每月评选一次，表彰当月表现优异的员工', enabled: true },
  { value: 'quarterly-excellent', label: '季度优秀', description: '每季度评选一次，表彰季度内做出突出贡献的员工', enabled: true },
  { value: 'annual-best', label: '年度最佳', description: '年度评选，表彰年度最优秀的员工或团队', enabled: true },
  { value: 'innovation', label: '创新贡献奖', description: '表彰在技术创新、业务创新方面有突出贡献的个人或团队', enabled: true },
  { value: 'teamwork', label: '团队协作奖', description: '表彰在跨部门协作项目中表现突出的团队', enabled: true },
  { value: 'special', label: '特殊贡献奖', description: '表彰在特殊事件或紧急任务中做出重要贡献的个人或团队', enabled: true },
];

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
const OA_PAGES_URL = 'https://award-system.pages.woa.com';

// CORS 配置
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://award-system.pages.woa.com',
    'https://award-level1.pages.woa.com',
    'https://award-level2.pages.woa.com',
    'https://award-level3.pages.woa.com',
    'https://pages.woa.com',
    'https://level1-site-asry9d7op-jcmeng2002s-projects.vercel.app',
    'https://level2-site-lzgu9efur-jcmeng2002s-projects.vercel.app',
    'https://level3-site-roc59xm1x-jcmeng2002s-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token, X-Requested-With, Accept');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});
app.use(express.json());

// ==================== 健康检查 ====================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'award-system-backend', database: db ? 'connected' : 'disconnected', time: new Date().toISOString() });
});

// ==================== 获取当前用户身份 ====================
app.get('/api/current-user', async (req, res) => {
  try {
    const cookies = req.headers.cookie || '';
    try {
      const response = await axios.get(`${OA_PAGES_URL}/api/user`, {
        headers: { 'Cookie': cookies, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        timeout: 5000,
      });
      if (response.data) {
        const username = response.data.username || response.data.accountName || response.data.ioaAccountName;
        if (username) return res.json({ success: true, username });
      }
    } catch {}
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
    const cookies = req.headers.cookie || '';
    let username = null;
    try {
      const response = await axios.get(`${OA_PAGES_URL}/api/user`, {
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
    
    const config = db ? await whiteList.findOne({ username: new RegExp(`^${username}$`, 'i') }) : null;
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
app.get('/api/admin/whitelist', async (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const list = db ? await whiteList.find({}).toArray() : [];
  res.json({ success: true, whiteList: list });
});

app.post('/api/admin/whitelist/add', async (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const { username, permissionLevel, name, department } = req.body;
  if (!username || !permissionLevel) return res.status(400).json({ error: '缺少必要参数' });
  const existing = db ? await whiteList.findOne({ username: new RegExp(`^${username}$`, 'i') }) : null;
  if (existing) return res.status(400).json({ error: '用户已存在' });
  const newUser = { username, permissionLevel, name: name || username, department: department || '未知' };
  if (db) await whiteList.insertOne(newUser);
  const list = db ? await whiteList.find({}).toArray() : [];
  res.json({ success: true, whiteList: list });
});

app.delete('/api/admin/whitelist/:username', async (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  if (db) await whiteList.deleteOne({ username: new RegExp(`^${req.params.username}$`, 'i') });
  res.json({ success: true });
});

// ==================== 知识库管理 ====================
app.get('/api/knowledge', async (req, res) => {
  const enabled = req.query.enabled;
  let query = {};
  if (enabled !== undefined) query.enabled = enabled === 'true';
  const list = db ? await knowledgeBase.find(query).toArray() : [];
  res.json({ success: true, data: list });
});

app.post('/api/admin/knowledge', async (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const { title, content, category, enabled = true } = req.body;
  if (!title || !content || !category) return res.status(400).json({ error: '缺少必要参数' });
  const newItem = { title, content, category, enabled, createDate: new Date().toISOString().split('T')[0] };
  if (db) await knowledgeBase.insertOne(newItem);
  res.json({ success: true, data: newItem });
});

app.put('/api/admin/knowledge/:id', async (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  if (!db) return res.status(500).json({ error: '数据库未连接' });
  const { title, content, category, enabled } = req.body;
  const update = { ...(title && { title }), ...(content && { content }), ...(category && { category }), ...(enabled !== undefined && { enabled }), updateDate: new Date().toISOString().split('T')[0] };
  await knowledgeBase.updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
  const item = await knowledgeBase.findOne({ _id: new ObjectId(req.params.id) });
  res.json({ success: true, data: item });
});

app.delete('/api/admin/knowledge/:id', async (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  if (db) await knowledgeBase.deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ success: true });
});

// ==================== 奖项申请管理 ====================
app.get('/api/applications', async (req, res) => {
  const { employeeId, status } = req.query;
  let query = {};
  if (status) query.status = status;
  if (employeeId) query.employeeId = new RegExp(`^${employeeId}$`, 'i');
  const list = db ? await applications.find(query).sort({ submitDate: -1 }).toArray() : [];
  res.json({ success: true, data: list });
});

app.post('/api/applications', async (req, res) => {
  const { employeeName, employeeId, department, awardType, awardName, reason, contact } = req.body;
  if (!employeeName || !employeeId || !awardType || !awardName || !reason) return res.status(400).json({ error: '缺少必要参数' });
  
  const now = new Date().toISOString();
  const newApp = {
    employeeName, employeeId, department: department || '未知', awardType, awardName, reason, contact: contact || '',
    status: 'pending_level2_confirm',
    submitDate: now.split('T')[0],
    submitTime: now,
    progressHistory: [{ step: 'submitted', status: 'pending_level2_confirm', timestamp: now, description: '员工已提交申请，等待部门确认' }],
  };
  
  if (db) {
    const result = await applications.insertOne(newApp);
    newApp._id = result.insertedId;
  }
  res.json({ success: true, data: newApp });
});

app.get('/api/applications/:id', async (req, res) => {
  if (!db) return res.status(500).json({ error: '数据库未连接' });
  try {
    const app = await applications.findOne({ _id: new ObjectId(req.params.id) });
    if (!app) return res.status(404).json({ error: '申请不存在' });
    res.json({ success: true, data: app });
  } catch {
    res.status(400).json({ error: '无效的ID' });
  }
});

app.get('/api/my-applications', async (req, res) => {
  const { employeeId } = req.query;
  if (!employeeId) return res.status(400).json({ error: '缺少员工ID' });
  const list = db ? await applications.find({ employeeId: new RegExp(`^${employeeId}$`, 'i') }).sort({ submitTime: -1 }).toArray() : [];
  res.json({ success: true, data: list });
});

// Level 2 确认
app.put('/api/level2/confirm/:id', async (req, res) => {
  if (!db) return res.status(500).json({ error: '数据库未连接' });
  try {
    const { confirmedBy, confirmedByName, department, comment } = req.body;
    const now = new Date().toISOString();
    const result = await applications.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), status: 'pending_level2_confirm' },
      { $set: { status: 'pending_level3_confirm', level2ConfirmInfo: { confirmedBy, confirmedByName, confirmedAt: now, department, comment } }, $push: { progressHistory: { step: 'level2_confirmed', status: 'pending_level3_confirm', timestamp: now, description: `部门「${department}」已确认，等待最终审批`, operator: confirmedByName || confirmedBy } } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: '申请不存在或状态不允许' });
    res.json({ success: true, data: result });
  } catch {
    res.status(400).json({ error: '无效的ID' });
  }
});

// Level 3 最终确认
app.put('/api/level3/finalize/:id', async (req, res) => {
  if (!db) return res.status(500).json({ error: '数据库未连接' });
  try {
    const { confirmedBy, confirmedByName, comment } = req.body;
    const now = new Date().toISOString();
    const result = await applications.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), status: 'pending_level3_confirm' },
      { $set: { status: 'approved', level3ConfirmInfo: { confirmedBy, confirmedByName, confirmedAt: now, comment } }, $push: { progressHistory: { step: 'level3_confirmed', status: 'approved', timestamp: now, description: '最终审批已通过', operator: confirmedByName || confirmedBy } } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: '申请不存在或状态不允许' });
    res.json({ success: true, data: result });
  } catch {
    res.status(400).json({ error: '无效的ID' });
  }
});

// 驳回
app.put('/api/reject/:id', async (req, res) => {
  if (!db) return res.status(500).json({ error: '数据库未连接' });
  try {
    const { rejectedBy, rejectedByName, reason } = req.body;
    const now = new Date().toISOString();
    const result = await applications.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), status: { $nin: ['approved', 'rejected'] } },
      { $set: { status: 'rejected', rejectInfo: { rejectedBy, rejectedByName, rejectedAt: now, reason } }, $push: { progressHistory: { step: 'rejected', status: 'rejected', timestamp: now, description: `申请被驳回：${reason}`, operator: rejectedByName || rejectedBy } } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: '申请不存在或已完成' });
    res.json({ success: true, data: result });
  } catch {
    res.status(400).json({ error: '无效的ID' });
  }
});

// 管理员审核
app.put('/api/admin/applications/:id', async (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  if (!db) return res.status(500).json({ error: '数据库未连接' });
  try {
    const { status, comment, confirmedBy, rejectedReason } = req.body;
    const now = new Date().toISOString();
    let update;
    if (status === 'approved') {
      update = { $set: { status: 'approved', confirmInfo: { confirmedBy, confirmedAt: now, confirmedByName: confirmedBy || '管理员', comment } } };
    } else if (status === 'rejected') {
      update = { $set: { status: 'rejected', rejectInfo: { rejectedBy, rejectedAt: now, reason: rejectedReason || '审核未通过' } } };
    } else {
      return res.status(400).json({ error: '无效的状态' });
    }
    const result = await applications.findOneAndUpdate({ _id: new ObjectId(req.params.id) }, update, { returnDocument: 'after' });
    if (!result) return res.status(404).json({ error: '申请不存在' });
    res.json({ success: true, data: result });
  } catch {
    res.status(400).json({ error: '无效的ID' });
  }
});

app.delete('/api/admin/applications/:id', async (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  if (db) await applications.deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ success: true });
});

// ==================== 配置管理 ====================
app.get('/api/award-types', (req, res) => res.json({ success: true, data: awardTypes }));
app.get('/api/departments', (req, res) => res.json({ success: true, data: departments }));

// 导出数据
app.get('/api/admin/export', async (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const wl = db ? await whiteList.find({}).toArray() : [];
  const kb = db ? await knowledgeBase.find({}).toArray() : [];
  const apps = db ? await applications.find({}).toArray() : [];
  res.json({ success: true, data: { whiteList: wl, knowledgeBase: kb, applications: apps, awardTypes, departments, exportDate: new Date().toISOString() } });
});

// 导入数据
app.post('/api/admin/import', async (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).json({ error: '需要管理员权限' });
  const { whiteList: wl, knowledgeBase: kb, applications: apps } = req.body;
  if (wl && db) { await whiteList.deleteMany({}); await whiteList.insertMany(wl); }
  if (kb && db) { await knowledgeBase.deleteMany({}); await knowledgeBase.insertMany(kb); }
  if (apps && db) { await applications.deleteMany({}); await applications.insertMany(apps); }
  res.json({ success: true, message: '数据导入成功' });
});

// ==================== 启动 ====================
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`奖项管理系统后端服务已启动`);
    console.log(`端口: ${PORT}`);
    console.log(`数据库: ${db ? 'MongoDB 已连接' : '未连接（使用内存存储）'}`);
  });
});

module.exports = app;

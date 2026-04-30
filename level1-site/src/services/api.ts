/**
 * 统一 API 服务层 - 所有子站点共用
 * 支持三站联动状态流转
 */

import { KnowledgeItem, AwardApplication } from '../types'

const API_BASE = 'https://backend-iyhycb7ep-jcmeng2002s-projects.vercel.app'
const ADMIN_TOKEN = 'award-system-admin-secret-key-2024'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
    headers['X-Admin-Token'] = ADMIN_TOKEN
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}

// ==================== 知识库 ====================
export const knowledgeApi = {
  list: () => request<ApiResponse<KnowledgeItem[]>>('/api/knowledge?enabled=true'),
  listAll: () => request<ApiResponse<KnowledgeItem[]>>('/api/knowledge'),
  add: (item: Partial<KnowledgeItem>) => request<ApiResponse<KnowledgeItem>>('/api/admin/knowledge', { method: 'POST', body: JSON.stringify(item) }),
  update: (id: string, item: Partial<KnowledgeItem>) => request<ApiResponse<KnowledgeItem>>(`/api/admin/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  delete: (id: string) => request<ApiResponse<void>>(`/api/admin/knowledge/${id}`, { method: 'DELETE' }),
}

// ==================== 申请（三站联动） ====================
export const applicationApi = {
  // 获取申请列表
  list: (employeeId?: string) => request<ApiResponse<AwardApplication[]>>(`/api/applications${employeeId ? `?employeeId=${employeeId}` : ''}`),
  
  // 获取我的申请（用于 Level 1 进度追踪）
  myList: (employeeId: string) => request<ApiResponse<AwardApplication[]>>(`/api/my-applications?employeeId=${employeeId}`),
  
  // 获取单个申请详情
  get: (id: string) => request<ApiResponse<AwardApplication>>(`/api/applications/${id}`),
  
  // 提交申请（自动进入 pending_level2_confirm）
  submit: (app: Omit<AwardApplication, 'id' | 'status' | 'submitDate'>) => 
    request<ApiResponse<AwardApplication>>('/api/applications', { method: 'POST', body: JSON.stringify(app) }),
  
  // Level 2 确认（pending_level2_confirm -> pending_level3_confirm）
  level2Confirm: (id: string, data: { confirmedBy: string; confirmedByName: string; department: string; comment?: string }) =>
    request<ApiResponse<AwardApplication>>(`/api/level2/confirm/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Level 3 最终确认（pending_level3_confirm -> approved）
  level3Finalize: (id: string, data: { confirmedBy: string; confirmedByName: string; comment?: string }) =>
    request<ApiResponse<AwardApplication>>(`/api/level3/finalize/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // 驳回申请
  reject: (id: string, data: { rejectedBy: string; rejectedByName: string; reason: string; rejectLevel?: string }) =>
    request<ApiResponse<AwardApplication>>(`/api/reject/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // 管理员审核
  approve: (id: string, confirmedBy: string) => 
    request<ApiResponse<AwardApplication>>(`/api/admin/applications/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'approved', confirmedBy }) }),
  
  delete: (id: string) => request<ApiResponse<void>>(`/api/admin/applications/${id}`, { method: 'DELETE' }),
}

// ==================== 白名单 ====================
export const whitelistApi = {
  list: () => request<{ success: boolean; whiteList: any[] }>('/api/admin/whitelist'),
  add: (user: { username: string; permissionLevel: number; name?: string; department?: string }) => 
    request<{ success: boolean; whiteList: any[] }>('/api/admin/whitelist/add', { method: 'POST', body: JSON.stringify(user) }),
  delete: (username: string) => request<{ success: boolean; whiteList: any[] }>(`/api/admin/whitelist/${username}`, { method: 'DELETE' }),
}

// ==================== 配置 ====================
export const configApi = {
  awardTypes: () => request<ApiResponse<any[]>>('/api/award-types'),
  departments: () => request<ApiResponse<any[]>>('/api/departments'),
}

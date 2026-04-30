// 权限等级：0=无权限, 1=普通员工, 2=部门负责人, 3=管理员
export type PermissionLevel = 0 | 1 | 2 | 3

// 权限配置
export interface PermissionConfig {
  level: PermissionLevel
  name: string
  description: string
}

export const PERMISSION_LEVELS: Record<PermissionLevel, PermissionConfig> = {
  0: { level: 0, name: '无权限', description: '请联系管理员开通权限' },
  1: { level: 1, name: '普通员工', description: '提交申请、查看修改自己的申请、查看知识库和问答' },
  2: { level: 2, name: '部门负责人', description: '增加能看到部门全部申请并确认' },
  3: { level: 3, name: '管理员', description: '拥有全部权限' },
}

// 用户信息
export interface User {
  id: string
  name: string
  employeeId: string
  permissionLevel: PermissionLevel
  department: string
}

// 奖项申请状态 - 三站联动流程
export type ApplicationStatus = 
  | 'draft'                    // 草稿（可编辑）
  | 'pending_level2_confirm'   // 等待部门确认（提交后进入此状态）
  | 'pending_level3_confirm'   // 部门已确认，等待最终审批
  | 'approved'                 // 最终通过
  | 'rejected'                 // 已驳回

// 进度历史记录
export interface ProgressHistoryItem {
  step: string           // submitted | level2_confirmed | level3_confirmed | rejected
  status: ApplicationStatus
  timestamp: string
  description: string
  operator?: string      // 操作人
}

// Level 2 确认信息
export interface Level2ConfirmInfo {
  confirmedBy: string
  confirmedByName: string
  confirmedAt: string
  department: string
  comment?: string
}

// Level 3 确认信息
export interface Level3ConfirmInfo {
  confirmedBy: string
  confirmedByName: string
  confirmedAt: string
  comment?: string
}

// 驳回信息
export interface RejectInfo {
  rejectedBy: string
  rejectedByName: string
  rejectedAt: string
  reason: string
  rejectLevel?: string
}

// 奖项申请
export interface AwardApplication {
  id: string
  employeeName: string
  employeeId: string
  department: string
  awardType: string
  awardName: string
  reason: string
  contact: string
  attachments?: string[]
  status: ApplicationStatus
  submitDate: string
  submitTime?: string
  updateDate?: string
  
  // 进度历史
  progressHistory?: ProgressHistoryItem[]
  
  // Level 2 确认信息
  level2ConfirmInfo?: Level2ConfirmInfo
  
  // Level 3 最终确认信息
  level3ConfirmInfo?: Level3ConfirmInfo
  
  // 最终审核信息
  confirmInfo?: {
    confirmedBy: string
    confirmedAt: string
    confirmedByName: string
    comment?: string
  }
  
  // 驳回信息
  rejectInfo?: RejectInfo
}

// FAQ项
export interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  sortOrder?: number
  enabled?: boolean
}

// 知识库条目
export interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: string
  sortOrder?: number
  enabled?: boolean
  createDate: string
  updateDate?: string
}

// 奖项类型
export interface AwardType {
  value: string
  label: string
  description?: string
  enabled?: boolean
}

// 部门
export interface Department {
  value: string
  label: string
  enabled?: boolean
}

// 白名单用户配置
export interface WhiteListUser {
  username: string
  permissionLevel: PermissionLevel
  department?: string
  name?: string
}

export const AWARD_TYPES: AwardType[] = [
  { value: 'monthly-star', label: '月度之星', description: '每月评选一次，表彰当月表现优异的员工' },
  { value: 'quarterly-excellent', label: '季度优秀', description: '每季度评选一次，表彰季度内做出突出贡献的员工' },
  { value: 'annual-best', label: '年度最佳', description: '年度评选，表彰年度最优秀的员工或团队' },
  { value: 'innovation', label: '创新贡献奖', description: '表彰在技术创新、业务创新方面有突出贡献的个人或团队' },
  { value: 'teamwork', label: '团队协作奖', description: '表彰在跨部门协作项目中表现突出的团队' },
  { value: 'special', label: '特殊贡献奖', description: '表彰在特殊事件或紧急任务中做出重要贡献的个人或团队' },
]

export const DEPARTMENTS: Department[] = [
  { value: 'tech', label: '技术部' },
  { value: 'product', label: '产品部' },
  { value: 'design', label: '设计部' },
  { value: 'operation', label: '运营部' },
  { value: 'marketing', label: '市场部' },
  { value: 'hr', label: '人力资源部' },
  { value: 'finance', label: '财务部' },
  { value: 'admin', label: '行政部' },
]

// 状态标签配置
export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: '草稿', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  pending_level2_confirm: { label: '部门确认中', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  pending_level3_confirm: { label: '最终审批中', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  approved: { label: '已通过', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: '已驳回', color: 'text-red-700', bgColor: 'bg-red-100' },
}

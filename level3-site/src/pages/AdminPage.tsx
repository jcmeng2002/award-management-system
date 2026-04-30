import { useState, useEffect, useCallback } from 'react'
import { AwardApplication, WhiteListUser, PermissionLevel, KnowledgeItem, PERMISSION_LEVELS, ApplicationStatus } from '../types'
import { useAuth } from '../hooks/useAuth'
import StatusBadge from '../components/StatusBadge'
import { Shield, BookOpen, FileCheck, Check, X, Plus, User, Award, Clock, CheckCircle, RefreshCw, ChevronDown, ChevronUp, Search, Filter, Star } from 'lucide-react'

const API_BASE = 'https://award-backend.pages.woa.com'
const ADMIN_TOKEN = 'award-system-admin-secret-key-2024'

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
    headers['X-Admin-Token'] = ADMIN_TOKEN
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}

const AdminPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'applications' | 'permissions' | 'knowledge'>('applications')
  const [apps, setApps] = useState<AwardApplication[]>([])
  const [permissions, setPermissions] = useState<WhiteListUser[]>([])
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState('')

  // 权限管理状态
  const [showAddPerm, setShowAddPerm] = useState(false)
  const [newPermUsername, setNewPermUsername] = useState('')
  const [newPermLevel, setNewPermLevel] = useState<PermissionLevel>(1)

  // 知识库管理状态
  const [showAddKno, setShowAddKno] = useState(false)
  const [editingKno, setEditingKno] = useState<KnowledgeItem | null>(null)
  const [knoForm, setKnoForm] = useState({ title: '', content: '', category: '' })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000) }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [appsRes, whitelistRes, knoRes] = await Promise.all([
        apiRequest<any>('/api/applications'),
        apiRequest<any>('/api/admin/whitelist'),
        apiRequest<any>('/api/knowledge'),
      ])
      if (appsRes.success && appsRes.data) setApps(appsRes.data)
      if (whitelistRes.success && whitelistRes.whiteList) setPermissions(whitelistRes.whiteList)
      if (knoRes.success && knoRes.data) setKnowledge(knoRes.data)
    } catch {
      setApps(JSON.parse(localStorage.getItem('awardApplications') || '[]'))
      setKnowledge([{ id: '1', title: '如何申请月度之星', content: '月度之星每月评选一次...', category: '申请指南', createDate: '2024-01-01' }])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Level 3 最终确认
  const handleFinalize = async (app: AwardApplication) => {
    if (!confirm(`最终确认申请「${app.awardName}」？确认后申请人将收到通过通知。`)) return
    
    try {
      await fetch(`${API_BASE}/api/level3/finalize/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmedBy: user?.employeeId || 'admin',
          confirmedByName: user?.name || '管理员',
        })
      })
      showToast('最终审批通过！')
      loadData()
    } catch {
      // fallback
      const updated = apps.map(a => a.id === app.id ? {
        ...a, 
        status: 'approved' as ApplicationStatus,
        level3ConfirmInfo: {
          confirmedBy: user?.employeeId || '',
          confirmedByName: user?.name || '',
          confirmedAt: new Date().toISOString(),
        }
      } : a)
      setApps(updated)
      localStorage.setItem('awardApplications', JSON.stringify(updated))
      showToast('最终审批通过！')
    }
  }

  // 驳回申请
  const handleReject = async (app: AwardApplication, reason: string) => {
    try {
      await fetch(`${API_BASE}/api/reject/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectedBy: user?.employeeId || 'admin',
          rejectedByName: user?.name || '管理员',
          reason,
          rejectLevel: 'level3',
        })
      })
      showToast('已驳回')
      loadData()
    } catch {
      // fallback
      const updated = apps.map(a => a.id === app.id ? {
        ...a, 
        status: 'rejected' as ApplicationStatus,
        rejectInfo: {
          rejectedBy: user?.employeeId || '',
          rejectedByName: user?.name || '',
          rejectedAt: new Date().toISOString(),
          reason,
          rejectLevel: 'level3',
        }
      } : a)
      setApps(updated)
      localStorage.setItem('awardApplications', JSON.stringify(updated))
      showToast('已驳回')
    }
  }

  // 权限管理
  const addNewPerm = async () => {
    if (!newPermUsername.trim()) return
    try {
      await apiRequest('/api/admin/whitelist/add', {
        method: 'POST',
        body: JSON.stringify({ username: newPermUsername, permissionLevel: newPermLevel, name: newPermUsername }),
      })
      showToast('已添加')
      setNewPermUsername(''); setNewPermLevel(1); setShowAddPerm(false)
      loadData()
    } catch { alert('添加失败，该用户可能已存在') }
  }

  const deletePerm = async (username: string) => {
    if (!confirm(`确定删除 ${username} 的权限配置？`)) return
    try {
      await apiRequest(`/api/admin/whitelist/${username}`, { method: 'DELETE' })
      showToast('已删除')
      loadData()
    } catch { alert('删除失败') }
  }

  // 知识库管理
  const saveKno = async () => {
    try {
      if (editingKno) {
        await apiRequest(`/api/admin/knowledge/${editingKno.id}`, {
          method: 'PUT',
          body: JSON.stringify(knoForm),
        })
        showToast('已更新')
      } else {
        await apiRequest('/api/admin/knowledge', {
          method: 'POST',
          body: JSON.stringify(knoForm),
        })
        showToast('已添加')
      }
      setShowAddKno(false); setEditingKno(null); setKnoForm({ title: '', content: '', category: '' })
      loadData()
    } catch { alert('保存失败') }
  }

  const deleteKno = async (id: string) => {
    if (!confirm('确定删除？')) return
    try {
      await apiRequest(`/api/admin/knowledge/${id}`, { method: 'DELETE' })
      showToast('已删除')
      loadData()
    } catch { alert('删除失败') }
  }

  // 筛选申请
  const filteredApps = apps.filter(app => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      return (
        app.awardName.toLowerCase().includes(keyword) ||
        app.employeeName.toLowerCase().includes(keyword) ||
        app.department.toLowerCase().includes(keyword)
      )
    }
    return true
  })

  // 待最终审批的申请
  const pendingApps = apps.filter(a => a.status === 'pending_level3_confirm')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {toast && <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary mb-2">管理后台</h1>
          <p className="text-gray-600">最终审批 · 权限配置和知识库管理</p>
        </div>
        <button onClick={loadData} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{pendingApps.length}</div>
          <div className="text-sm text-gray-500">待最终审批</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{apps.filter(a => a.status === 'pending_level2_confirm').length}</div>
          <div className="text-sm text-gray-500">部门确认中</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{apps.filter(a => a.status === 'approved').length}</div>
          <div className="text-sm text-gray-500">已通过</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{apps.filter(a => a.status === 'rejected').length}</div>
          <div className="text-sm text-gray-500">已驳回</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{apps.length}</div>
          <div className="text-sm text-gray-500">总申请数</div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
        <button onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'applications' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <FileCheck className="w-5 h-5" /> 审批申请
          {pendingApps.length > 0 && <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{pendingApps.length}</span>}
        </button>
        <button onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'permissions' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Shield className="w-5 h-5" /> 权限名单
          <span className="ml-1 px-2 py-0.5 bg-gray-300 text-gray-700 text-xs rounded-full">{permissions.length}</span>
        </button>
        <button onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'knowledge' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <BookOpen className="w-5 h-5" /> 知识库
          <span className="ml-1 px-2 py-0.5 bg-gray-300 text-gray-700 text-xs rounded-full">{knowledge.length}</span>
        </button>
      </div>

      {activeTab === 'applications' && (
        <div>
          {/* 筛选工具栏 */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索申请人、奖项名称..."
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">全部状态</option>
                  <option value="pending_level2_confirm">部门确认中</option>
                  <option value="pending_level3_confirm">待最终审批</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已驳回</option>
                </select>
              </div>
            </div>
          </div>

          {/* 待最终审批高亮区 */}
          {pendingApps.length > 0 && filterStatus === 'all' && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-purple-600 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                待最终审批 ({pendingApps.length})
              </h2>
              <div className="space-y-4">
                {pendingApps.map(app => (
                  <div key={app.id} className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{app.awardName}</h3>
                          <StatusBadge status={app.status} />
                        </div>
                        <p className="text-gray-600">{app.awardType} · {app.department}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleFinalize(app)} 
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" /> 最终通过
                        </button>
                        <button 
                          onClick={() => { const r = prompt('请输入驳回原因：'); if (r) handleReject(app, r); }} 
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <X className="w-4 h-4" /> 驳回
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2"><User className="w-4 h-4" /> {app.employeeName} ({app.employeeId})</div>
                      <div><Award className="w-4 h-4 inline" /> {app.department}</div>
                      <div><Clock className="w-4 h-4 inline" /> {app.submitDate}</div>
                    </div>
                    {/* 部门已确认的提示 */}
                    {app.level2ConfirmInfo && (
                      <div className="mt-3 bg-blue-100 rounded-lg p-2 text-sm text-blue-700">
                        部门已确认：{app.level2ConfirmInfo.confirmedByName} · {new Date(app.level2ConfirmInfo.confirmedAt).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-sm text-gray-600"><span className="font-medium">申报理由：</span>{app.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 全部申请列表 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">全部申请 ({filteredApps.length})</h2>
            {filteredApps.length === 0 ? (
              <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary">暂无申请记录</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApps.map(app => {
                  const isExpanded = expandedId === app.id
                  const isPendingFinal = app.status === 'pending_level3_confirm'
                  
                  return (
                    <div key={app.id} className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{app.awardName}</h3>
                            <StatusBadge status={app.status} />
                          </div>
                          <p className="text-gray-600">{app.awardType} · {app.department}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {app.submitDate}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2"><User className="w-4 h-4" /> {app.employeeName} ({app.employeeId})</div>
                        <div><Award className="w-4 h-4 inline" /> {app.department}</div>
                        <div><Clock className="w-4 h-4 inline" /> {app.submitDate}</div>
                      </div>
                      
                      {/* 操作按钮 */}
                      {isPendingFinal && (
                        <div className="mt-4 pt-4 border-t flex gap-2">
                          <button 
                            onClick={() => handleFinalize(app)} 
                            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Check className="w-4 h-4" /> 最终通过
                          </button>
                          <button 
                            onClick={() => { const r = prompt('请输入驳回原因：'); if (r) handleReject(app, r); }} 
                            className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <X className="w-4 h-4" /> 驳回
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        className="mt-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                      >
                        {isExpanded ? <>收起详情 <ChevronUp className="w-4 h-4" /></> : <>查看详情 <ChevronDown className="w-4 h-4" /></>}
                      </button>
                      
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-gray-600 mb-4"><span className="font-medium">申报理由：</span>{app.reason}</p>
                          
                          {app.level2ConfirmInfo && (
                            <div className="bg-blue-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-blue-700">部门已确认：{app.level2ConfirmInfo.confirmedByName} · {app.level2ConfirmInfo.department}</p>
                            </div>
                          )}
                          
                          {app.progressHistory && app.progressHistory.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">审批历史</h4>
                              {app.progressHistory.map((item, idx) => (
                                <div key={idx} className="text-sm text-gray-600 mb-1 flex items-start gap-2">
                                  <span className="text-gray-400">•</span>
                                  <span>{item.description}</span>
                                  {item.operator && <span className="text-gray-400">({item.operator})</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {app.rejectInfo && (
                            <div className="mt-4 bg-red-50 rounded-lg p-3 border border-red-100">
                              <p className="text-red-600 text-sm">驳回原因：{app.rejectInfo.reason}</p>
                              <p className="text-red-400 text-xs mt-1">驳回人：{app.rejectInfo.rejectedByName}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">权限名单</h3>
              <span className="text-xs text-gray-500">（修改后立即生效于所有子站）</span>
            </div>
            <button onClick={() => setShowAddPerm(true)} className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Plus className="w-4 h-4" /> 添加用户</button>
          </div>
          
          {showAddPerm && (
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex gap-4 items-end">
                <div><label className="block text-sm mb-1">用户名</label><input type="text" value={newPermUsername} onChange={e => setNewPermUsername(e.target.value)} placeholder="OA账号" className="px-3 py-2 border rounded-lg w-40" /></div>
                <div><label className="block text-sm mb-1">权限等级</label><select value={newPermLevel} onChange={e => setNewPermLevel(Number(e.target.value) as PermissionLevel)} className="px-3 py-2 border rounded-lg">
                  <option value={1}>普通员工</option><option value={2}>部门负责人</option><option value={3}>管理员</option>
                </select></div>
                <button onClick={addNewPerm} className="px-4 py-2 bg-purple-600 text-white rounded-lg">添加</button>
                <button onClick={() => setShowAddPerm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">取消</button>
              </div>
            </div>
          )}

          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户名</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-600">权限等级</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-600">权限说明</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-600">操作</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {permissions.map(u => (
                <tr key={u.username}>
                  <td className="px-4 py-3">{u.username}<span className="ml-2 text-xs text-gray-400">{u.name || ''}</span></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${u.permissionLevel === 3 ? 'bg-purple-100 text-purple-700' : u.permissionLevel === 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {PERMISSION_LEVELS[u.permissionLevel as PermissionLevel]?.name || '普通员工'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{PERMISSION_LEVELS[u.permissionLevel as PermissionLevel]?.description || ''}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deletePerm(u.username)} className="text-red-600 hover:text-red-700">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">知识库</h3>
              <span className="text-xs text-gray-500">（修改后立即生效于所有子站）</span>
            </div>
            <button onClick={() => { setEditingKno(null); setKnoForm({ title: '', content: '', category: '' }); setShowAddKno(true); }} className="flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"><Plus className="w-4 h-4" /> 添加</button>
          </div>

          {showAddKno && (
            <div className="p-4 bg-gray-50 border-b space-y-3">
              <input type="text" value={knoForm.title} onChange={e => setKnoForm({...knoForm, title: e.target.value})} placeholder="标题" className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" value={knoForm.category} onChange={e => setKnoForm({...knoForm, category: e.target.value})} placeholder="分类" className="w-full px-3 py-2 border rounded-lg" />
              <textarea value={knoForm.content} onChange={e => setKnoForm({...knoForm, content: e.target.value})} placeholder="内容" rows={4} className="w-full px-3 py-2 border rounded-lg resize-none" />
              <div className="flex gap-2"><button onClick={saveKno} className="px-4 py-2 bg-orange-600 text-white rounded-lg">保存</button><button onClick={() => setShowAddKno(false)} className="px-4 py-2 bg-gray-200 rounded-lg">取消</button></div>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {knowledge.map(item => (
              <div key={item.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3"><h4 className="font-medium">{item.title}</h4><span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{item.category}</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingKno(item); setKnoForm({ title: item.title, content: item.content, category: item.category }); setShowAddKno(true); }} className="text-blue-600 hover:text-blue-700">编辑</button>
                    <button onClick={() => deleteKno(item.id)} className="text-red-600 hover:text-red-700">删除</button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage

import { useState, useEffect, useCallback } from 'react'
import { AwardApplication, ApplicationStatus } from '../types'
import { useAuth } from '../hooks/useAuth'
import StatusBadge from '../components/StatusBadge'
import { FileCheck, Check, X, User, Award, Clock, RefreshCw, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react'

const API_BASE = 'https://backend-q1g5ha63e-jcmeng2002s-projects.vercel.app'

const AdminPage = () => {
  const { user } = useAuth()
  const [apps, setApps] = useState<AwardApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000) }

  // 加载所有申请
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/applications`)
      const data = await res.json()
      if (data.success && data.data) {
        setApps(data.data)
      }
    } catch {
      // fallback to localStorage
      setApps(JSON.parse(localStorage.getItem('awardApplications') || '[]'))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Level 2 确认申请
  const handleConfirm = async (app: AwardApplication) => {
    if (!confirm(`确认申请「${app.awardName}」？确认后将提交给最终审批。`)) return
    
    try {
      await fetch(`${API_BASE}/api/level2/confirm/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmedBy: user?.employeeId || '',
          confirmedByName: user?.name || '',
          department: user?.department || app.department,
        })
      })
      showToast('确认成功！')
      loadData()
    } catch {
      // fallback
      const updated = apps.map(a => a.id === app.id ? {
        ...a, 
        status: 'pending_level3_confirm' as ApplicationStatus,
        level2ConfirmInfo: {
          confirmedBy: user?.employeeId || '',
          confirmedByName: user?.name || '',
          confirmedAt: new Date().toISOString(),
          department: user?.department || a.department,
        }
      } : a)
      setApps(updated)
      localStorage.setItem('awardApplications', JSON.stringify(updated))
      showToast('确认成功！')
    }
  }

  // 驳回申请
  const handleReject = async (app: AwardApplication, reason: string) => {
    try {
      await fetch(`${API_BASE}/api/reject/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectedBy: user?.employeeId || '',
          rejectedByName: user?.name || '',
          reason,
          rejectLevel: 'level2',
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
          rejectLevel: 'level2',
        }
      } : a)
      setApps(updated)
      localStorage.setItem('awardApplications', JSON.stringify(updated))
      showToast('已驳回')
    }
  }

  // 筛选申请
  const filteredApps = apps.filter(app => {
    // 状态筛选
    if (filterStatus !== 'all' && app.status !== filterStatus) return false
    // 关键词筛选
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

  // 待确认的申请
  const pendingApps = apps.filter(a => a.status === 'pending_level2_confirm')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary mb-2">部门确认</h1>
          <p className="text-gray-600">确认员工提交的奖项申请，确认后提交给最终审批</p>
        </div>
        <button 
          onClick={loadData} 
          disabled={loading} 
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{pendingApps.length}</div>
          <div className="text-sm text-gray-500">待确认</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{apps.filter(a => a.status === 'pending_level3_confirm').length}</div>
          <div className="text-sm text-gray-500">等待最终审批</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{apps.filter(a => a.status === 'approved').length}</div>
          <div className="text-sm text-gray-500">已通过</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{apps.length}</div>
          <div className="text-sm text-gray-500">总申请数</div>
        </div>
      </div>

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
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="pending_level2_confirm">待确认</option>
              <option value="pending_level3_confirm">等待最终审批</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
        </div>
      </div>

      {/* 待确认申请高亮区 */}
      {pendingApps.length > 0 && filterStatus === 'all' && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-blue-600 mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            待确认申请 ({pendingApps.length})
          </h2>
          <div className="space-y-4">
            {pendingApps.map(app => (
              <div key={app.id} className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
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
                      onClick={() => handleConfirm(app)} 
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4" /> 确认
                    </button>
                    <button 
                      onClick={() => { const r = prompt('请输入驳回原因：'); if (r) handleReject(app, r); }} 
                      className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-gray-600"><span className="font-medium">申报理由：</span>{app.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 所有申请列表 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">全部申请 ({filteredApps.length})</h2>
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500">暂无申请记录</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map(app => {
              const isExpanded = expandedId === app.id
              const isPending = app.status === 'pending_level2_confirm'
              
              return (
                <div 
                  key={app.id} 
                  className={`bg-white rounded-xl p-6 border ${
                    isPending ? 'border-gray-200' : 'border-gray-200 hover:border-gray-300'
                  } transition-colors`}
                >
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
                  
                  {/* 操作按钮（仅待确认状态显示） */}
                  {isPending && (
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <button 
                        onClick={() => handleConfirm(app)} 
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" /> 确认
                      </button>
                      <button 
                        onClick={() => { const r = prompt('请输入驳回原因：'); if (r) handleReject(app, r); }} 
                        className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" /> 驳回
                      </button>
                    </div>
                  )}
                  
                  {/* 展开详情 */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    className="mt-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {isExpanded ? (
                      <>收起详情 <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>查看详情 <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-4"><span className="font-medium">申报理由：</span>{app.reason}</p>
                      
                      {/* 进度历史 */}
                      {app.progressHistory && app.progressHistory.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">审批历史</h4>
                          {app.progressHistory.map((item, idx) => (
                            <div key={idx} className="text-sm text-gray-600 mb-1 flex items-start gap-2">
                              <span className="text-gray-400">•</span>
                              <span>{item.description}</span>
                              {item.operator && <span className="text-gray-400">({item.operator})</span>}
                              <span className="text-gray-400 ml-auto">
                                {new Date(item.timestamp).toLocaleString('zh-CN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* 驳回信息 */}
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
  )
}

export default AdminPage

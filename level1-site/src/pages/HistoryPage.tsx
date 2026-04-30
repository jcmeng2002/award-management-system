import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AwardApplication } from '../types'
import { useAuth } from '../hooks/useAuth'
import StatusBadge from '../components/StatusBadge'
import { Clock, Edit, Trash2, Send, CheckCircle, XCircle, Building, User, Award, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

const API_BASE = 'https://backend-olm05emkg-jcmeng2002s-projects.vercel.app'

const HistoryPage = () => {
  const [myApps, setMyApps] = useState<AwardApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  // 从后端加载申请记录
  const loadMyApplications = useCallback(async () => {
    if (!user?.employeeId) return
    
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/my-applications?employeeId=${user.employeeId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setMyApps(data.data)
      }
    } catch {
      // fallback to localStorage
      const all: AwardApplication[] = JSON.parse(localStorage.getItem('awardApplications') || '[]')
      const mine = all.filter(app => app.employeeId === user?.employeeId)
      setMyApps(mine.sort((a, b) => new Date(b.submitDate).getTime() - new Date(a.submitDate).getTime()))
    }
    setLoading(false)
  }, [user?.employeeId])

  useEffect(() => {
    if (!user) return
    loadMyApplications()
    
    // 每 30 秒自动刷新一次，获取最新进度
    const interval = setInterval(loadMyApplications, 30000)
    return () => clearInterval(interval)
  }, [user, loadMyApplications])

  const deleteApp = async (id: string) => {
    if (!confirm('确定要删除这条申请吗？')) return
    try {
      // 尝试从后端删除
      await fetch(`${API_BASE}/api/admin/applications/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Token': 'award-system-admin-secret-key-2024' }
      })
    } catch {}
    // fallback localStorage
    const all: AwardApplication[] = JSON.parse(localStorage.getItem('awardApplications') || '[]')
    const filtered = all.filter(app => app.id !== id)
    localStorage.setItem('awardApplications', JSON.stringify(filtered))
    loadMyApplications()
  }

  const submitApp = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/level2/confirm/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmedBy: user?.employeeId,
          confirmedByName: user?.name,
          department: user?.department,
        })
      })
    } catch {}
    // fallback localStorage
    const all: AwardApplication[] = JSON.parse(localStorage.getItem('awardApplications') || '[]')
    const updated = all.map(app => 
      app.id === id ? { ...app, status: 'pending_level2_confirm' as const, submitDate: new Date().toISOString().split('T')[0] } : app
    )
    localStorage.setItem('awardApplications', JSON.stringify(updated))
    loadMyApplications()
  }

  // 渲染进度步骤
  const renderProgressSteps = (app: AwardApplication) => {
    const steps = [
      { key: 'submitted', label: '提交申请', icon: Send },
      { key: 'level2_confirmed', label: '部门确认', icon: CheckCircle },
      { key: 'level3_confirmed', label: '最终审批', icon: Award },
    ]
    
    const history = app.progressHistory || []
    const currentStep = app.status === 'draft' ? -1 
      : app.status === 'pending_level2_confirm' ? 0
      : app.status === 'pending_level3_confirm' ? 1
      : app.status === 'approved' ? 2
      : -1
    
    return (
      <div className="mt-4 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">审批进度</h4>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const historyItem = history.find(h => h.step === step.key)
            const isCompleted = index < currentStep || (index === currentStep && app.status === 'approved')
            const isCurrent = index === currentStep && app.status !== 'approved' && app.status !== 'rejected' && app.status !== 'draft'
            const Icon = step.icon
            
            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-500 text-white' 
                    : isCurrent ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs mt-1 ${isCompleted || isCurrent ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </span>
                {historyItem && (
                  <span className="text-xs text-gray-400 mt-0.5">
                    {new Date(historyItem.timestamp).toLocaleDateString('zh-CN')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        
        {/* 驳回状态特殊显示 */}
        {app.status === 'rejected' && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <XCircle className="w-4 h-4" />
            <span>申请已被驳回：{app.rejectInfo?.reason || '审核未通过'}</span>
          </div>
        )}
        
        {/* 历史详情 */}
        {history.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {history.map((item, idx) => (
              <div key={idx} className="text-xs text-gray-600 mb-1 flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{item.description}</span>
                {item.operator && <span className="text-gray-400">({item.operator})</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary mb-2">我的记录</h1>
          <p className="text-gray-600">查看和管理您提交的所有奖项申请 · 数据实时同步</p>
        </div>
        <button
          onClick={loadMyApplications}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {myApps.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-border text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-secondary mb-2">暂无申请记录</h3>
          <p className="text-gray-500 mb-6">您还没有提交过任何奖项申请</p>
          <button
            onClick={() => navigate('/apply')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            立即申请
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myApps.map((app) => {
            const canEdit = app.status === 'draft'
            const canDelete = app.status === 'draft'
            const canSubmit = app.status === 'draft'
            const isExpanded = expandedId === app.id

            return (
              <div key={app.id} className="bg-white rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-secondary">
                        {app.awardName}
                      </h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-gray-600 text-sm">
                      {app.awardType} · {app.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {app.submitDate}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {app.employeeName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {app.department}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {canSubmit && (
                      <button
                        onClick={() => submitApp(app.id)}
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Send className="w-4 h-4" />
                        提交
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => navigate(`/apply?edit=${app.id}`)}
                        className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        编辑
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => deleteApp(app.id)}
                        className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    )}
                  </div>
                  
                  {/* 展开详情按钮 */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {isExpanded ? (
                      <>
                        收起详情 <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        查看详情 <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* 详情展开 */}
                {isExpanded && (
                  <>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600"><span className="font-medium">申报理由：</span>{app.reason}</p>
                    </div>
                    {renderProgressSteps(app)}
                    
                    {/* 确认信息 */}
                    {app.level2ConfirmInfo && (
                      <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          部门已确认 by {app.level2ConfirmInfo.confirmedByName} ({new Date(app.level2ConfirmInfo.confirmedAt).toLocaleDateString('zh-CN')})
                        </div>
                        {app.level2ConfirmInfo.comment && <p className="text-blue-600 text-sm mt-1">备注：{app.level2ConfirmInfo.comment}</p>}
                      </div>
                    )}
                    {app.level3ConfirmInfo && (
                      <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-100">
                        <div className="flex items-center gap-2 text-green-700 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          最终审批已通过 by {app.level3ConfirmInfo.confirmedByName} ({new Date(app.level3ConfirmInfo.confirmedAt).toLocaleDateString('zh-CN')})
                        </div>
                        {app.level3ConfirmInfo.comment && <p className="text-green-600 text-sm mt-1">备注：{app.level3ConfirmInfo.comment}</p>}
                      </div>
                    )}
                    {app.rejectInfo && (
                      <div className="mt-4 bg-red-50 rounded-lg p-3 border border-red-100">
                        <div className="flex items-center gap-2 text-red-700 text-sm">
                          <XCircle className="w-4 h-4" />
                          申请已驳回 ({new Date(app.rejectInfo.rejectedAt).toLocaleDateString('zh-CN')})
                        </div>
                        <p className="text-red-600 text-sm mt-1">原因：{app.rejectInfo.reason}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HistoryPage

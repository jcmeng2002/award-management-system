import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AwardApplication } from '../types'
import { useAuth } from '../hooks/useAuth'
import StatusBadge from '../components/StatusBadge'
import { Clock, Edit, Trash2, Send, CheckCircle, XCircle, Building, User, Award } from 'lucide-react'

const HistoryPage = () => {
  const [myApps, setMyApps] = useState<AwardApplication[]>([])
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    loadMyApplications()
  }, [user])

  const loadMyApplications = () => {
    const all: AwardApplication[] = JSON.parse(localStorage.getItem('awardApplications') || '[]')
    const mine = all.filter(app => app.employeeId === user?.employeeId)
    setMyApps(mine.sort((a, b) => new Date(b.submitDate).getTime() - new Date(a.submitDate).getTime()))
  }

  const deleteApp = (id: string) => {
    if (!confirm('确定要删除这条申请吗？')) return
    const all: AwardApplication[] = JSON.parse(localStorage.getItem('awardApplications') || '[]')
    const filtered = all.filter(app => app.id !== id)
    localStorage.setItem('awardApplications', JSON.stringify(filtered))
    loadMyApplications()
  }

  const submitApp = (id: string) => {
    const all: AwardApplication[] = JSON.parse(localStorage.getItem('awardApplications') || '[]')
    const updated = all.map(app => 
      app.id === id ? { ...app, status: 'pending_confirm' as const, submitDate: new Date().toISOString().split('T')[0] } : app
    )
    localStorage.setItem('awardApplications', JSON.stringify(updated))
    loadMyApplications()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary mb-2">我的记录</h1>
        <p className="text-gray-600">查看和管理您提交的所有奖项申请</p>
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

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
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
                </div>

                {/* 审核/驳回信息 */}
                {app.confirmInfo && (
                  <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      已确认 by {app.confirmInfo.confirmedByName} ({app.confirmInfo.confirmedAt})
                    </div>
                    {app.confirmInfo.comment && <p className="text-green-600 text-sm mt-1">{app.confirmInfo.comment}</p>}
                  </div>
                )}
                {app.rejectInfo && (
                  <div className="mt-4 bg-red-50 rounded-lg p-3 border border-red-100">
                    <div className="flex items-center gap-2 text-red-700 text-sm">
                      <XCircle className="w-4 h-4" />
                      已驳回 ({app.rejectInfo.rejectedAt})
                    </div>
                    <p className="text-red-600 text-sm mt-1">原因：{app.rejectInfo.reason}</p>
                  </div>
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

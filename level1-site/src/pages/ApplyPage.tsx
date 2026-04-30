import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AwardApplication } from '../types'
import { useAuth } from '../hooks/useAuth'
import { Save, Send, ArrowLeft, AlertCircle } from 'lucide-react'
import { applicationApi, configApi } from '../services/api'

const ApplyPage = () => {
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    awardType: '',
    awardName: '',
    reason: '',
    contact: user?.employeeId || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [awardTypes, setAwardTypes] = useState<any[]>([])

  // 加载奖项类型
  useEffect(() => {
    configApi.awardTypes().then(res => {
      if (res.success && res.data) setAwardTypes(res.data.filter((t: any) => t.enabled !== false))
    }).catch(() => {
      // fallback
      setAwardTypes([])
    })
  }, [])

  useEffect(() => {
    if (editId && user?.employeeId) {
      applicationApi.myList(user.employeeId).then(res => {
        if (res.success && res.data) {
          const app = res.data.find((a: any) => a.id === editId)
          if (app) {
            setForm({ awardType: app.awardType, awardName: app.awardName, reason: app.reason, contact: app.contact || '' })
          }
        }
      }).catch(() => {
        // fallback to localStorage
        const all: AwardApplication[] = JSON.parse(localStorage.getItem('awardApplications') || '[]')
        const app = all.find(a => a.id === editId)
        if (app) setForm({ awardType: app.awardType, awardName: app.awardName, reason: app.reason, contact: app.contact || '' })
      })
    }
  }, [editId, user])

  const handleSave = async (submit: boolean) => {
    if (!form.awardType || !form.awardName || !form.reason) {
      setError('请填写完整的申请信息')
      return
    }
    setError('')
    setIsSubmitting(true)

    try {
      if (submit) {
        // 提交申请 -> 自动进入 pending_level2_confirm 状态
        await applicationApi.submit({
          employeeName: user?.name || '',
          employeeId: user?.employeeId || '',
          department: user?.department || '',
          awardType: form.awardType,
          awardName: form.awardName,
          reason: form.reason,
          contact: form.contact,
        })
      } else {
        // 保存草稿 -> 只存 localStorage
        const all: AwardApplication[] = JSON.parse(localStorage.getItem('awardApplications') || '[]')
        all.push({
          id: Date.now().toString(),
          employeeName: user?.name || '',
          employeeId: user?.employeeId || '',
          department: user?.department || '',
          awardType: form.awardType,
          awardName: form.awardName,
          reason: form.reason,
          contact: form.contact,
          status: 'draft',
          submitDate: new Date().toISOString().split('T')[0],
        })
        localStorage.setItem('awardApplications', JSON.stringify(all))
      }
      navigate('/history')
    } catch {
      // fallback
      const all: AwardApplication[] = JSON.parse(localStorage.getItem('awardApplications') || '[]')
      all.push({
        id: Date.now().toString(),
        employeeName: user?.name || '',
        employeeId: user?.employeeId || '',
        department: user?.department || '',
        awardType: form.awardType,
        awardName: form.awardName,
        reason: form.reason,
        contact: form.contact,
        status: submit ? 'pending_level2_confirm' : 'draft',
        submitDate: new Date().toISOString().split('T')[0],
      })
      localStorage.setItem('awardApplications', JSON.stringify(all))
      navigate('/history')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary mb-2">
            {editId ? '编辑申请' : '提交奖项申请'}
          </h1>
          <p className="text-gray-600">填写奖项申请信息 · 提交后将进入部门确认流程</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 border border-border">
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* 奖项类型 */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              奖项类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.awardType}
              onChange={(e) => setForm({ ...form, awardType: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              <option value="">请选择奖项类型</option>
              {awardTypes.map(type => (
                <option key={type.value} value={type.label}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* 奖项名称 */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              奖项名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.awardName}
              onChange={(e) => setForm({ ...form, awardName: e.target.value })}
              placeholder="请输入奖项名称"
              className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* 申报理由 */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              申报理由 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={6}
              placeholder="请详细描述申报理由和主要事迹"
              className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* 联系方式 */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              联系方式
            </label>
            <input
              type="text"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              placeholder="请输入联系方式"
              className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* 提交信息 */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p>提交人：{user?.name}</p>
            <p>工号：{user?.employeeId}</p>
            <p>部门：{user?.department}</p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              保存草稿
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              提交申请
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplyPage

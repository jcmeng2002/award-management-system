import { useState, useEffect } from 'react'
import { AwardApplication, WhiteListUser, PermissionLevel, KnowledgeItem, PERMISSION_LEVELS } from '../types'
import { useAuth } from '../hooks/useAuth'
import StatusBadge from '../components/StatusBadge'
import { getUserPermissions, setUserPermissions } from '../hooks/useAuth'
import { 
  Shield, BookOpen, FileCheck, Check, X, Plus, 
  User, Award, Clock, CheckCircle
} from 'lucide-react'

const defaultKnowledge: KnowledgeItem[] = [
  { id: '1', title: '如何申请月度之星', content: '月度之星每月评选一次...', category: '申请指南', createDate: '2024-01-01' },
]

const AdminPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'applications' | 'permissions' | 'knowledge'>('applications')
  const [apps, setApps] = useState<AwardApplication[]>([])
  const [permissions, setPermissions] = useState<WhiteListUser[]>([])
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([])
  const [editingPerm, setEditingPerm] = useState<string | null>(null)
  const [permLevel, setPermLevel] = useState<PermissionLevel>(1)
  const [showAddPerm, setShowAddPerm] = useState(false)
  const [newPermUsername, setNewPermUsername] = useState('')
  const [newPermLevel, setNewPermLevel] = useState<PermissionLevel>(1)
  const [showAddKno, setShowAddKno] = useState(false)
  const [editingKno, setEditingKno] = useState<KnowledgeItem | null>(null)
  const [knoForm, setKnoForm] = useState({ title: '', content: '', category: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setApps(JSON.parse(localStorage.getItem('awardApplications') || '[]'))
    setPermissions(getUserPermissions())
    setKnowledge(JSON.parse(localStorage.getItem('awardKnowledge') || JSON.stringify(defaultKnowledge)))
  }

  const handleConfirm = (app: AwardApplication) => {
    const updated = apps.map(a => a.id === app.id ? {
      ...a, status: 'approved' as const,
      confirmInfo: { confirmedBy: user?.employeeId || '', confirmedAt: new Date().toISOString().split('T')[0], confirmedByName: user?.name || '' }
    } : a)
    setApps(updated)
    localStorage.setItem('awardApplications', JSON.stringify(updated))
  }

  const handleReject = (app: AwardApplication, reason: string) => {
    const updated = apps.map(a => a.id === app.id ? {
      ...a, status: 'rejected' as const,
      rejectInfo: { rejectedBy: user?.employeeId || '', rejectedAt: new Date().toISOString().split('T')[0], reason }
    } : a)
    setApps(updated)
    localStorage.setItem('awardApplications', JSON.stringify(updated))
  }

  const savePermLevel = (username: string) => {
    const updated = permissions.map(u => 
      u.username.toLowerCase() === username.toLowerCase() 
        ? { ...u, permissionLevel: permLevel } 
        : u
    )
    setUserPermissions(updated)
    setEditingPerm(null)
    setPermissions(updated)
  }

  const addNewPerm = () => {
    if (!newPermUsername.trim()) return
    const existing = permissions.find(u => u.username.toLowerCase() === newPermUsername.toLowerCase())
    if (existing) {
      alert('该用户已在权限列表中')
      return
    }
    const updated = [...permissions, { 
      username: newPermUsername, 
      permissionLevel: newPermLevel,
      name: newPermUsername
    }]
    setUserPermissions(updated)
    setNewPermUsername('')
    setNewPermLevel(1)
    setShowAddPerm(false)
    setPermissions(updated)
  }

  const deletePerm = (username: string) => {
    if (!confirm(`确定删除 ${username} 的权限配置？`)) return
    const updated = permissions.filter(u => u.username.toLowerCase() !== username.toLowerCase())
    setUserPermissions(updated)
    setPermissions(updated)
  }

  const saveKno = () => {
    const now = new Date().toISOString().split('T')[0]
    let updated: KnowledgeItem[]
    if (editingKno) {
      updated = knowledge.map(k => k.id === editingKno.id ? { ...k, ...knoForm, updateDate: now } : k)
    } else {
      updated = [...knowledge, { id: Date.now().toString(), ...knoForm, createDate: now }]
    }
    setKnowledge(updated)
    localStorage.setItem('awardKnowledge', JSON.stringify(updated))
    setShowAddKno(false)
    setEditingKno(null)
    setKnoForm({ title: '', content: '', category: '' })
  }

  const deleteKno = (id: string) => {
    if (!confirm('确定删除？')) return
    const updated = knowledge.filter(k => k.id !== id)
    setKnowledge(updated)
    localStorage.setItem('awardKnowledge', JSON.stringify(updated))
  }

  const pendingApps = apps.filter(a => a.status === 'pending_confirm')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary mb-2">管理后台</h1>
        <p className="text-gray-600">管理系统申请、权限配置和知识库</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4">
        <button onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'applications' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <FileCheck className="w-5 h-5" />
          审核申请
          {pendingApps.length > 0 && <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{pendingApps.length}</span>}
        </button>
        <button onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'permissions' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Shield className="w-5 h-5" />
          权限配置
        </button>
        <button onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'knowledge' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <BookOpen className="w-5 h-5" />
          知识库
        </button>
      </div>

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {pendingApps.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-border text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary">暂无待审核申请</h3>
            </div>
          ) : (
            pendingApps.map(app => (
              <div key={app.id} className="bg-white rounded-xl p-6 border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{app.awardName}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-gray-600">{app.awardType} · {app.department}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleConfirm(app)} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Check className="w-4 h-4" /> 通过
                    </button>
                    <button onClick={() => { const r = prompt('请输入驳回原因：'); if (r) handleReject(app, r); }} className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      <X className="w-4 h-4" /> 驳回
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><User className="w-4 h-4" /> {app.employeeName} ({app.employeeId})</div>
                  <div><Award className="w-4 h-4 inline" /> {app.department}</div>
                  <div><Clock className="w-4 h-4 inline" /> {app.submitDate}</div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600"><span className="font-medium">申报理由：</span>{app.reason}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-semibold">权限名单</h3>
            <button onClick={() => setShowAddPerm(true)} className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              <Plus className="w-4 h-4" /> 添加用户
            </button>
          </div>
          
          {showAddPerm && (
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex gap-4 items-end">
                <div>
                  <label className="block text-sm mb-1">用户名</label>
                  <input type="text" value={newPermUsername} onChange={e => setNewPermUsername(e.target.value)} placeholder="OA账号" className="px-3 py-2 border rounded-lg w-40" />
                </div>
                <div>
                  <label className="block text-sm mb-1">权限等级</label>
                  <select value={newPermLevel} onChange={e => setNewPermLevel(Number(e.target.value) as PermissionLevel)} className="px-3 py-2 border rounded-lg">
                    <option value={1}>普通员工</option>
                    <option value={2}>部门负责人</option>
                    <option value={3}>管理员</option>
                  </select>
                </div>
                <button onClick={addNewPerm} className="px-4 py-2 bg-primary text-white rounded-lg">添加</button>
                <button onClick={() => setShowAddPerm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">取消</button>
              </div>
            </div>
          )}

          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">权限等级</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">权限说明</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {permissions.map(u => (
                <tr key={u.username}>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3">
                    {editingPerm === u.username ? (
                      <select value={permLevel} onChange={e => setPermLevel(Number(e.target.value) as PermissionLevel)} className="px-2 py-1 border rounded">
                        <option value={1}>普通员工</option>
                        <option value={2}>部门负责人</option>
                        <option value={3}>管理员</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.permissionLevel === 3 ? 'bg-purple-100 text-purple-700' :
                        u.permissionLevel === 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {PERMISSION_LEVELS[u.permissionLevel].name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{PERMISSION_LEVELS[u.permissionLevel].description}</td>
                  <td className="px-4 py-3 text-right">
                    {editingPerm === u.username ? (
                      <>
                        <button onClick={() => savePermLevel(u.username)} className="text-green-600 hover:text-green-700 mr-3">保存</button>
                        <button onClick={() => setEditingPerm(null)} className="text-gray-500 hover:text-gray-600">取消</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingPerm(u.username); setPermLevel(u.permissionLevel); }} className="text-blue-600 hover:text-blue-700 mr-3">编辑</button>
                        <button onClick={() => deletePerm(u.username)} className="text-red-600 hover:text-red-700">删除</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Knowledge Tab */}
      {activeTab === 'knowledge' && (
        <div className="bg-white rounded-xl border border-border">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-semibold">知识库管理</h3>
            <button onClick={() => { setEditingKno(null); setKnoForm({ title: '', content: '', category: '' }); setShowAddKno(true); }} className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              <Plus className="w-4 h-4" /> 添加
            </button>
          </div>

          {showAddKno && (
            <div className="p-4 bg-gray-50 border-b space-y-3">
              <input type="text" value={knoForm.title} onChange={e => setKnoForm({...knoForm, title: e.target.value})} placeholder="标题" className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" value={knoForm.category} onChange={e => setKnoForm({...knoForm, category: e.target.value})} placeholder="分类" className="w-full px-3 py-2 border rounded-lg" />
              <textarea value={knoForm.content} onChange={e => setKnoForm({...knoForm, content: e.target.value})} placeholder="内容" rows={4} className="w-full px-3 py-2 border rounded-lg resize-none" />
              <div className="flex gap-2">
                <button onClick={saveKno} className="px-4 py-2 bg-primary text-white rounded-lg">保存</button>
                <button onClick={() => setShowAddKno(false)} className="px-4 py-2 bg-gray-200 rounded-lg">取消</button>
              </div>
            </div>
          )}

          <div className="divide-y divide-border">
            {knowledge.map(item => (
              <div key={item.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{item.title}</h4>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{item.category}</span>
                  </div>
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

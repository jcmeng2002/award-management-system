import { useAuth } from '../hooks/useAuth'
import FeatureCard from '../components/FeatureCard'
import { FileText, Search, BookOpen, HelpCircle, History, Clock, CheckCircle, Settings } from 'lucide-react'

const HomePage = () => {
  const { user } = useAuth()

  const stats = {
    total: 0,
    pending: 0,
    approved: 0
  }

  try {
    const apps = JSON.parse(localStorage.getItem('awardApplications') || '[]')
    stats.total = apps.length
    stats.pending = apps.filter((a: any) => a.status === 'pending_confirm').length
    stats.approved = apps.filter((a: any) => a.status === 'approved').length
  } catch {}

  const features = [
    { icon: FileText, title: '提交申请', desc: '填写奖项申请表', path: '/apply', color: 'bg-blue-500' },
    { icon: History, title: '我的记录', desc: '查看历史申请', path: '/history', color: 'bg-purple-500' },
    { icon: Search, title: '查询申请', desc: '搜索申请状态', path: '/query', color: 'bg-green-500' },
    { icon: BookOpen, title: '知识库', desc: '查看相关知识', path: '/knowledge', color: 'bg-orange-500' },
    { icon: HelpCircle, title: '问答中心', desc: '常见问题解答', path: '/faq', color: 'bg-cyan-500' },
    { icon: Settings, title: '审核申请', desc: '审核待处理申请', path: '/admin', color: 'bg-green-600' },
  ]

  return (
    <div className="p-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary mb-2">欢迎，{user?.name}</h1>
        <p className="text-gray-600">部门负责人 · {user?.department}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">全部申请</p>
              <p className="text-3xl font-bold text-secondary">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">待审核</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">已通过</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {features.map((f) => (
          <FeatureCard key={f.path} icon={f.icon} title={f.title} description={f.desc} to={f.path} color={f.color} />
        ))}
      </div>

      <div className="mt-8 bg-green-50 rounded-xl p-6 border border-green-200">
        <h2 className="text-lg font-semibold text-secondary mb-4">审核提醒</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-700">当前有 {stats.pending} 个申请待审核</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage

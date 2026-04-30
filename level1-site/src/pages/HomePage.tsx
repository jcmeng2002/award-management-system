import { useAuth } from '../hooks/useAuth'
import FeatureCard from '../components/FeatureCard'
import { FileText, Search, BookOpen, HelpCircle, History, Clock, CheckCircle } from 'lucide-react'

const HomePage = () => {
  const { user } = useAuth()

  const stats = {
    total: 0,
    pending: 0,
    approved: 0
  }

  try {
    const apps = JSON.parse(localStorage.getItem('awardApplications') || '[]')
    const myApps = apps.filter((a: any) => a.employeeId === user?.employeeId)
    stats.total = myApps.length
    stats.pending = myApps.filter((a: any) => a.status === 'pending_confirm').length
    stats.approved = myApps.filter((a: any) => a.status === 'approved').length
  } catch {}

  const features = [
    { icon: FileText, title: '提交申请', desc: '填写奖项申请表', path: '/apply', color: 'bg-blue-500' },
    { icon: History, title: '我的记录', desc: '查看历史申请', path: '/history', color: 'bg-purple-500' },
    { icon: Search, title: '查询申请', desc: '搜索申请状态', path: '/query', color: 'bg-green-500' },
    { icon: BookOpen, title: '知识库', desc: '查看相关知识', path: '/knowledge', color: 'bg-orange-500' },
    { icon: HelpCircle, title: '问答中心', desc: '常见问题解答', path: '/faq', color: 'bg-cyan-500' },
  ]

  return (
    <div className="p-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary mb-2">欢迎，{user?.name}</h1>
        <p className="text-gray-600">普通员工 · {user?.department}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">我的申请</p>
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
              <p className="text-3xl font-bold text-secondary">{stats.pending}</p>
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
              <p className="text-3xl font-bold text-secondary">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {features.map((f) => (
          <FeatureCard key={f.path} icon={f.icon} title={f.title} description={f.desc} to={f.path} color={f.color} />
        ))}
      </div>

      <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h2 className="text-lg font-semibold text-secondary mb-4">系统公告</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">2024年度最佳员工评选现已开放申请</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage

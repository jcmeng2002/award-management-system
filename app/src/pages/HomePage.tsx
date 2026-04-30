import { Award, User, Shield, Users, ArrowRight } from 'lucide-react'

const HomePage = () => {
  const portals = [
    {
      level: 1,
      title: '普通员工入口',
      description: '提交奖项申请、查看个人申请记录',
      icon: User,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      url: 'https://award-level1.pages.woa.com'
    },
    {
      level: 2,
      title: '部门负责人入口',
      description: '审核申请、管理奖项申请流程',
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      url: 'https://award-level2.pages.woa.com'
    },
    {
      level: 3,
      title: '管理员入口',
      description: '权限配置、知识库管理、系统设置',
      icon: Shield,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      url: 'https://award-level3.pages.woa.com'
    }
  ]

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Award className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-secondary mb-3">部门奖项管理系统</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          请选择您的身份入口进入对应系统
        </p>
      </div>

      {/* Portal Cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {portals.map((portal) => (
          <a
            key={portal.level}
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group ${portal.bgColor} border ${portal.borderColor} rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
          >
            <div className={`w-16 h-16 bg-gradient-to-br ${portal.color} rounded-xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform`}>
              <portal.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-secondary mb-2">{portal.title}</h3>
            <p className="text-gray-600 text-sm mb-6">{portal.description}</p>
            <div className={`flex items-center gap-2 ${portal.textColor} font-medium`}>
              <span>进入系统</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        ))}
      </div>

      {/* Footer Note */}
      <div className="text-center mt-12">
        <p className="text-sm text-gray-500">
          每个入口需要对应的 OA Pages 白名单权限
        </p>
        <p className="text-sm text-gray-400 mt-1">
          如无权限访问，请联系管理员配置
        </p>
      </div>
    </div>
  )
}

export default HomePage

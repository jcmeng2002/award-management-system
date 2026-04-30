import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import HomePage from './pages/HomePage'
import ApplyPage from './pages/ApplyPage'
import QueryPage from './pages/QueryPage'
import HistoryPage from './pages/HistoryPage'
import FAQPage from './pages/FAQPage'
import KnowledgePage from './pages/KnowledgePage'
import { Award } from 'lucide-react'

const Level1Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-secondary">奖项管理</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium">
            <span>首页</span>
          </a>
          <a href="/apply" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100">
            <span>提交申请</span>
          </a>
          <a href="/history" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100">
            <span>我的记录</span>
          </a>
          <a href="/query" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100">
            <span>查询申请</span>
          </a>
          <a href="/knowledge" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100">
            <span>知识库</span>
          </a>
          <a href="/faq" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100">
            <span>问答中心</span>
          </a>
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-medium">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div>
              <p className="font-medium text-secondary text-sm">{user?.name}</p>
              <p className="text-xs text-gray-500">普通员工</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6">
          <span className="text-sm text-gray-500">普通员工入口 · 奖项申请系统</span>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Level1Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/query" element={<QueryPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
          </Routes>
        </Level1Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

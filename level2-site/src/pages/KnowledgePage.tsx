import { useState, useEffect } from 'react'
import { KnowledgeItem } from '../types'
import { BookOpen, Search } from 'lucide-react'

const defaultKnowledge: KnowledgeItem[] = [
  { id: '1', title: '如何申请月度之星', content: '月度之星每月评选一次，在月初提交申请，部门负责人审核后生效。', category: '申请指南', createDate: '2024-01-01' },
  { id: '2', title: '奖项类型说明', content: '系统提供6种奖项类型：月度之星、季度优秀、年度最佳、创新贡献奖、团队协作奖、特殊贡献奖。', category: '申请指南', createDate: '2024-01-01' },
  { id: '3', title: '审核流程介绍', content: '提交申请后，部门负责人进行一级确认，确认后管理员进行二级确认，最终生效。', category: '审核流程', createDate: '2024-01-01' },
]

const KnowledgePage = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')

  useEffect(() => {
    const saved = localStorage.getItem('awardKnowledge')
    setItems(saved ? JSON.parse(saved) : defaultKnowledge)
  }, [])

  const categories = ['全部', ...new Set(items.map(i => i.category))]

  const filtered = items.filter(item => {
    const matchSearch = item.title.includes(search) || item.content.includes(search)
    const matchCate = selectedCategory === '全部' || item.category === selectedCategory
    return matchSearch && matchCate
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary mb-2">知识库</h1>
        <p className="text-gray-600">查看奖项申请相关知识</p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-border mb-8">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索知识库"
              className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cate => (
              <button
                key={cate}
                onClick={() => setSelectedCategory(cate)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cate ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cate}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-secondary">{item.title}</h3>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{item.category}</span>
            </div>
            <p className="text-gray-600 leading-relaxed">{item.content}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl p-12 border border-border text-center">
            <h3 className="text-lg font-medium text-secondary mb-2">未找到相关知识</h3>
          </div>
        )}
      </div>
    </div>
  )
}

export default KnowledgePage

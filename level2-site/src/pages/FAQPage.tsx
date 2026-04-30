import { useState } from 'react'
import { FAQItem } from '../types'
import FAQAccordion from '../components/FAQAccordion'
import { HelpCircle, Search } from 'lucide-react'

const defaultFaqs: FAQItem[] = [
  { id: '1', category: '申请相关', question: '如何提交奖项申请？', answer: '登录后进入"提交申请"页面，填写奖项类型、名称和申报理由后提交即可。', sortOrder: 1, enabled: true },
  { id: '2', category: '申请相关', question: '可以修改已提交的申请吗？', answer: '如果申请状态为"草稿"，可以编辑修改；如果已提交，需要联系管理员驳回后才能修改。', sortOrder: 2, enabled: true },
  { id: '3', category: '审核相关', question: '审核流程是怎样的？', answer: '提交后由部门负责人进行确认，确认后再由管理员进行最终审核。', sortOrder: 1, enabled: true },
  { id: '4', category: '审核相关', question: '申请被驳回后怎么办？', answer: '您会看到驳回原因，可以根据原因修改申请后重新提交。', sortOrder: 2, enabled: true },
  { id: '5', category: '权限相关', question: '如何申请更高权限？', answer: '请联系管理员开通相应权限等级。', sortOrder: 1, enabled: true },
]

const FAQPage = () => {
  const [faqs] = useState<FAQItem[]>(() => {
    const saved = localStorage.getItem('awardFAQs')
    return saved ? JSON.parse(saved) : defaultFaqs
  })
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')

  const categories = ['全部', ...new Set(faqs.filter(f => f.enabled !== false).map(f => f.category))]

  const filtered = faqs.filter(faq => {
    const matchSearch = faq.question.includes(search) || faq.answer.includes(search)
    const matchCate = selectedCategory === '全部' || faq.category === selectedCategory
    return matchSearch && matchCate && faq.enabled !== false
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary mb-2">问答中心</h1>
        <p className="text-gray-600">常见问题解答</p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-border mb-8">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索问题"
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

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-secondary">常见问题</h2>
            <p className="text-sm text-gray-500">共 {filtered.length} 个问题</p>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map(faq => (
            <FAQAccordion key={faq.id} item={faq} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">未找到相关问题</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FAQPage

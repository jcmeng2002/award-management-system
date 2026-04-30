import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { AwardApplication } from '../types'
import StatusBadge from '../components/StatusBadge'
import { Search, User, Building, Award, CheckCircle, XCircle, Clock } from 'lucide-react'

const QueryPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<AwardApplication[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [searchType, setSearchType] = useState<'my' | 'dept' | 'all'>('my')
  const { user } = useAuth()

  const handleSearch = () => {
    setHasSearched(true)
    const all: AwardApplication[] = JSON.parse(localStorage.getItem('awardApplications') || '[]')
    
    let filtered: AwardApplication[]
    if (searchType === 'my') {
      filtered = all.filter(app => 
        app.employeeId === user?.employeeId &&
        (app.employeeId.includes(searchQuery) || app.employeeName.includes(searchQuery))
      )
    } else if (searchType === 'dept') {
      filtered = all.filter(app => 
        app.department === user?.department &&
        (app.employeeId.includes(searchQuery) || app.employeeName.includes(searchQuery))
      )
    } else {
      filtered = all.filter(app =>
        app.employeeId.includes(searchQuery) || app.employeeName.includes(searchQuery)
      )
    }
    
    setResults(filtered)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary mb-2">查询申请</h1>
        <p className="text-gray-600">查询奖项申请记录</p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-xl p-6 border border-border mb-8">
        {/* Search Type */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSearchType('my')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'my' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            我的申请
          </button>
          {user && user.permissionLevel >= 2 && (
            <button
              onClick={() => setSearchType('dept')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchType === 'dept' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              本部门申请
            </button>
          )}
          {user && user.permissionLevel >= 3 && (
            <button
              onClick={() => setSearchType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchType === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部申请
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入工号或姓名"
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            查询
          </button>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">
              查询结果 <span className="text-gray-500 font-normal">（{results.length} 条）</span>
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-border text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-secondary mb-2">未找到相关申请</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((app) => (
                <div key={app.id} className="bg-white rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-secondary">{app.awardName}</h3>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-gray-600">{app.awardType}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {app.submitDate}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      {app.employeeName}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building className="w-4 h-4" />
                      {app.department}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="w-4 h-4" />
                      {app.employeeId}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">申报理由：</span>
                      {app.reason}
                    </p>
                  </div>

                  {app.confirmInfo && (
                    <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-100">
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        已确认 by {app.confirmInfo.confirmedByName}
                      </div>
                    </div>
                  )}
                  {app.rejectInfo && (
                    <div className="mt-4 bg-red-50 rounded-lg p-3 border border-red-100">
                      <div className="flex items-center gap-2 text-red-700 text-sm">
                        <XCircle className="w-4 h-4" />
                        已驳回：{app.rejectInfo.reason}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <div className="bg-white rounded-xl p-12 border border-border text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-secondary mb-2">开始查询</h3>
          <p className="text-gray-500">输入工号或姓名查询申请记录</p>
        </div>
      )}
    </div>
  )
}

export default QueryPage

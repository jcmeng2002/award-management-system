import { useState, useEffect } from 'react'
import { AwardApplication } from '../types'
import StatusBadge from '../components/StatusBadge'
import { FileCheck } from 'lucide-react'

const AdminPage = () => {
  const [apps, setApps] = useState<AwardApplication[]>([])

  useEffect(() => {
    setApps(JSON.parse(localStorage.getItem('awardApplications') || '[]'))
  }, [])

  // Level 1 站点暂时不显示审核功能，只显示只读列表
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary mb-2">申请查询</h1>
        <p className="text-gray-600">查看已提交的奖项申请进度</p>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <FileCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary">暂无申请记录</h3>
          <p className="text-gray-500 mt-2">请到「我的申请」页面提交新的奖项申请</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map(app => (
            <div key={app.id} className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{app.awardName}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-gray-600">{app.awardType} · {app.department}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>{app.employeeName} ({app.employeeId})</div>
                <div>{app.department}</div>
                <div>{app.submitDate}</div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600"><span className="font-medium">申报理由：</span>{app.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminPage

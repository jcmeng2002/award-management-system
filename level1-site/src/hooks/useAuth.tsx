import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 站点权限等级配置
const SITE_PERMISSION_LEVEL = 1 // Level 1: 普通员工

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 模拟从 OA Pages 获取用户信息
    const pageCfg = (window as any).__pageCfg
    const username = pageCfg?.ioaAccountName || pageCfg?.user?.ioaAccountName || 
                     pageCfg?.accountName || pageCfg?.user?.accountName || '员工'
    
    setUser({
      id: username,
      name: username,
      employeeId: username,
      permissionLevel: SITE_PERMISSION_LEVEL,
      department: '技术部',
    })
    setIsLoading(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

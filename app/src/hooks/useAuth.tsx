import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, WhiteListUser } from '../types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (employeeId: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 默认权限配置
const DEFAULT_PERMISSIONS: WhiteListUser[] = [
  { username: 'joyahu', permissionLevel: 3, name: 'joyahu', department: '技术部' },
  { username: 'nelsonmeng', permissionLevel: 3, name: 'nelsonmeng', department: '技术部' },
]

// 获取用户权限配置
export const getUserPermissions = (): WhiteListUser[] => {
  const saved = localStorage.getItem('awardUserPermissions')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return DEFAULT_PERMISSIONS
    }
  }
  return DEFAULT_PERMISSIONS
}

// 保存用户权限配置
export const setUserPermissions = (permissions: WhiteListUser[]) => {
  localStorage.setItem('awardUserPermissions', JSON.stringify(permissions))
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 从 localStorage 恢复登录状态
  useEffect(() => {
    const savedUser = localStorage.getItem('awardCurrentUser')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('awardCurrentUser')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (employeeId: string): boolean => {
    const permissions = getUserPermissions()
    const config = permissions.find(u => u.username.toLowerCase() === employeeId.toLowerCase())
    
    if (config) {
      const userData: User = {
        id: config.username,
        name: config.name || employeeId,
        employeeId: config.username,
        permissionLevel: config.permissionLevel,
        department: config.department || '技术部',
      }
      setUser(userData)
      localStorage.setItem('awardCurrentUser', JSON.stringify(userData))
      return true
    }
    
    // 未配置的用户，默认 level 1
    const userData: User = {
      id: employeeId,
      name: employeeId,
      employeeId: employeeId,
      permissionLevel: 1,
      department: '待定',
    }
    setUser(userData)
    localStorage.setItem('awardCurrentUser', JSON.stringify(userData))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('awardCurrentUser')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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

// 权限检查钩子
export const usePermission = (requiredLevel: number) => {
  const { user } = useAuth()
  return user ? user.permissionLevel >= requiredLevel : false
}

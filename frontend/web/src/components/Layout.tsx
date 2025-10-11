import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, AlertTriangle, Heart, Stethoscope, User } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: '首页', emoji: '🏠' },
    { path: '/emergency', icon: AlertTriangle, label: '紧急', emoji: '🚨' },
    { path: '/pets', icon: Heart, label: '宠物', emoji: '🐾' },
    { path: '/services', icon: Stethoscope, label: '服务', emoji: '🏥' },
    { path: '/profile', icon: User, label: '我的', emoji: '👤' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg">
        <div className="container">
          <div className="flex-between py-4">
            <div className="flex-center">
              <span className="text-2xl mr-2">🐾</span>
              <h1 className="text-2xl font-bold">FurLink</h1>
            </div>
            <div className="text-sm opacity-90">
              毛茸茸链接 - 宠物紧急寻回平台
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-column items-center py-2 px-4 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-orange-500 bg-orange-50' 
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                <span className="text-xl mb-1">{item.emoji}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20"></div>
    </div>
  )
}

export default Layout

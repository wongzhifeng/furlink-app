import React from 'react'
import { User, Edit, Heart, AlertTriangle, Settings, Info } from 'lucide-react'

const Profile: React.FC = () => {
  const stats = {
    totalPets: 2,
    helpProvided: 5,
    trustScore: 75
  }

  const menuItems = [
    { icon: Edit, label: '编辑资料', action: () => alert('编辑资料功能开发中') },
    { icon: Heart, label: '我的宠物', action: () => window.location.href = '/pets' },
    { icon: AlertTriangle, label: '我的警报', action: () => alert('我的警报功能开发中') },
    { icon: Settings, label: '设置', action: () => alert('设置功能开发中') },
    { icon: Info, label: '关于我们', action: () => alert('FurLink - 毛茸茸链接\n宠物紧急寻回平台\n版本: 1.0.0') }
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* User Header */}
      <div className="card mb-6">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold mb-2">宠物家长</h1>
          <p className="text-secondary">爱宠如家人</p>
        </div>
      </div>

      {/* Stats */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">📊 数据统计</h2>
        <div className="grid grid-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.totalPets}</div>
            <div className="text-secondary">我的宠物</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.helpProvided}</div>
            <div className="text-secondary">帮助次数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.trustScore}</div>
            <div className="text-secondary">信任度</div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">功能菜单</h2>
        <div className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-5 h-5 mr-4 text-gray-600" />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                <span className="text-gray-400">></span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Profile

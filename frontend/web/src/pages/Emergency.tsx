import React, { memo, useState, useMemo } from 'react'
import { AlertTriangle, MapPin, Clock, Phone } from 'lucide-react'

// 紧急寻宠页面组件
export const Emergency: React.FC = memo(() => {
  const [formData, setFormData] = useState({
    petName: '',
    petType: '',
    petBreed: '',
    lastSeen: '',
    location: '',
    description: '',
    contact: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Emergency alert submitted:', formData)
    // TODO: 调用API提交紧急寻宠信息
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="text-center mb-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">🚨 紧急寻宠</h1>
          <p className="text-gray-600">快速发布宠物走失信息</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 宠物信息 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <span className="mr-2">🐾</span>宠物信息
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="宠物姓名"
                value={formData.petName}
                onChange={(e) => handleInputChange('petName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                placeholder="宠物种类"
                value={formData.petType}
                onChange={(e) => handleInputChange('petType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* 走失信息 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <span className="mr-2">📍</span>走失信息
            </label>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="最后出现地点"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="datetime-local"
                placeholder="走失时间"
                value={formData.lastSeen}
                onChange={(e) => handleInputChange('lastSeen', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* 详细描述 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <span className="mr-2">📝</span>详细描述
            </label>
            <textarea
              placeholder="请描述宠物的特征、穿着、行为等..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* 联系方式 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <span className="mr-2">📞</span>联系方式
            </label>
            <input
              type="tel"
              placeholder="联系电话"
              value={formData.contact}
              onChange={(e) => handleInputChange('contact', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* 提交按钮 */}
          <div className="text-center">
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center mx-auto"
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              发布紧急寻宠
            </button>
          </div>
        </form>
      </div>

      {/* 紧急提示 */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 mb-1">紧急提示</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• 信息发布后将在附近区域快速传播</li>
              <li>• 建议立即联系当地宠物救助组织</li>
              <li>• 保持电话畅通，及时回复线索</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
})

Emergency.displayName = 'Emergency'

export default Emergency
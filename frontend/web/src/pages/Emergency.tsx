import React, { useState } from 'react'
import { AlertTriangle, MapPin, Calendar, Phone, FileText, Camera } from 'lucide-react'

const Emergency: React.FC = () => {
  const [formData, setFormData] = useState({
    petName: '',
    location: '',
    selectedDate: '',
    phone: '',
    description: '',
    images: [] as string[]
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = () => {
    // 模拟图片上传
    const mockImages = ['🐕', '🐱', '🐰']
    setFormData(prev => ({ 
      ...prev, 
      images: [...prev.images, mockImages[prev.images.length % 3]]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 表单验证
    if (!formData.petName) {
      alert('请输入宠物名称')
      return
    }
    
    if (!formData.location) {
      alert('请输入走失地点')
      return
    }
    
    if (!formData.phone) {
      alert('请输入联系电话')
      return
    }

    // 模拟发布
    alert('紧急警报发布成功！')
    
    // 重置表单
    setFormData({
      petName: '',
      location: '',
      selectedDate: '',
      phone: '',
      description: '',
      images: []
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card mb-6">
        <div className="text-center mb-6">
          <AlertTriangle className="icon-large text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold mb-2">🚨 紧急寻宠</h1>
          <p className="text-secondary">快速发布宠物走失信息</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 宠物信息 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <span className="mr-2">🐾</span>宠物信息
            </label>
            <input
              type="text"
              placeholder="请输入宠物名称"
              value={formData.petName}
              onChange={(e) => handleInputChange('petName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 走失地点 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <MapPin className="inline w-4 h-4 mr-2" />
              走失地点
            </label>
            <input
              type="text"
              placeholder="请输入走失地点"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 走失时间 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="inline w-4 h-4 mr-2" />
              走失时间
            </label>
            <input
              type="date"
              value={formData.selectedDate}
              onChange={(e) => handleInputChange('selectedDate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 联系方式 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Phone className="inline w-4 h-4 mr-2" />
              联系方式
            </label>
            <input
              type="tel"
              placeholder="请输入联系电话"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 详细描述 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <FileText className="inline w-4 h-4 mr-2" />
              详细描述
            </label>
            <textarea
              placeholder="请描述宠物的特征、走失经过等"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 上传照片 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Camera className="inline w-4 h-4 mr-2" />
              上传照片
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <button
                type="button"
                onClick={handleImageUpload}
                className="text-gray-500 hover:text-orange-500 transition-colors"
              >
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <span>点击上传宠物照片</span>
              </button>
            </div>
            
            {/* 已上传的照片 */}
            {formData.images.length > 0 && (
              <div className="flex gap-2 mt-3">
                {formData.images.map((image, index) => (
                  <div key={index} className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    {image}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              🚨 发布紧急警报
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn btn-secondary"
            >
              ❌ 取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Emergency

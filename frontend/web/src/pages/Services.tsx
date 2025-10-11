import React, { memo, useState, useMemo, useCallback } from 'react'
import { Stethoscope, MapPin, Star } from 'lucide-react'

// 优化后的Services组件
export const Services: React.FC = memo(() => {
  const [currentFilter, setCurrentFilter] = useState('all')

  const serviceTypes = useMemo(() => [
    { type: 'veterinary', icon: '🏥', label: '医院' },
    { type: 'grooming', icon: '✂️', label: '美容' },
    { type: 'boarding', icon: '🏠', label: '寄养' },
    { type: 'training', icon: '🎓', label: '训练' }
  ], [])

  const services = useMemo(() => [
    {
      id: 1,
      name: '爱心宠物医院',
      type: 'veterinary',
      address: '西湖区文三路123号',
      distance: 0.5,
      rating: 4.8,
      reviewCount: 128
    },
    {
      id: 2,
      name: '美丽宠物美容',
      type: 'grooming',
      address: '西湖区文三路456号',
      distance: 0.8,
      rating: 4.6,
      reviewCount: 89
    },
    {
      id: 3,
      name: '温馨宠物寄养',
      type: 'boarding',
      address: '西湖区文三路789号',
      distance: 1.2,
      rating: 4.7,
      reviewCount: 156
    }
  ], [])

  const getServiceIcon = useCallback((type: string) => {
    const icons: { [key: string]: string } = {
      'veterinary': '🏥',
      'grooming': '✂️',
      'boarding': '🏠',
      'training': '🎓'
    }
    return icons[type] || '🏥'
  }, [])

  const handleServiceClick = useCallback((serviceId: number) => {
    alert(`服务详情功能开发中 (ID: ${serviceId})`)
  }, [])

  const renderServiceTypes = useMemo(() => (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4">服务类型</h2>
      <div className="grid grid-4 gap-4">
        {serviceTypes.map((serviceType) => (
          <button
            key={serviceType.type}
            onClick={() => setCurrentFilter(serviceType.type)}
            className={`p-4 rounded-lg border-2 transition-colors ${
              currentFilter === serviceType.type
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="text-2xl mb-2">{serviceType.icon}</div>
            <div className="text-sm font-medium">{serviceType.label}</div>
          </button>
        ))}
      </div>
    </div>
  ), [serviceTypes, currentFilter])

  const renderServiceList = useMemo(() => (
    <div className="grid gap-4">
      {services.map((service) => (
        <div key={service.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleServiceClick(service.id)}>
          <div className="flex items-center">
            <div className="text-3xl mr-4">{getServiceIcon(service.type)}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">{service.name}</h3>
              <p className="text-secondary mb-1">{service.type}</p>
              <div className="flex items-center text-sm text-muted">
                <MapPin className="w-4 h-4 mr-1" />
                {service.address}
              </div>
              <div className="text-sm text-orange-600 mt-1">
                {service.distance < 1 ? `${Math.round(service.distance * 1000)}m` : `${service.distance.toFixed(1)}km`}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center mb-1">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="font-semibold">{service.rating}</span>
              </div>
              <div className="text-sm text-muted">({service.reviewCount})</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ), [services, handleServiceClick, getServiceIcon])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="text-center">
          <Stethoscope className="icon-large text-blue-500 mx-auto" />
          <h1 className="text-2xl font-bold mb-2">🏥 附近服务</h1>
          <p className="text-secondary">智能匹配宠物服务</p>
        </div>
      </div>

      {renderServiceTypes}
      {renderServiceList}

      {/* Empty State */}
      {services.length === 0 && (
        <div className="card text-center">
          <span className="text-6xl mb-4 block">🏥</span>
          <h3 className="text-xl font-semibold mb-2">暂无附近服务</h3>
          <p className="text-secondary">请检查网络连接或稍后再试</p>
        </div>
      )}
    </div>
  )
})

Services.displayName = 'Services'

export default Services
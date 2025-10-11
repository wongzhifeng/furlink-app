import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Heart, Stethoscope, CheckCircle, XCircle } from 'lucide-react'
import { checkHealth, getServiceInfo } from '../config/api'

const Home: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [serviceInfo, setServiceInfo] = useState<any>(null)

  // 测试后端连接
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        const healthData = await checkHealth()
        const serviceData = await getServiceInfo()
        
        setBackendStatus('connected')
        setServiceInfo(serviceData)
        console.log('✅ 后端连接成功:', { healthData, serviceData })
      } catch (error) {
        setBackendStatus('error')
        console.error('❌ 后端连接失败:', error)
      }
    }

    testBackendConnection()
  }, [])

  const stats = {
    totalPets: 2,
    activeAlerts: 1,
    nearbyServices: 5
  }

  const alerts = [
    {
      id: 1,
      petName: '小白',
      location: '西湖区文三路',
      time: '2小时前',
      status: '🟡 寻找中'
    }
  ]

  return (
    <div className="space-y-6">
      {/* 后端连接状态 */}
      <div className="card">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {backendStatus === 'checking' && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm">连接后端中...</span>
            </div>
          )}
          {backendStatus === 'connected' && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">后端连接成功</span>
            </div>
          )}
          {backendStatus === 'error' && (
            <div className="flex items-center text-red-600">
              <XCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">后端连接失败</span>
            </div>
          )}
        </div>
        
        {/* 服务信息 */}
        {serviceInfo && (
          <div className="text-center text-xs text-gray-500">
            {serviceInfo.message} - {serviceInfo.version}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-3 gap-4">
        <Link to="/emergency" className="card text-center hover:shadow-lg transition-shadow">
          <AlertTriangle className="icon-large text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold mb-2">紧急寻宠</h3>
          <p className="text-secondary text-sm">0延迟传播</p>
        </Link>
        
        <Link to="/pets" className="card text-center hover:shadow-lg transition-shadow">
          <Heart className="icon-large text-pink-500 mx-auto" />
          <h3 className="text-lg font-semibold mb-2">我的宠物</h3>
          <p className="text-secondary text-sm">管理档案</p>
        </Link>
        
        <Link to="/services" className="card text-center hover:shadow-lg transition-shadow">
          <Stethoscope className="icon-large text-blue-500 mx-auto" />
          <h3 className="text-lg font-semibold mb-2">附近服务</h3>
          <p className="text-secondary text-sm">智能匹配</p>
        </Link>
      </div>

      {/* Stats */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">📊 数据概览</h2>
        <div className="grid grid-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.totalPets}</div>
            <div className="text-secondary">我的宠物</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.activeAlerts}</div>
            <div className="text-secondary">紧急警报</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.nearbyServices}</div>
            <div className="text-secondary">附近服务</div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">🚨 最近警报</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🔴</span>
                  <div>
                    <div className="font-semibold">{alert.petName}</div>
                    <div className="text-sm text-secondary">📍 {alert.location}</div>
                    <div className="text-sm text-secondary">⏰ {alert.time}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-orange-600">{alert.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <div className="card text-center">
          <span className="text-6xl mb-4 block">🐾</span>
          <h3 className="text-xl font-semibold mb-2">暂无紧急警报</h3>
          <p className="text-secondary">附近暂时没有宠物走失信息</p>
        </div>
      )}
    </div>
  )
}

export default Home

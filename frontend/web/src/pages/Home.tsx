import React, { memo, useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Heart, Stethoscope, Server, CheckCircle, XCircle } from 'lucide-react'
import { checkHealth, getServiceInfo } from '../config/api.js'

// 优化后的Home组件
export const Home: React.FC = memo(() => {
  // 服务状态监控
  const [serviceStatus, setServiceStatus] = useState({
    zeabur: { healthy: false, status: 'unknown' },
    zion: { healthy: false, status: 'unknown' }
  });
  const [currentService, setCurrentService] = useState('zion');

  // 检查服务状态
  useEffect(() => {
    const checkServices = async () => {
      try {
        const serviceInfo = getServiceInfo();
        setServiceStatus(serviceInfo.status);
        setCurrentService(serviceInfo.best);
      } catch (error) {
        console.warn('Failed to check service status:', error);
      }
    };

    checkServices();
    const interval = setInterval(checkServices, 30000); // 每30秒检查一次
    return () => clearInterval(interval);
  }, []);

  // 使用useMemo优化数据计算
  const stats = useMemo(() => ({
    totalPets: 2,
    activeAlerts: 1,
    nearbyServices: 5
  }), [])

  const alerts = useMemo(() => [
    {
      id: 1,
      petName: '小白',
      location: '西湖区文三路',
      time: '2小时前',
      status: '🟡 寻找中'
    }
  ], [])

  // 优化后的渲染函数
  const renderQuickActions = useMemo(() => (
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
  ), [])

  const renderStats = useMemo(() => (
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
  ), [stats])

  const renderAlerts = useMemo(() => (
    alerts.length > 0 ? (
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
    ) : (
      <div className="card text-center">
        <span className="text-6xl mb-4 block">🐾</span>
        <h3 className="text-xl font-semibold mb-2">暂无紧急警报</h3>
        <p className="text-secondary">附近暂时没有宠物走失信息</p>
      </div>
    )
  ), [alerts])

  // 服务状态显示组件
  const renderServiceStatus = useMemo(() => (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Server className="h-5 w-5 mr-2 text-indigo-600" />
          服务状态
        </h3>
        <span className="text-sm text-gray-500">
          当前: <span className="font-medium text-indigo-600">{currentService}</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          {serviceStatus.zion.healthy ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium text-gray-700">Zion平台</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            serviceStatus.zion.healthy 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {serviceStatus.zion.healthy ? '正常' : '异常'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {serviceStatus.zeabur.healthy ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium text-gray-700">Zeabur平台</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            serviceStatus.zeabur.healthy 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {serviceStatus.zeabur.healthy ? '正常' : '异常'}
          </span>
        </div>
      </div>
    </div>
  ), [serviceStatus, currentService]);

  return (
    <div className="space-y-6">
      {renderServiceStatus}
      {renderQuickActions}
      {renderStats}
      {renderAlerts}
    </div>
  )
})

Home.displayName = 'Home'

export default Home
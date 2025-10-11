import React, { memo, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

// 懒加载页面组件
const Home = lazy(() => import('./pages/Home'))
const Emergency = lazy(() => import('./pages/Emergency'))
const Pets = lazy(() => import('./pages/Pets'))
const Services = lazy(() => import('./pages/Services'))
const Profile = lazy(() => import('./pages/Profile'))

// 加载中组件
const LoadingFallback = memo(() => (
  <div className="flex-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    <span className="ml-3 text-gray-600">加载中...</span>
  </div>
))

LoadingFallback.displayName = 'LoadingFallback'

// 优化后的App组件
export const App: React.FC = memo(() => {
  return (
    <Layout>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/pets" element={<Pets />} />
          <Route path="/services" element={<Services />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>
    </Layout>
  )
})

App.displayName = 'App'

export default App

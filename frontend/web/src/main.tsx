import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// 性能优化：错误边界
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#ff8c42', marginBottom: '16px' }}>🐾 出现错误</h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>抱歉，应用遇到了问题</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ff8c42',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            重新加载
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// 性能监控
const startTime = performance.now()

// 应用初始化
const root = ReactDOM.createRoot(document.getElementById('root')!)

// 性能优化：延迟非关键渲染
const renderApp = () => {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  )
  
  // 性能标记
  const endTime = performance.now()
  console.log(`🚀 App rendered in ${(endTime - startTime).toFixed(2)}ms`)
}

// 使用requestIdleCallback优化渲染时机
if ('requestIdleCallback' in window) {
  requestIdleCallback(renderApp)
} else {
  setTimeout(renderApp, 0)
}

// 性能监控
window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime
  console.log(`📊 Total load time: ${loadTime.toFixed(2)}ms`)
  
  // 发送性能数据到分析服务（如果需要）
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: 'app_load',
      value: Math.round(loadTime)
    })
  }
})

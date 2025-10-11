import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// 超高性能Vite配置
export default defineConfig({
  plugins: [
    react({
      // React插件优化
      babel: {
        plugins: [
          // 生产环境移除console
          process.env.NODE_ENV === 'production' && [
            'transform-remove-console',
            { exclude: ['error', 'warn'] }
          ]
        ].filter(Boolean)
      },
      // 开发时热更新优化
      fastRefresh: true,
      // JSX运行时优化
      jsxRuntime: 'automatic'
    })
  ],
  
  // 开发服务器优化
  server: {
    port: 8080,
    host: '0.0.0.0',
    strictPort: true,
    // 热更新优化
    hmr: {
      overlay: true
    },
    // 代理配置
    proxy: {
      '/api': {
        target: 'https://furlink-backend-m9k2.zeabur.app',
        changeOrigin: true,
        secure: true
      }
    }
  },
  // 构建优化 - 极致性能
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    
    // 代码分割优化
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // 文件命名优化
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash].${ext}`
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        },
        
        // 手动代码分割
        manualChunks: {
          // 核心框架
          'react-vendor': ['react', 'react-dom'],
          // 路由
          'router-vendor': ['react-router-dom'],
          // 图标库
          'icons-vendor': ['lucide-react'],
          // 工具库
          'utils-vendor': ['axios']
        }
      },
      
      // 外部依赖优化
      external: [],
      
      // 插件优化
      plugins: []
    },
    
    // 构建性能优化
    target: 'es2015',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    
    // Terser压缩优化
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        // 移除未使用的代码
        unused: true,
        // 死代码消除
        dead_code: true,
        // 条件表达式优化
        conditionals: true,
        // 布尔值优化
        booleans: true,
        // 循环优化
        loops: true,
        // 函数内联
        inline: 2,
        // 属性访问优化
        properties: true,
        // 序列化优化
        sequences: true,
        // 类型转换优化
        typeofs: true
      },
      mangle: {
        safari10: true,
        // 保留类名
        keep_classnames: false,
        // 保留函数名
        keep_fnames: false
      },
      format: {
        // 移除注释
        comments: false,
        // 美化输出
        beautify: false
      }
    }
  },
  // 预览服务器优化
  preview: {
    port: 8080,
    host: '0.0.0.0',
    strictPort: true,
    // 预览优化
    cors: true
  },
  
  // 依赖优化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'axios'
    ],
    exclude: [],
    // 强制预构建
    force: false
  },
  
  // 环境变量配置
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __NODE_ENV__: JSON.stringify(process.env.NODE_ENV || 'development'),
    // 性能监控
    __PERFORMANCE_MONITORING__: JSON.stringify(process.env.NODE_ENV === 'production')
  },
  
  // CSS优化
  css: {
    // CSS代码分割
    devSourcemap: false,
    // PostCSS配置
    postcss: {
      plugins: [
        // 自动添加浏览器前缀
        require('autoprefixer')({
          overrideBrowserslist: [
            'last 2 versions',
            '> 1%',
            'not dead'
          ]
        })
      ]
    }
  },
  
  // 解析配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  
  // 性能优化
  esbuild: {
    // 生产环境优化
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // 目标环境
    target: 'es2015',
    // JSX处理
    jsx: 'automatic'
  }
})

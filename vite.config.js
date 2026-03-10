import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const cpfKeys = [env.VITE_CPF_API_KEY, env.VITE_CPF_API_KEY_2].filter(Boolean)
  const cpfKeyState = { index: 0, count: 0 }
  const CPF_KEY_LIMIT = 199

  return {
    plugins: [react()],
    build: {
      sourcemap: false, // 🔒 Desabilitar sourcemaps em produção
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remover console.log
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug'],
          passes: 3, // Múltiplos passes de compressão
        },
        mangle: {
          toplevel: true, // Ofuscar variáveis globais
          keep_fnames: false, // Não preservar nomes de função
        },
        format: {
          comments: false, // Remover comentários
          beautify: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api/location': {
          target: 'http://ip-api.com',
          changeOrigin: true,
          rewrite: () => '/json/?fields=status,country,countryCode,region,regionName,city,query&lang=pt',
          secure: false
        },
        '/api/cep': {
          target: 'https://brasilapi.com.br/api/cep/v2',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cep/, ''),
          secure: true
        },
        '/api/qr': {
          target: 'https://api.qrserver.com/v1/create-qr-code/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qr/, ''),
          secure: true
        },
        '/api-pix': {
          target: 'https://multi.paradisepags.com/api/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-pix/, ''),
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('X-API-Key', env.PARADISE_SECRET_KEY || '')
            })
          }
        },
        '/api-cpf': {
          target: 'https://apicpf.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-cpf/, '/api'),
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (cpfKeys.length === 0) return
              if (cpfKeyState.count >= CPF_KEY_LIMIT && cpfKeys.length > 1) {
                cpfKeyState.index = (cpfKeyState.index + 1) % cpfKeys.length
                cpfKeyState.count = 0
              }
              cpfKeyState.count++
              proxyReq.setHeader('X-API-KEY', cpfKeys[cpfKeyState.index])
            })
          }
        }
      }
    }
  }
})

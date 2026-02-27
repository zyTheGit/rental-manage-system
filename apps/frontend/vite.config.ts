import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      vue(),
      Components({
        resolvers: [
          VantResolver({
            importStyle: 'css',
          }),
        ],
        dts: true
      }),
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          'pinia',
          {
            'vant': [
              'showDialog',
              'showToast',
              'showConfirmDialog',
              'showNotify',
              'showImagePreview'
            ]
          }
        ],
        dts: true
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3001/api',
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    }
  }
})

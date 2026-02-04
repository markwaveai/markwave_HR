import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'react-native-vector-icons/Feather': path.resolve(__dirname, 'src/mocks/react-native-vector-icons.jsx'),
      'react-native-vector-icons': path.resolve(__dirname, 'src/mocks/react-native-vector-icons.jsx'),
      'react-native-image-picker': path.resolve(__dirname, 'src/mocks/react-native-image-picker.jsx'),
      'react-native-safe-area-context': 'react-native-web',
      '@markwave/shared': path.resolve(__dirname, '../shared/src'),
    },
    extensions: ['.web.js', '.js', '.jsx', '.ts', '.tsx', '.json', '.mjs'],
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'hr.markwave.ai'
    ]
  },
  optimizeDeps: {
    include: [
      'react-native-web',
      'react-native-safe-area-context',
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      resolveExtensions: ['.web.js', '.js', '.jsx', '.ts', '.tsx'],
      define: {
        global: 'window',
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  }
})


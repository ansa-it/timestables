import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFile, readdir } from 'node:fs/promises'

const offlineServiceWorker = {
  name: 'offline-service-worker',
  apply: 'build',
  async generateBundle(_, bundle) {
    const publicEntries = await readdir(new URL('./public/', import.meta.url), {
      withFileTypes: true
    })
    const publicFiles = publicEntries
      .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && entry.name !== 'sw.js')
      .map((entry) => `/${entry.name}`)
    const buildFiles = Object.keys(bundle)
      .filter((fileName) => fileName !== 'sw.js')
      .map((fileName) => `/${fileName}`)
    const precacheUrls = [...new Set(['/', '/index.html', ...buildFiles, ...publicFiles])]
    const serviceWorker = await readFile(new URL('./src/service-worker.js', import.meta.url), 'utf8')

    this.emitFile({
      type: 'asset',
      fileName: 'sw.js',
      source: serviceWorker.replace('__PRECACHE_URLS__', JSON.stringify(precacheUrls))
    })
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), offlineServiceWorker],
  preview: {
    allowedHosts: ['localhost', 'alma-unedified-kayleen.ngrok-free.dev']
  }
})

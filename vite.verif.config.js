import base from './vite.config.js'
export default { ...base, server: { port: 5199, strictPort: true, proxy: { '/api': 'http://localhost:8010' } } }

// API Configuration
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
export const API_BASE_URL = isDev ? 'http://localhost:5001' : 'https://api.hcfinvest.com'
export const API_URL = `${API_BASE_URL}/api`

// API Configuration - Use environment variable for production
// For local development, use localhost:5001
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isDevelopment ? 'http://localhost:5001' : 'https://api.hcfinvest.com')
export const API_URL = `${API_BASE_URL}/api`

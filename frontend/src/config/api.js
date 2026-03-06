// API Configuration - Use environment variable for production
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.hcfinvest.com';
export const API_URL = `${API_BASE_URL}/api`

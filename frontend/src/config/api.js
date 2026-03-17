// API Configuration:
// - Prefer explicit VITE_API_URL when provided.
// - Otherwise, if app runs on localhost, use local backend by default.
// - Fall back to public API for hosted environments.
const isLocalHost =
	typeof window !== 'undefined' &&
	['localhost', '127.0.0.1'].includes(window.location.hostname);

//Sanket - "Use local backend automatically when app runs on localhost; use hosted backend otherwise."
const DEFAULT_API_BASE_URL = isLocalHost
	? 'http://localhost:5001'
	: 'https://api.hcfinvest.com';

//Sanket - "Allow explicit environment override, else fall back to computed default base URL."
export const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL;
export const API_URL = `${API_BASE_URL}/api`

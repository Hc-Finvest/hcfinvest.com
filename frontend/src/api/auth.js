import { API_URL } from '../config/api'

const AUTH_URL = `${API_URL}/auth`

export const signup = async (userData) => {
  const response = await fetch(`${AUTH_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Signup failed')
  }
  return data
}

export const login = async (credentials) => {
  const response = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Login failed')
  }
  return data
}

// OTP-based signup - Step 1: Send OTP
export const sendSignupOTP = async (email) => {
  const response = await fetch(`${AUTH_URL}/signup/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send OTP')
  }
  return data
}

// OTP-based signup - Step 2: Verify OTP and create account
export const verifySignupOTP = async (userData) => {
  const response = await fetch(`${AUTH_URL}/signup/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'OTP verification failed')
  }
  return data
}

export const getCurrentUser = async (token) => {
  const response = await fetch(`${AUTH_URL}/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get user')
  }
  return data
}

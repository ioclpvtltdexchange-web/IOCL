import axios from 'axios'

// Base API configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth API calls
export const authAPI = {
  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Generate OTP for registration
  generateOTP: async (mobileNumber, emailAddress) => {
    const response = await api.post('/auth/generate-otp', { 
      mobileNumber, 
      emailAddress 
    })
    return response.data
  },

  // Verify OTP for registration
  verifyOTP: async (mobileNumber, otp) => {
    const response = await api.post('/auth/verify-otp', { mobileNumber, otp })
    return response.data
  },

  // Login user
  login: async (userId, password) => {
    const response = await api.post('/auth/login', { userId, password })
    return response.data
  },

  // Forgot password
  forgotPassword: async (userId) => {
    const response = await api.post('/auth/forgot-password', { userId })
    return response.data
  },

  // Change password
  changePassword: async (userId, oldPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { 
      userId, 
      oldPassword, 
      newPassword 
    })
    return response.data
  },

  // Save candidate details
  saveCandidateDetails: async (userId, candidateData) => {
    const response = await api.put(`/auth/candidate-details/${userId}`, candidateData)
    return response.data
  },

  // Get candidate details
  getCandidateDetails: async (userId) => {
    const response = await api.get(`/auth/candidate-details/${userId}`)
    return response.data
  },

  // Save qualification details
  saveQualificationDetails: async (userId, qualificationData) => {
    const response = await api.put(`/auth/qualification-details/${userId}`, qualificationData)
    return response.data
  },

  // Get qualification details
  getQualificationDetails: async (userId) => {
    const response = await api.get(`/auth/qualification-details/${userId}`)
    return response.data
  },

  // Save document details
  saveDocumentDetails: async (userId, documentData) => {
    const response = await api.put(`/auth/document-details/${userId}`, documentData)
    return response.data
  },

  // Get document details
  getDocumentDetails: async (userId) => {
    const response = await api.get(`/auth/document-details/${userId}`)
    return response.data
  },

  // Delete all documents
  deleteAllDocuments: async (userId) => {
    const response = await api.delete(`/auth/document-details/${userId}`)
    return response.data
  },

  // Save payment details
  savePaymentDetails: async (userId, paymentData) => {
    const response = await api.put(`/auth/payment-details/${userId}`, paymentData)
    return response.data
  },

  // Get payment details
  getPaymentDetails: async (userId) => {
    const response = await api.get(`/auth/payment-details/${userId}`)
    return response.data
  },

  // Admin APIs
  updatePaymentStatus: async (userId, statusData) => {
    const response = await api.put(`/auth/admin/payment-status/${userId}`, statusData)
    return response.data
  },

  getAllUsersWithPayments: async () => {
    const response = await api.get('/auth/admin/users-payments')
    return response.data
  },

  // Get user progress
  getUserProgress: async (userId) => {
    const response = await api.get(`/auth/user-progress/${userId}`)
    return response.data
  },
}

export default api



















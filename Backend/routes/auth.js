const express = require('express')
const router = express.Router()
const {
  registerUser,
  generateOTPForUser,
  generateOTPForRegistration,
  verifyOTP,
  verifyOTPForRegistration,
  loginUser,
  forgotPassword,
  changePassword,
  saveCandidateDetails,
  getCandidateDetails,
  saveQualificationDetails,
  getQualificationDetails,
  saveDocumentDetails,
  getDocumentDetails,
  deleteAllDocuments,
  savePaymentDetails,
  getPaymentDetails,
  updatePaymentStatus,
  getAllUsersWithPayments
} = require('../controllers/authController')

const {
  validateRegister,
  validateLogin,
  validateOTP,
  validateOTPVerify,
  validateForgotPassword,
  validateChangePassword
} = require('../middleware/validation')

// @route   POST /api/auth/register
router.post('/register', validateRegister, registerUser)

// Generate OTP for registration - NO VALIDATION
router.post('/generate-otp', generateOTPForRegistration)

// Generate OTP for existing user (forgot password etc)
router.post('/generate-otp-user', validateOTP, generateOTPForUser)

// Verify OTP for registration
router.post('/verify-otp', validateOTPVerify, verifyOTPForRegistration)

// Verify OTP
router.post('/verify-otp', validateOTPVerify, verifyOTP)

// @route   POST /api/auth/login
router.post('/login', validateLogin, loginUser)

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', validateForgotPassword, forgotPassword)

// @route   POST /api/auth/change-password
router.post('/change-password', validateChangePassword, changePassword)

// Candidate details routes
router.put('/candidate-details/:userId', saveCandidateDetails)
router.get('/candidate-details/:userId', getCandidateDetails)

// Qualification details routes
router.put('/qualification-details/:userId', saveQualificationDetails)
router.get('/qualification-details/:userId', getQualificationDetails)

// Document details routes
router.put('/document-details/:userId', saveDocumentDetails)
router.get('/document-details/:userId', getDocumentDetails)
router.delete('/document-details/:userId', deleteAllDocuments)

// Payment details routes
router.put('/payment-details/:userId', savePaymentDetails)
router.get('/payment-details/:userId', getPaymentDetails)

// Admin routes
router.put('/admin/payment-status/:userId', updatePaymentStatus)
router.get('/admin/users-payments', getAllUsersWithPayments)

module.exports = router
















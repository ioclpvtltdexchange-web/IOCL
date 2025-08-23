const { body, validationResult } = require('express-validator')

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }
  next()
}

// Register validation
const validateRegister = [
  body('postCode')
    .notEmpty()
    .withMessage('Post code is required'),
  
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  
  body('mobileNumber')
    .notEmpty()
    .withMessage('Mobile number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid Indian mobile number'),
  
  body('emailAddress')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
]

// Login validation
const validateLogin = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
]

// OTP validation - mobile number aur email ke liye
const validateOTP = [
  body('mobileNumber')
    .notEmpty()
    .withMessage('Mobile number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid Indian mobile number'),
  
  body('emailAddress')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),
  
  handleValidationErrors
]

// OTP verify validation - mobile number aur otp dono ke liye
const validateOTPVerify = [
  body('mobileNumber')
    .notEmpty()
    .withMessage('Mobile number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid Indian mobile number'),
  
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
]

// Forgot password validation
const validateForgotPassword = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
]

// Change password validation
const validateChangePassword = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  
  body('oldPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
]

module.exports = {
  validateRegister,
  validateLogin,
  validateOTP,
  validateOTPVerify,
  validateForgotPassword,
  validateChangePassword,
  handleValidationErrors
}









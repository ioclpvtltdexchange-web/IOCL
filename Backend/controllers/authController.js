const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const sendEmail = require('../utils/sendEmail')
const { validationResult } = require('express-validator')
const cloudinary = require('cloudinary').v2

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Helper function to upload file to Cloudinary
const uploadToCloudinary = async (fileBuffer, fileName, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: folder,
        public_id: fileName,
        overwrite: true
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result.secure_url)
      }
    ).end(fileBuffer)
  })
}

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Register User
const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { postCode, fullName, mobileNumber, alternateMobileNumber, emailAddress, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { emailAddress },
        { mobileNumber }
      ]
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or mobile number'
      })
    }

    // Generate unique user ID
    const userId = await User.generateUserId()

    // Create user with proper default values
    const user = new User({
      userId,
      postCode,
      fullName,
      mobileNumber,
      alternateMobileNumber: alternateMobileNumber || '',
      emailAddress,
      password
    })

    // Save user without validation for optional fields
    await user.save({ validateBeforeSave: false })

    // Send email and generate token (rest of the code remains same)
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">IOCL Company - Registration Successful</h2>
        <p>Dear ${fullName},</p>
        <p>Congratulations! Your registration has been completed successfully.</p>
        
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <h3 style="color: #d32f2f; margin-top: 0;">Your Login Credentials:</h3>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        
        <p>Please keep these credentials safe and secure. You can now login to your account using these details.</p>
        <p>Login URL: <a href="${process.env.CLIENT_URL}/login">${process.env.CLIENT_URL}/login</a></p>
        
        <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border: 1px solid #ffeaa7;">
          <p style="margin: 0; color: #856404;"><strong>Important:</strong> Please change your password after first login for security purposes.</p>
        </div>
        
        <p>If you have any queries, please contact our helpdesk at 082-94980489 from 10 AM to 5 PM on working days.</p>
        
        <br>
        <p>Best regards,<br>IOCL Company</p>
      </div>
    `

    await sendEmail({
      email: emailAddress,
      subject: 'Registration Successful - IOCL Company',
      html: emailHtml
    })

    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: 'Registration successful! Login credentials sent to your email.',
      data: {
        userId: user.userId,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        mobileNumber: user.mobileNumber,
        token
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    })
  }
}

// Generate OTP for verification
const generateOTPForUser = async (req, res) => {
  try {
    const { mobileNumber } = req.body

    const user = await User.findOne({ mobileNumber })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update user with OTP
    user.otp = otp
    user.otpExpires = otpExpires
    await user.save()

    // Send OTP via email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">IOCL Company - OTP Verification</h2>
        <p>Dear ${user.fullName},</p>
        <p>Your OTP for verification is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #d32f2f; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP is valid for 10 minutes only.</p>
        <p>Please do not share this OTP with anyone.</p>
        <br>
        <p>Best regards,<br>IOCL Company</p>
      </div>
    `

    await sendEmail({
      email: user.emailAddress,
      subject: 'OTP Verification - IOCL Company',
      html: emailHtml
    })

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your registered email'
    })

  } catch (error) {
    console.error('OTP generation error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    })
  }
}

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body

    const user = await User.findOne({ mobileNumber })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if OTP is valid and not expired
    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      })
    }

    // Mark user as verified
    user.isVerified = true
    user.otp = undefined
    user.otpExpires = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    })

  } catch (error) {
    console.error('OTP verification error:', error)
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    })
  }
}

// Login User
const loginUser = async (req, res) => {
  try {
    const { userId, password } = req.body

    // Check for admin login
    if (userId === 'Devil109' && password === 'Devil@109') {
      // Generate admin token
      const adminToken = generateToken('admin_id')

      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        data: {
          userId: 'Devil109',
          fullName: 'System Administrator',
          emailAddress: 'admin@oilindia.com',
          token: adminToken,
          role: 'admin'
        }
      })
    }

    // Find user
    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Generate token
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.userId,
        postCode: user.postCode,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        mobileNumber: user.mobileNumber,
        token
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed'
    })
  }
}

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { userId } = req.body

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8)

    // Update user password
    user.password = tempPassword
    await user.save()

    // Send password via email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">IOCL Company - Password Reset</h2>
        <p>Dear ${user.fullName},</p>
        <p>Your new temporary password is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #d32f2f; margin: 0;">${tempPassword}</h2>
        </div>
        <p>Please login with this password and change it immediately for security.</p>
        <p>User ID: <strong>${user.userId}</strong></p>
        <br>
        <p>Best regards,<br>IOCL Company</p>
      </div>
    `

    await sendEmail({
      email: user.emailAddress,
      subject: 'Password Reset - IOCL Company',
      html: emailHtml
    })

    res.status(200).json({
      success: true,
      message: 'New password sent to your registered email'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    })
  }
}

// Change Password
const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check old password
    const isOldPasswordValid = await user.comparePassword(oldPassword)
    if (!isOldPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    })
  }
}

// Generate OTP for registration (before user exists)
const generateOTPForRegistration = async (req, res) => {
  try {
    
    const { mobileNumber, emailAddress } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ mobileNumber }, { emailAddress }]
    })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this mobile number or email'
      })
    }

    // Generate OTP
    const otp = generateOTP()

    // Send OTP via email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">IOCL Company - Registration OTP</h2>
        <p>Dear User,</p>
        <p>Your OTP for registration verification is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #d32f2f; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP is valid for 10 minutes only.</p>
        <p>Please do not share this OTP with anyone.</p>
        <br>
        <p>Best regards,<br>IOCL Company</p>
      </div>
    `

    await sendEmail({
      email: emailAddress,
      subject: 'Registration OTP - IOCL Company',
      html: emailHtml
    })

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      otp: otp // Remove this in production
    })

  } catch (error) {
    console.error('OTP generation error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    })
  }
}

// Verify OTP for registration
const verifyOTPForRegistration = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body

    // For demo purpose, accept any 6-digit OTP
    // In production, verify against stored OTP
    if (otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format'
      })
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    })

  } catch (error) {
    console.error('OTP verification error:', error)
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    })
  }
}

// Save candidate details
const saveCandidateDetails = async (req, res) => {
  try {
    const { userId } = req.params
    const candidateData = req.body

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update candidate details with proper defaults
    user.personalDetails = candidateData.personalDetails || {}
    user.benchmarkDisability = candidateData.benchmarkDisability || { isDisabled: false }
    user.exServicemen = candidateData.exServicemen || {}
    user.employeeDetails = candidateData.employeeDetails || {}
    user.wclDetails = candidateData.wclDetails || {}
    user.correspondenceAddress = candidateData.correspondenceAddress || {}
    user.permanentAddress = candidateData.permanentAddress || {}
    user.dobDetails = candidateData.dobDetails || {}

    // Mark candidate details as completed
    user.candidateDetailsStatus.allSectionsCompleted = true

    // Save without validation
    await user.save({ validateBeforeSave: false })

    res.json({
      message: 'Candidate details saved successfully',
      candidateDetails: {
        personalDetails: user.personalDetails,
        benchmarkDisability: user.benchmarkDisability,
        exServicemen: user.exServicemen,
        employeeDetails: user.employeeDetails,
        wclDetails: user.wclDetails,
        correspondenceAddress: user.correspondenceAddress,
        permanentAddress: user.permanentAddress,
        dobDetails: user.dobDetails
      }
    })
  } catch (error) {
    console.error('Save candidate details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get candidate details
const getCandidateDetails = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      candidateDetails: {
        postCode: user.postCode,
        personalDetails: user.personalDetails,
        benchmarkDisability: user.benchmarkDisability,
        exServicemen: user.exServicemen,
        employeeDetails: user.employeeDetails,
        wclDetails: user.wclDetails,
        correspondenceAddress: user.correspondenceAddress,
        permanentAddress: user.permanentAddress,
        dobDetails: user.dobDetails
      }
    })
  } catch (error) {
    console.error('Get candidate details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Save qualification details
const saveQualificationDetails = async (req, res) => {
  try {
    const { userId } = req.params
    const qualificationData = req.body

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update qualification details
    user.qualificationDetails = qualificationData

    // Mark qualification details as completed
    user.qualificationDetailsStatus.allQualificationSectionsCompleted = true

    await user.save()

    res.json({
      message: 'Qualification details saved successfully',
      qualificationDetails: user.qualificationDetails
    })
  } catch (error) {
    console.error('Save qualification details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get qualification details
const getQualificationDetails = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({
      success: true,
      qualificationDetails: user.qualificationDetails || {
        matriculation: { boardName: '', yearOfPassing: '', rollNumber: '', percentage: '', subjects: '' },
        intermediate: { boardName: '', yearOfPassing: '', rollNumber: '', percentage: '', subjects: '', stream: '' },
        iti: { instituteName: '', yearOfPassing: '', rollNumber: '', percentage: '', trade: '', duration: '' }
      }
    })
  } catch (error) {
    console.error('Get qualification details error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Save document details
const saveDocumentDetails = async (req, res) => {
  try {
    const { userId } = req.params
    const documentFiles = req.body

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const documentUrls = {}

    // Upload each document to Cloudinary
    for (const [docType, fileData] of Object.entries(documentFiles)) {
      if (fileData && fileData.data) {
        const fileName = `${userId}_${docType}_${Date.now()}`
        const folder = `iocl_documents/${userId}`

        try {
          const fileBuffer = Buffer.from(fileData.data, 'base64')
          const cloudinaryUrl = await uploadToCloudinary(fileBuffer, fileName, folder)
          documentUrls[docType] = cloudinaryUrl
        } catch (uploadError) {
          console.error(`Error uploading ${docType}:`, uploadError)
          return res.status(500).json({ message: `Failed to upload ${docType}` })
        }
      }
    }

    // Update user document details
    user.documentDetails = {
      ...user.documentDetails,
      ...documentUrls
    }

    // Update completion status
    user.documentDetailsStatus.documentsUploaded = true

    await user.save()

    res.json({
      message: 'Documents uploaded successfully',
      documentDetails: user.documentDetails
    })
  } catch (error) {
    console.error('Save document details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get document details
const getDocumentDetails = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      documentDetails: user.documentDetails || {},
      documentDetailsStatus: user.documentDetailsStatus || { documentsUploaded: false }
    })
  } catch (error) {
    console.error('Get document details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Delete all documents
const deleteAllDocuments = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Delete from Cloudinary
    const folder = `iocl_documents/${userId}`
    try {
      await cloudinary.api.delete_resources_by_prefix(folder)
      await cloudinary.api.delete_folder(folder)
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion error:', cloudinaryError)
    }

    // Clear MongoDB document details
    user.documentDetails = {
      passportPhoto: null,
      signature: null,
      class10Marksheet: null,
      class12Marksheet: null,
      itiMarksheet: null,
      castCertificate: null
    }

    user.documentDetailsStatus.documentsUploaded = false

    await user.save()

    res.json({
      message: 'All documents deleted successfully'
    })
  } catch (error) {
    console.error('Delete all documents error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Save payment details
const savePaymentDetails = async (req, res) => {
  try {
    const { userId } = req.params
    const { utrNumber } = req.body

    // Check if it's admin user (admin users don't have payment functionality)
    if (userId === 'Devil109') {
      return res.status(400).json({
        message: 'Admin users cannot submit payment details. Please login with a regular user account.'
      })
    }

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update payment details
    user.paymentDetails = {
      utrNumber,
      paymentStatus: 'processing',
      paymentDate: new Date()
    }

    user.paymentDetailsStatus.paymentCompleted = true

    await user.save()

    res.json({
      message: 'Payment details saved successfully',
      paymentDetails: user.paymentDetails
    })
  } catch (error) {
    console.error('Save payment details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get payment details
const getPaymentDetails = async (req, res) => {
  try {
    const { userId } = req.params

    // Check if it's admin user (admin users don't have payment details)
    if (userId === 'Devil109') {
      return res.status(400).json({
        message: 'Admin users do not have payment details. Please login with a regular user account.'
      })
    }

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      paymentDetails: user.paymentDetails,
      paymentDetailsStatus: user.paymentDetailsStatus
    })
  } catch (error) {
    console.error('Get payment details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Update payment status (Admin only)
const updatePaymentStatus = async (req, res) => {
  try {
    const { userId } = req.params
    const { status, adminRemarks } = req.body

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update payment status
    user.paymentDetails.paymentStatus = status
    user.paymentDetails.adminRemarks = adminRemarks || null
    user.paymentDetails.adminVerifiedAt = new Date()

    await user.save()

    // Send email based on status
    if (status === 'verified') {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4caf50;">IOCL Company - Payment Verified Successfully! ✅</h2>
          <p>Dear ${user.fullName},</p>
          <p><strong>Congratulations!</strong> Your registration payment has been successfully verified and your registration is now complete.</p>
          
          <div style="background: #e8f5e8; padding: 20px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h3 style="color: #2e7d32; margin: 0 0 10px 0;">Payment Details:</h3>
            <p style="margin: 5px 0;"><strong>UTR Number:</strong> ${user.paymentDetails.utrNumber}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ₹500.00</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> VERIFIED ✅</p>
            <p style="margin: 5px 0;"><strong>Verified On:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
          </div>

          <div style="background: #e3f2fd; padding: 20px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="color: #1976d2; margin: 0 0 10px 0;">Next Steps:</h3>
            <ul style="color: #1976d2; margin: 0; padding-left: 20px;">
              <li>Login to your dashboard to download registration PDF</li>
              <li>Keep the registration PDF for future reference</li>
              <li>Check your email for further updates</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/login" 
               style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Download Registration PDF
            </a>
          </div>

          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #666;">
              <strong>Need Help?</strong><br>
              📞 Helpline: 082-94980489<br>
              🕒 Available: 10 AM to 5 PM (Working Days)
            </p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Please do not reply to this email.
          </p>
        </div>
      `

      await sendEmail({
        email: user.emailAddress,
        subject: 'Payment Verified Successfully - Registration Complete - IOCL ',
        html: emailHtml
      })
    } else if (status === 'cancelled') {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f44336;">IOCL Company - Payment Verification Failed ❌</h2>
          <p>Dear ${user.fullName},</p>
          <p>We regret to inform you that your payment verification was unsuccessful.</p>
          
          <div style="background: #ffebee; padding: 20px; margin: 20px 0; border-left: 4px solid #f44336;">
            <h3 style="color: #c62828; margin: 0 0 10px 0;">Payment Details:</h3>
            <p style="margin: 5px 0;"><strong>UTR Number:</strong> ${user.paymentDetails.utrNumber}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ₹500.00</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> VERIFICATION FAILED ❌</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${adminRemarks || 'Payment could not be verified'}</p>
          </div>

          <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin: 0 0 10px 0;">What to do next?</h3>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>Check your UTR number and try again</li>
              <li>Ensure payment was made to correct account</li>
              <li>Contact our helpline for assistance</li>
              <li>You can retry payment from your dashboard</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/login" 
               style="background: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Retry Payment
            </a>
          </div>

          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #666;">
              <strong>Need Help?</strong><br>
              📞 Helpline: 082-94980489<br>
              🕒 Available: 10 AM to 5 PM (Working Days)
            </p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Please do not reply to this email.
          </p>
        </div>
      `

      await sendEmail({
        email: user.emailAddress,
        subject: 'Payment Verification Failed - Action Required - IOCL Company',
        html: emailHtml
      })
    }

    res.json({
      message: `Payment status updated to ${status}`,
      paymentDetails: user.paymentDetails,
      trackingStage: status
    })
  } catch (error) {
    console.error('Update payment status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get user progress with current route
const getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findOne({ userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const progress = {
      candidateCompleted: user.candidateDetailsStatus?.allSectionsCompleted || false,
      qualificationCompleted: user.qualificationDetailsStatus?.allQualificationSectionsCompleted || false,
      documentCompleted: user.documentDetailsStatus?.documentsUploaded || false,
      paymentCompleted: user.paymentDetailsStatus?.paymentCompleted || false,
      paymentStatus: user.paymentDetails?.paymentStatus || 'pending'
    }

    // Determine current route based on progress
    let currentRoute = '/dashboard/candidate-details'
    if (progress.candidateCompleted && !progress.qualificationCompleted) {
      currentRoute = '/dashboard/qualification-details'
    } else if (progress.qualificationCompleted && !progress.documentCompleted) {
      currentRoute = '/dashboard/document-details'
    } else if (progress.documentCompleted && !progress.paymentCompleted) {
      currentRoute = '/dashboard/payment-details'
    } else if (progress.paymentCompleted) {
      currentRoute = '/dashboard/tracking'
    }

    res.json({
      success: true,
      progress,
      currentRoute
    })
  } catch (error) {
    console.error('Get user progress error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get all users with payment details (Admin only)
const getAllUsersWithPayments = async (req, res) => {
  try {
    const users = await User.find({
      'paymentDetailsStatus.paymentCompleted': true
    }).select('userId fullName emailAddress mobileNumber paymentDetails createdAt')

    res.json({ users })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
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
  getAllUsersWithPayments,
  getUserProgress
}




























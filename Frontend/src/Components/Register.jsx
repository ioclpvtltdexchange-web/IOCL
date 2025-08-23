import React, { useState, useEffect } from 'react'
import { AiOutlineMinus, AiOutlinePlus, AiOutlineClose } from 'react-icons/ai'
import { MdRefresh } from 'react-icons/md'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Header from './Header'
import LoadingScreen from './LoadingScreen'
import { authAPI } from '../services/api'

const Register = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isOtpGenerated, setIsOtpGenerated] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [otpTimer, setOtpTimer] = useState(60)
  const [showOtpDiv, setShowOtpDiv] = useState(false)

  // Loading states for buttons
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [sections, setSections] = useState({
    instructions: true,
    registration: true,
    declaration: true
  })

  const [formData, setFormData] = useState({
    postCode: '',
    fullName: '',
    mobileNumber: '',
    confirmMobileNumber: '',
    alternateMobileNumber: '',
    emailAddress: '',
    confirmEmailAddress: '',
    captcha: ''
  })

  const [captchaCode, setCaptchaCode] = useState(generateCaptcha())

  function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // OTP Timer Effect
  useEffect(() => {
    let interval = null
    if (showOtpDiv && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1)
      }, 1000)
    } else if (otpTimer === 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [showOtpDiv, otpTimer])

  const toggleSection = (section) => {
    if (section === 'declaration' && !isOtpVerified) {
      toast.error('Please generate and verify OTP first!')
      return
    }
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Mobile number validation
  const handleMobileBlur = () => {
    if (formData.confirmMobileNumber && formData.mobileNumber !== formData.confirmMobileNumber) {
      toast.error('Mobile numbers do not match!')
    }
  }

  // Email validation
  const handleEmailBlur = () => {
    if (formData.confirmEmailAddress && formData.emailAddress !== formData.confirmEmailAddress) {
      toast.error('Email addresses do not match!')
    }
  }

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha())
  }

  const generateOTP = async () => {
    if (!formData.mobileNumber || !formData.emailAddress) {
      toast.error('Please enter mobile number and email first!')
      return
    }

    setIsGeneratingOtp(true) // Start loading

    try {
      
      const response = await authAPI.generateOTP(formData.mobileNumber, formData.emailAddress)
      

      setGeneratedOtp(response.otp) // For demo
      setIsOtpGenerated(true)
      setShowOtpDiv(true)
      setOtpTimer(60)
      toast.success('OTP sent to your email!')
    } catch (error) {
      console.error('OTP Error:', error)
      console.error('Error Response:', error.response?.data) // Add this line
      toast.error(error.response?.data?.message || 'Failed to generate OTP')
    } finally {
      setIsGeneratingOtp(false) // Stop loading
    }
  }

  const verifyOTPHandler = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter valid 6-digit OTP!')
      return
    }

    setIsVerifyingOtp(true) // Start loading

    try {
      const response = await authAPI.verifyOTP(formData.mobileNumber, otp)
      setIsOtpVerified(true)
      setShowOtpDiv(false)
      toast.success('OTP verified successfully!')
    } catch (error) {
      toast.error('Invalid OTP!')
    } finally {
      setIsVerifyingOtp(false) // Stop loading
    }
  }

  const resendOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(newOtp)
    setOtpTimer(60)
    toast.info('OTP has been resent!')
  }

  const closeOtpDiv = () => {
    setShowOtpDiv(false)
    setOtp('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()



    if (!isOtpVerified) {
      toast.error('Please verify OTP first!')
      return
    }
    if (formData.captcha !== captchaCode) {
      toast.error('Invalid captcha! Please try again.')
      return
    }

    setIsSubmitting(true) // Start loading

    try {

      const response = await authAPI.register({
        postCode: formData.postCode,
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        alternateMobileNumber: formData.alternateMobileNumber,
        emailAddress: formData.emailAddress,
        password: 'temp123'
      })


      toast.success('Registration successful! Login credentials sent to your email.')

      setTimeout(() => {
        window.location.href = '/login'
      }, 4000)

    } catch (error) {
      console.error('Registration error:', error) // Debug log
      const errorMessage = error.response?.data?.message || 'Registration failed'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false) // Stop loading
    }
  }

  const navigateToHome = () => {
    window.location.href = '/'
  }

  const navigateToLogin = () => {
    window.location.href = '/login'
  }

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Navigation Bar */}
      <div className="bg-red-600 px-6 py-2 flex justify-between items-center">
        <h1 className="text-white text-lg font-bold">IOCL COMPANY, APPLICATION FORM</h1>
        <div className="flex gap-2">
          <button
            onClick={navigateToLogin}
            className="bg-white text-red-600 px-4 py-1 text-sm font-semibold hover:bg-gray-100"
          >
            LOGIN
          </button>
          <button
            onClick={navigateToHome}
            className="bg-white text-red-600 px-4 py-1 text-sm font-semibold hover:bg-gray-100"
          >
            HOME
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Instructions Section */}
        <div className="bg-white border">
          <div className="bg-gray-100 px-4 py-2 flex justify-between items-center cursor-pointer border-b"
            onClick={() => toggleSection('instructions')}>
            <h2 className="text-black font-bold">Instructions:</h2>
            {sections.instructions ?
              <AiOutlineMinus className="text-black" /> :
              <AiOutlinePlus className="text-black" />
            }
          </div>
          {sections.instructions && (
            <div className="p-4">
              <div className="bg-orange-100 border-l-4 border-orange-400 p-3 mb-4">
                <p className="text-sm"><strong>Note:</strong></p>
                <p className="text-sm">Kindly use Edge Chromium or Mozilla Firefox (version 103 to 120) or Google Chrome (version 94 to 117) or Microsoft Edge/version 96 to 119) browser to fill in the Application Form.</p>
                <p className="text-sm mt-2">The Application Form is compatible with Android (version 4.4 and above) and iOS (version 9 and above)</p>
                <p className="text-sm mt-2">Fields marked with * are mandatory.</p>
              </div>
              <p className="text-sm mb-2">Read the below instructions carefully, before filling the form.</p>
              <ol className="list-decimal list-inside text-sm space-y-1">
                <li>On successful registration, you will receive the Login ID and Password on your registered email. Use these to login and fill your online application form.</li>
                <li>In case of any difficulties you may contact the helpdesk through helpdesk tab after login and Phone No 082-94980489 from 10 AM to 5 PM on working days.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Registration Section */}
        <div className="bg-red-600 text-white px-4 py-2">
          <h2 className="font-bold">REGISTRATION</h2>
        </div>

        <div className="bg-white border">
          <div className="bg-gray-100 px-4 py-2 flex justify-between items-center cursor-pointer border-b"
            onClick={() => toggleSection('registration')}>
            <h2 className="text-black font-bold">Register to get User ID and Password</h2>
            {sections.registration ?
              <AiOutlineMinus className="text-black" /> :
              <AiOutlinePlus className="text-black" />
            }
          </div>
          {sections.registration && (
            <div className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Post Code */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Post Code <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="postCode"
                    value={formData.postCode}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">--Select--</option>
                    <option value="JTF12025">JTF12025</option>
                    <option value="BLR12025">BLR12025</option>
                    <option value="CLE12025">CLE12025</option>
                  </select>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Candidate's / Applicant's Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Candidate's / Applicant's Full Name"
                    className="w-full uppercase border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                {/* Mobile Numbers Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="bg-gray-100 border border-r-0 px-2 py-2 text-sm">+91</span>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        placeholder="Mobile Number"
                        className="flex-1 border border-gray-300 px-3 py-2 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Confirm Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="bg-gray-100 border border-r-0 px-2 py-2 text-sm">+91</span>
                      <input
                        type="tel"
                        name="confirmMobileNumber"
                        value={formData.confirmMobileNumber}
                        onChange={handleInputChange}
                        onBlur={handleMobileBlur}
                        placeholder="Confirm Mobile Number"
                        className="flex-1 border border-gray-300 px-3 py-2 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Alternate Mobile Number:
                    </label>
                    <div className="flex">
                      <span className="bg-gray-100 border border-r-0 px-2 py-2 text-sm">+91</span>
                      <input
                        type="tel"
                        name="alternateMobileNumber"
                        value={formData.alternateMobileNumber}
                        onChange={handleInputChange}
                        placeholder="Alternate Mobile Number"
                        className="flex-1 border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Addresses Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="emailAddress"
                      value={formData.emailAddress}
                      onChange={handleInputChange}
                      placeholder="Email Address"
                      className="w-full border border-gray-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Confirm Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="confirmEmailAddress"
                      value={formData.confirmEmailAddress}
                      onChange={handleInputChange}
                      onBlur={handleEmailBlur}
                      placeholder="Confirm Email Address"
                      className="w-full border border-gray-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>

                {/* OTP Success Message or Note */}
                {isOtpVerified ? (
                  <div className="bg-green-50 border-l-4 border-green-400 p-3">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <p className="text-sm text-green-700"><strong>OTP Verified Successfully!</strong></p>
                    </div>
                    <p className="text-sm text-green-600 mt-1">Your mobile number and email address have been verified.</p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                    <p className="text-sm"><strong>Note:</strong></p>
                    <p className="text-sm">You are required to provide your correct mobile no. and email address as all important communications are to be sent to you using the same.</p>
                  </div>
                )}

                {/* Generate OTP Button - Only show if OTP not verified */}
                {!isOtpVerified && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={generateOTP}
                      disabled={isGeneratingOtp}
                      className={`px-6 py-2 text-sm font-semibold ${isGeneratingOtp
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gray-600 hover:bg-gray-700'
                        } text-white`}
                    >
                      {isGeneratingOtp ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          GENERATING...
                        </div>
                      ) : (
                        'GENERATE OTP'
                      )}
                    </button>
                  </div>
                )}

                {/* OTP Verification Div */}
                {showOtpDiv && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Verify OTP</h3>
                        <button
                          onClick={closeOtpDiv}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <AiOutlineClose size={20} />
                        </button>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">
                        Enter the 6-digit OTP sent to your mobile and email
                      </p>

                      <div className="mb-4">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="w-full border border-gray-300 px-3 py-2 text-center text-lg tracking-widest"
                          maxLength="6"
                        />
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-500">
                          Time remaining: {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                        </span>
                        {otpTimer === 0 && (
                          <button
                            onClick={resendOtp}
                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>

                      <button
                        onClick={verifyOTPHandler}
                        disabled={isVerifyingOtp}
                        className={`w-full py-2 rounded font-semibold ${isVerifyingOtp
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                          } text-white`}
                      >
                        {isVerifyingOtp ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            VERIFYING...
                          </div>
                        ) : (
                          'VERIFY OTP'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Declaration Section */}
        <div className="bg-white border">
          <div
            className={`bg-gray-100 px-4 py-2 flex justify-between items-center border-b ${!isOtpVerified ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            onClick={() => toggleSection('declaration')}
            title={!isOtpVerified ? 'Please verify OTP first!' : ''}
          >
            <h2 className={`font-bold ${!isOtpVerified ? 'text-gray-400' : 'text-black'}`}>
              Declaration
            </h2>
            {sections.declaration ?
              <AiOutlineMinus className={!isOtpVerified ? 'text-gray-400' : 'text-black'} /> :
              <AiOutlinePlus className={!isOtpVerified ? 'text-gray-400' : 'text-black'} />
            }
          </div>
          {sections.declaration && isOtpVerified && (
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm mb-4">
                  I hereby declare that the above information is true to the best of my knowledge. I am aware that OIL INDIA LIMITED will be sending important information on my
                  registered details. I agree that I have referred the relevant Advertisement and ensured my eligibility before applying. Also, I agree that I have read and understood all
                  the instructions specified in the relevant Advertisement and agree to abide by the same.
                </p>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" required />
                  <span className="text-sm">I Agree</span>
                </label>
              </div>

              {/* Captcha Section - Centered and Compact */}
              <div className="flex justify-center">
                <div className="bg-gray-50 border p-4 rounded w-96">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="bg-yellow-200 border-2 border-gray-400 px-4 py-2 font-bold text-lg tracking-wider">
                      {captchaCode}
                    </div>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Refresh Captcha"
                    >
                      <MdRefresh size={24} />
                    </button>
                  </div>
                  <input
                    type="text"
                    name="captcha"
                    value={formData.captcha}
                    onChange={handleInputChange}
                    placeholder="Type characters as shown above"
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-center"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1 text-center">Type characters as shown in image</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="text-center pt-4">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !isOtpVerified}
            className={`px-8 py-2 font-semibold ${isSubmitting || !isOtpVerified
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
              } text-white`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                SUBMITTING...
              </div>
            ) : (
              'SUBMIT'
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-sm text-gray-600">
        Version 15.02.01
      </div>
    </div>
  )
}

export default Register
































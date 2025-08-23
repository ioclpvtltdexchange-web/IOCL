import React, { useState } from 'react'
import { MdRefresh } from 'react-icons/md'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Header from './Header'
import { authAPI } from '../services/api'

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    userId: '',
    captcha: ''
  })
  
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha())
  const [isSubmitting, setIsSubmitting] = useState(false) // Add loading state

  function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha())
    setFormData({ ...formData, captcha: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.captcha !== captchaCode) {
      toast.error('Invalid captcha! Please try again.')
      return
    }
    
    setIsSubmitting(true) // Start loading
    
    try {
      const response = await authAPI.forgotPassword(formData.userId)
      toast.success('Password reset instructions sent to your email!')
      
      
      // Redirect to change password page after success
      setTimeout(() => {
        window.location.href = '/change-password'
      }, 2000)
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to process request'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false) // Stop loading
    }
  }

  const navigateToLogin = () => {
    window.location.href = '/login'
  }

  const navigateToChangePassword = () => {
    window.location.href = '/change-password'
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-center items-center min-h-[80vh] p-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-lg">
          {/* Header */}
          <div className="bg-red-600 text-white text-center py-3">
            <h1 className="text-xl font-bold">Forgot Password</h1>
          </div>
          
          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User ID */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Please enter User Id : <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  placeholder="Please enter your User Id"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              {/* Captcha Box */}
              <div className="flex justify-center">
                <div className="bg-gray-50 border border-gray-300 p-4 rounded shadow-sm w-80">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="bg-yellow-200 border-2 border-gray-400 px-4 py-2 font-bold text-lg tracking-wider flex-1 text-center">
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
                    placeholder="Type characters as shown in image"
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-center focus:outline-none focus:border-red-500"
                    required
                  />
                </div>
              </div>

              {/* Get Password Button */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-2 font-semibold ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white focus:outline-none`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      PROCESSING...
                    </div>
                  ) : (
                    'GET PASSWORD'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer Buttons */}
          <div className="bg-red-600 flex justify-center gap-4 py-3">
            <button 
              onClick={navigateToLogin}
              className="bg-white text-red-600 px-6 py-2 text-sm font-semibold hover:bg-gray-100"
            >
              LOGIN
            </button>
            <button 
              onClick={navigateToChangePassword}
              className="bg-white text-red-600 px-6 py-2 text-sm font-semibold hover:bg-gray-100"
            >
              CHANGE PASSWORD
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-sm text-gray-600">
        Version 15.02.01
      </div>
    </div>
  )
}

export default ForgotPassword




import React, { useState } from 'react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { MdRefresh } from 'react-icons/md'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Header from './Header'
import { authAPI } from '../services/api'

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    userId: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false) // Add loading state

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleConfirmPasswordBlur = () => {
    if (formData.confirmPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match!')
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match!')
      return
    }
    
    setIsSubmitting(true) // Start loading
    
    try {
      const response = await authAPI.changePassword(
        formData.userId, 
        formData.oldPassword, 
        formData.newPassword
      )
      toast.success('Password changed successfully!')
     
      
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false) // Stop loading
    }
  }

  const navigateToLogin = () => {
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-center items-center min-h-[80vh] p-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-lg">
          {/* Header */}
          <div className="bg-red-600 text-white text-center py-3">
            <h1 className="text-xl font-bold">Change Password</h1>
          </div>
          
          {/* Subheader */}
          <div className="bg-gray-100 text-center py-2">
            <p className="text-sm text-gray-700">Login to Fill/Submit/View Application Form</p>
          </div>
          
          {/* Form */}
          <div className="p-8">
            {/* Guidelines Box */}
            <div className="bg-gray-50 border border-gray-300 p-4 mb-6 text-sm">
              <h3 className="text-red-600 font-semibold mb-2">Guidelines for Password:</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Minimum new password length should be 8.</li>
                <li>Minimum numeric characters needed in new password should be 1.</li>
                <li>Minimum upper case characters needed in new password should be 1.</li>
                <li>Minimum special case characters needed in new password should be 1 and no special characters like &lt;- &amp; % double and single colon allowed.</li>
                <li>Avoid using currency symbols other than $, such as ₹, ¥ and etc.</li>
              </ol>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User ID */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  User Id: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  placeholder="Enter User ID"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              {/* Old Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Old Password: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.old ? "text" : "password"}
                    name="oldPassword"
                    value={formData.oldPassword}
                    onChange={handleInputChange}
                    placeholder="Old Password"
                    className="w-full border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:border-red-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('old')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.old ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  New Password: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="New Password"
                    className="w-full border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:border-red-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm New Password: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleConfirmPasswordBlur}
                    placeholder="Confirm New Password"
                    className="w-full border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:border-red-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
              </div>

              {/* Change Password Button */}
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
                      CHANGING...
                    </div>
                  ) : (
                    'CHANGE PASSWORD'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer Button */}
          <div className="bg-red-600 flex justify-center py-3">
            <button 
              onClick={navigateToLogin}
              className="bg-white text-red-600 px-6 py-2 text-sm font-semibold hover:bg-gray-100"
            >
              LOGIN
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

export default ChangePassword



import React, { useState } from 'react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { MdRefresh } from 'react-icons/md'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Header from './Header'
import { authAPI } from '../services/api'

const Login = () => {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    captcha: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha())

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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.captcha !== captchaCode) {
      toast.error('Invalid captcha! Please try again.')
      return
    }
    
    try {
      const response = await authAPI.login(formData.userId, formData.password)
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data))
      
      toast.success('Login successful!')
      
      
      // Check if admin login
      if (response.data.role === 'admin') {
        setTimeout(() => {
          window.location.href = '/admin-dashboard'
        }, 2000)
      } else {
        // Redirect to user dashboard
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      }
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      toast.error(errorMessage)
      console.error('Login error:', error)
    }
  }

  const navigateToRegister = () => {
    window.location.href = '/register'
  }

  const navigateToHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-center items-center min-h-[80vh] p-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-lg">
          {/* Header */}
          <div className="bg-red-600 text-white text-center py-3">
            <h1 className="text-xl font-bold">Login</h1>
          </div>
          
          {/* Subheader */}
          <div className="bg-gray-100 text-center py-2">
            <p className="text-sm text-gray-700">Login to Fill/Submit/View Application Form</p>
          </div>
          
          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User ID */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  USER ID: <span className="text-red-500">*</span>
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

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  PASSWORD: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter Password"
                    className="w-full border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:border-red-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
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

              {/* Login Button */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  className="bg-red-600 text-white px-8 py-2 font-semibold hover:bg-red-700 focus:outline-none"
                >
                  LOGIN
                </button>
              </div>
            </form>

            {/* Links */}
            <div className="text-center mt-6 text-sm">
              <span className="text-gray-600">New? </span>
              <button
                onClick={navigateToRegister}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Register Here
              </button>
              <span className="text-gray-600"> | </span>
              <span className="text-gray-600">Return to </span>
              <button
                onClick={navigateToHome}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                 Home
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="bg-red-600 flex justify-center gap-4 py-3">
            <button 
              onClick={() => window.location.href = '/forgot-password'}
              className="bg-white text-red-600 px-4 py-1 text-sm font-semibold hover:bg-gray-100"
            >
              FORGOT PASSWORD
            </button>
            <button 
              onClick={() => window.location.href = '/change-password'}
              className="bg-white text-red-600 px-4 py-1 text-sm font-semibold hover:bg-gray-100"
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

export default Login






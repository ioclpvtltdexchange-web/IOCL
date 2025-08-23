import React, { useState, useEffect } from 'react'
import qrcode from '../assets/iocl qr code.jpg'
import { toast } from 'react-toastify'
import { authAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

const Payment = ({ onComplete, onBack }) => {
  const navigate = useNavigate()
  const [paymentData, setPaymentData] = useState({
    utrNumber: '',
    paymentMethod: 'online'
  })
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showTracking, setShowTracking] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrTimer, setQrTimer] = useState(0)
  const [showServerBusy, setShowServerBusy] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadPaymentDetails()
  }, [])

  // Auto-refresh payment status every 10 seconds when tracking is shown
  useEffect(() => {
    let interval = null
    if (showTracking && paymentStatus === 'processing') {
      interval = setInterval(() => {
        
        refreshPaymentStatus()
      }, 10000) // 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [showTracking, paymentStatus])

  useEffect(() => {
    let interval = null
    if (qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer(timer => timer - 1)
      }, 1000)
    } else if (qrTimer === 0 && showQRCode) {
      setShowQRCode(false)
    }
    return () => clearInterval(interval)
  }, [qrTimer, showQRCode])

  const handleShowQRCode = () => {
    setShowQRCode(true)
    setQrTimer(60) // 1 minute timer
  }

  const handleCardPayment = () => {
    setShowServerBusy(true)
  }

  const handleNetBankingPayment = () => {
    setShowServerBusy(true)
  }

  const handleGoToOnlinePayment = () => {
    setShowServerBusy(false)
    setPaymentData(prev => ({ ...prev, paymentMethod: 'online' }))
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const loadPaymentDetails = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))

      // Check if user is admin
      if (user.userId === 'Devil109' || user.role === 'admin') {
        toast.error('Admin users cannot access payment functionality. Please login with a regular user account.')
        navigate('/admin-dashboard')
        return
      }

      const response = await authAPI.getPaymentDetails(user.userId)

      if (response.paymentDetails.utrNumber) {
        setPaymentData({ utrNumber: response.paymentDetails.utrNumber })
        setPaymentStatus(response.paymentDetails.paymentStatus)
        setShowTracking(true)
        setLastRefreshTime(new Date())
      }
    } catch (error) {
      console.error('Error loading payment details:', error)
      if (error.response?.status === 400) {
        toast.error(error.response.data.message)
        navigate('/admin-dashboard')
      }
    }
  }

  // Function to refresh only payment status
  const refreshPaymentStatus = async () => {
    if (isRefreshing) return // Prevent multiple simultaneous requests

    const user = JSON.parse(localStorage.getItem('user'))

    // Check if user is admin
    if (user.userId === 'Devil109' || user.role === 'admin') {
      toast.error('Admin users cannot access payment functionality.')
      navigate('/admin-dashboard')
      return
    }

    setIsRefreshing(true)
    try {
      const response = await authAPI.getPaymentDetails(user.userId)

      if (response.paymentDetails.paymentStatus !== paymentStatus) {
        
        setPaymentStatus(response.paymentDetails.paymentStatus)
        toast.info(`Payment status updated: ${response.paymentDetails.paymentStatus.toUpperCase()}`)
      }
      setLastRefreshTime(new Date())
    } catch (error) {
      console.error('Error refreshing payment status:', error)
      if (error.response?.status === 400) {
        toast.error(error.response.data.message)
        navigate('/admin-dashboard')
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSubmitPayment = async (e) => {
    e.preventDefault()

    if (!paymentData.utrNumber.trim()) {
      toast.error('Please enter UTR number')
      return
    }

    const user = JSON.parse(localStorage.getItem('user'))

    // Check if user is admin
    if (user.userId === 'Devil109' || user.role === 'admin') {
      toast.error('Admin users cannot submit payment details. Please login with a regular user account.')
      navigate('/admin-dashboard')
      return
    }

    setIsLoading(true)

    try {
      await authAPI.savePaymentDetails(user.userId, paymentData)

      setPaymentStatus('processing')
      setShowTracking(true)
      toast.success('Payment details submitted successfully!')
    } catch (error) {
      console.error('Error submitting payment:', error)
      if (error.response?.status === 400) {
        toast.error(error.response.data.message)
        navigate('/admin-dashboard')
      } else {
        toast.error('Failed to submit payment details')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'processing': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'verified': return 'text-green-600 bg-green-50 border-green-200'
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const handleRetryPayment = () => {
    setShowTracking(false)
    setPaymentData({ utrNumber: '' })
    setPaymentStatus(null)
  }

  if (showTracking) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Tracking</h3>
                <p className="text-gray-600">Track your registration payment status</p>
              </div>
              <div className="flex flex-col items-end">
                {/* Refresh Button */}
                <button
                  onClick={() => {
                   
                    refreshPaymentStatus()
                    toast.info('Refreshing payment status...')
                  }}
                  disabled={isRefreshing}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                >
                  <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                  {isRefreshing ? 'REFRESHING...' : 'REFRESH STATUS'}
                </button>
                {/* Last Refresh Time */}
                <p className="text-xs text-gray-500">
                  Last updated: {lastRefreshTime.toLocaleTimeString()}
                </p>
                {paymentStatus === 'processing' && (
                  <p className="text-xs text-blue-600">
                    Auto-refresh: Every 10s
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center ${paymentStatus === 'processing' || paymentStatus === 'verified' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${paymentStatus === 'processing' || paymentStatus === 'verified' ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium">UTR Submitted</span>
              </div>

              <div className={`flex items-center ${paymentStatus === 'processing' || paymentStatus === 'verified' ? 'text-yellow-600' : paymentStatus === 'cancelled' ? 'text-red-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${paymentStatus === 'processing' ? 'bg-yellow-500' :
                  paymentStatus === 'verified' ? 'bg-green-500' :
                    paymentStatus === 'cancelled' ? 'bg-red-500' : 'bg-gray-300'
                  }`}>
                  {paymentStatus === 'processing' ? '⏳' : paymentStatus === 'verified' ? '✓' : paymentStatus === 'cancelled' ? '❌' : '2'}
                </div>
                <span className="ml-2 text-sm font-medium">
                  {paymentStatus === 'processing' ? 'Verification in Progress' :
                    paymentStatus === 'verified' ? 'Verification Complete' :
                      paymentStatus === 'cancelled' ? 'Verification Failed' : 'Pending Verification'}
                </span>
              </div>

              <div className={`flex items-center ${paymentStatus === 'verified' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${paymentStatus === 'verified' ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                  {paymentStatus === 'verified' ? '✓' : '3'}
                </div>
                <span className="ml-2 text-sm font-medium">Registration Complete</span>
              </div>
            </div>

            {/* Progress Line */}
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-full"></div>
              <div className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${paymentStatus === 'cancelled' ? 'bg-red-500 w-2/3' :
                paymentStatus === 'processing' ? 'bg-yellow-500 w-2/3' :
                  paymentStatus === 'verified' ? 'bg-green-500 w-full' : 'bg-blue-500 w-1/3'
                }`}></div>
            </div>
          </div>

          {/* Status Card */}
          <div className={`border rounded-lg p-6 mb-6 ${paymentStatus === 'processing' ? 'border-yellow-200 bg-yellow-50' :
            paymentStatus === 'verified' ? 'border-green-200 bg-green-50' :
              paymentStatus === 'cancelled' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-lg mb-2">UTR: {paymentData.utrNumber}</h4>
                <p className="text-sm opacity-75 mb-1">Registration Fee: ₹500</p>
                <p className="text-xs opacity-60">
                  Submitted: {new Date().toLocaleDateString('en-IN')}
                </p>
                <p className="text-xs opacity-60 mt-1">
                  Status checked: {lastRefreshTime.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${paymentStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  paymentStatus === 'verified' ? 'bg-green-100 text-green-800' :
                    paymentStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                  }`}>
                  {paymentStatus === 'processing' ? '⏳ UNDER VERIFICATION' :
                    paymentStatus === 'verified' ? '✅ VERIFIED' :
                      paymentStatus === 'cancelled' ? '❌ VERIFICATION FAILED' :
                        '📝 SUBMITTED'}
                </span>
              </div>
            </div>

            {/* Status Message */}
            <div className="mt-4 pt-4 border-t border-opacity-30">
              <p className="text-sm">
                {paymentStatus === 'processing' && (
                  <>
                    <strong>🔍 Your payment is being verified by our team.</strong><br />
                    This process usually takes up to 24 hours. You'll receive an email confirmation once verified.<br />
                    <span className="text-blue-600 text-xs">
                      💡 Status updates automatically every 10 seconds. You can also click "REFRESH STATUS" above.
                    </span>
                  </>
                )}
                {paymentStatus === 'verified' && (
                  <>
                    <strong>🎉 Congratulations! Your payment has been verified successfully.</strong><br />
                    Your registration is now complete. Check your email for the registration PDF.
                  </>
                )}
                {paymentStatus === 'cancelled' && (
                  <>
                    <strong>⚠️ Payment verification failed.</strong><br />
                    Please check your UTR number or contact our helpline for assistance.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {paymentStatus === 'cancelled' && (
              <button
                onClick={() => {
                  setShowTracking(false)
                  setPaymentData({ utrNumber: '' })
                  setPaymentStatus('pending')
                }}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
              >
                🔄 BACK TO PAYMENT
              </button>
            )}

            {paymentStatus === 'verified' && (
              <button
                onClick={() => navigate('/print')}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
              >
                📄 PRINT REGISTRATION
              </button>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-6 text-center bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Need Help?</strong>
            </p>
            <p className="text-sm text-gray-600">
              📞 Helpline: <span className="font-mono">082-94980489</span> |
              🕒 Available: 10 AM to 5 PM (Working Days)
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Complete Payment</h3>
          <p className="text-gray-600">Registration Fee: <span className="font-semibold text-green-600">₹500</span></p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Payment Methods - Left Side */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold text-gray-800 mb-4">Payment Methods</h4>
            <div className="space-y-3">
              <div
                className={`border-2 rounded-lg p-3 cursor-pointer transition-all text-center ${paymentData.paymentMethod === 'online'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
                  }`}
                onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'online' }))}
              >
                <div className="text-xl mb-1">📱</div>
                <h5 className="font-semibold text-sm">UPI Payment</h5>
                <p className="text-xs text-gray-600">PhonePe, GPay, Paytm</p>
              </div>

              <div
                className={`border-2 rounded-lg p-3 cursor-pointer transition-all text-center ${paymentData.paymentMethod === 'card'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
                  }`}
                onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'card' }))}
              >
                <div className="text-xl mb-1">💳</div>
                <h5 className="font-semibold text-sm">Card Payment</h5>
                <p className="text-xs text-gray-600">Credit & Debit Cards</p>
              </div>

              <div
                className={`border-2 rounded-lg p-3 cursor-pointer transition-all text-center ${paymentData.paymentMethod === 'netbanking'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
                  }`}
                onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'netbanking' }))}
              >
                <div className="text-xl mb-1">🏦</div>
                <h5 className="font-semibold text-sm">Net Banking</h5>
                <p className="text-xs text-gray-600">All Major Banks</p>
              </div>
            </div>
          </div>

          {/* Payment Content - Right Side */}
          <div className="lg:col-span-3">
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              {paymentData.paymentMethod === 'online' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* QR Code - Left Side */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Scan QR Code to Pay ₹500</h4>

                    {!showQRCode ? (
                      <div className="text-center">
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <img
                            src={qrcode}
                            alt="Payment QR Code"
                            className="w-48 h-48 mx-auto blur-sm"
                          />
                        </div>
                        <button
                          onClick={handleShowQRCode}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                        >
                          SHOW QR CODE
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <img
                            src={qrcode}
                            alt="Payment QR Code"
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                        <div className="bg-red-100 text-red-800 px-3 py-2 rounded mb-3">
                          <span className="font-mono text-lg">{formatTime(qrTimer)}</span>
                          <p className="text-xs">QR Code expires in</p>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-600 text-center">Use any UPI app to scan and pay</p>
                    <div className="flex justify-center gap-2 mt-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">PhonePe</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">GPay</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Paytm</span>
                    </div>
                  </div>

                  {/* Instructions - Right Side */}
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-4 flex items-center">
                      <span className="mr-2">ℹ️</span>
                      Payment Instructions
                    </h5>
                    <div className="space-y-3 text-sm text-blue-700">
                      <div className="flex items-start">
                        <span className="mr-2 mt-1">1️⃣</span>
                        <p>Click "SHOW QR CODE" button to reveal QR code</p>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2 mt-1">2️⃣</span>
                        <p>Scan QR code and pay ₹500 registration fee</p>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2 mt-1">3️⃣</span>
                        <p><strong>UTR number entry is mandatory</strong> after payment completion</p>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2 mt-1">4️⃣</span>
                        <p>Payment verification may take up to <strong>24 hours</strong></p>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2 mt-1">5️⃣</span>
                        <p>You'll receive <strong>email confirmation</strong> once payment is verified</p>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2 mt-1">6️⃣</span>
                        <p>Download your <strong>registration PDF</strong> from the verification email</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-sm text-blue-800 font-medium">
                        📞 Helpline: <span className="font-mono">082-94980489</span>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Available: 10 AM to 5 PM (Working Days)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {paymentData.paymentMethod === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold mb-4">Card Payment</h4>
                    <div className="flex justify-center gap-4 mb-6">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">Visa</span>
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm">Mastercard</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm">RuPay</span>
                    </div>
                    <button
                      onClick={handleCardPayment}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                    >
                      Pay ₹500 Securely
                    </button>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-4">Payment Instructions</h5>
                    <div className="space-y-2 text-sm text-blue-700">
                      <p>• Enter UTR number after payment</p>
                      <p>• Verification takes up to 24 hours</p>
                      <p>• Email confirmation will be sent</p>
                      <p>• Download PDF from email</p>
                      <p className="font-medium">📞 Help: 082-94980489</p>
                    </div>
                  </div>
                </div>
              )}

              {paymentData.paymentMethod === 'netbanking' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold mb-4">Net Banking</h4>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {['SBI', 'HDFC', 'ICICI', 'Axis', 'PNB', 'BOI', 'Canara', 'Union'].map(bank => (
                        <div key={bank} className="p-2 bg-gray-50 rounded text-center text-sm">
                          {bank}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleNetBankingPayment}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
                    >
                      Pay via Net Banking
                    </button>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-4">Payment Instructions</h5>
                    <div className="space-y-2 text-sm text-blue-700">
                      <p>• Select your bank and pay ₹500</p>
                      <p>• UTR number entry is mandatory</p>
                      <p>• Verification takes up to 24 hours</p>
                      <p>• Email confirmation will be sent</p>
                      <p className="font-medium">📞 Help: 082-94980489</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Server Busy Modal */}
            {showServerBusy && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
                  <div className="text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Server Temporarily Busy</h3>
                    <p className="text-gray-600 mb-6">
                      Our payment server is currently busy. Please use online payment method for now.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleGoToOnlinePayment}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                      >
                        USE ONLINE PAYMENT
                      </button>
                      <button
                        onClick={() => setShowServerBusy(false)}
                        className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors"
                      >
                        CLOSE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}



            <form onSubmit={handleSubmitPayment}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter UTR/Transaction ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentData.utrNumber}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, utrNumber: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter UTR/Transaction ID (e.g., 123456789012345)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  UTR number is found in your payment confirmation receipt/SMS
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors"
                >
                  BACK
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-2 rounded font-medium text-white transition-colors ${isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {isLoading ? 'PROCESSING...' : 'SUBMIT PAYMENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment







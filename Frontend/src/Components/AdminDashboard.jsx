import React, { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import Header from './Header'
import { authAPI } from '../services/api'

const AdminDashboard = () => {
  const [users, setUsers] = useState([])
  const [payments, setPayments] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [selectedTab, setSelectedTab] = useState('users')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingButtons, setLoadingButtons] = useState({}) // For approve/reject loading
  const [selectedDate, setSelectedDate] = useState('')
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date())

  useEffect(() => {
    // Check if admin is logged in with better error handling
    try {
      const userStr = localStorage.getItem('user')
      const token = localStorage.getItem('token')

      if (!userStr || !token) {
        
        window.location.href = '/login'
        return
      }

      const user = JSON.parse(userStr)

      // Check for admin role or admin userId
      if (!user || (user.role !== 'admin' && user.userId !== 'Devil109')) {
        
        window.location.href = '/login'
        return
      }

      
      loadData()
    } catch (error) {
      console.error('Error checking admin authentication:', error)
      window.location.href = '/login'
    }
  }, [])

  useEffect(() => {
    // Filter data when date changes
    filterDataByDate()
  }, [selectedDate, users, payments])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
    
      loadData()
      setLastRefreshTime(new Date())
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const filterDataByDate = () => {
    if (!selectedDate) {
      setFilteredUsers(users)
      setFilteredPayments(payments)
      return
    }

    const filterDate = new Date(selectedDate).toDateString()

    const filteredU = users.filter(user => {
      const userDate = new Date(user.createdAt).toDateString()
      return userDate === filterDate
    })

    const filteredP = payments.filter(payment => {
      const paymentDate = new Date(payment.createdAt).toDateString()
      return paymentDate === filterDate
    })

    setFilteredUsers(filteredU)
    setFilteredPayments(filteredP)
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const response = await authAPI.getAllUsersWithPayments()
      setUsers(response.users)
      setPayments(response.users)
      setLastRefreshTime(new Date())
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentStatusUpdate = async (userId, status) => {
    setLoadingButtons(prev => ({ ...prev, [userId]: status }))

    try {
      await authAPI.updatePaymentStatus(userId, {
        status,
        adminRemarks: status === 'cancelled' ? 'Payment verification failed' : 'Payment verified successfully'
      })

      toast.success(`Payment status updated to ${status}`)
      loadData() // Reload data
    } catch (error) {
      toast.error('Failed to update payment status')
    } finally {
      setLoadingButtons(prev => ({ ...prev, [userId]: null }))
    }
  }

  const handlePrintUsers = () => {
    const printContent = `
      <html>
        <head>
          <title>All Users Report - IOCL Company</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #d32f2f; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>IOCL Company - All Users Report</h1>
            <p class="date">Generated on: ${new Date().toLocaleDateString('en-IN')} ${selectedDate ? `| Filtered by: ${new Date(selectedDate).toLocaleDateString('en-IN')}` : ''}</p>
            <p><strong>Total Users: ${filteredUsers.length}</strong></p>
          </div>
          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Mobile Number</th>
                <th>Registration Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredUsers.map((user, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${user.userId}</td>
                  <td>${user.fullName}</td>
                  <td>${user.emailAddress}</td>
                  <td>${user.mobileNumber}</td>
                  <td>${new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>${user.paymentDetails?.paymentStatus === 'verified' ? 'Successful' : 'Active'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const handlePrintPayments = () => {
    const printContent = `
      <html>
        <head>
          <title>Payment Management Report - IOCL Company</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #d32f2f; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { font-size: 12px; color: #666; }
            .status-processing { background-color: #fff3cd; color: #856404; }
            .status-verified { background-color: #d4edda; color: #155724; }
            .status-cancelled { background-color: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>IOCL Company - Payment Management Report</h1>
            <p class="date">Generated on: ${new Date().toLocaleDateString('en-IN')} ${selectedDate ? `| Filtered by: ${new Date(selectedDate).toLocaleDateString('en-IN')}` : ''}</p>
            <p><strong>Total Payments: ${filteredPayments.length}</strong></p>
          </div>
          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>User ID</th>
                <th>UTR Number</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th>Admin Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments.map((user, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${user.userId}</td>
                  <td>${user.paymentDetails?.utrNumber || 'N/A'}</td>
                  <td>₹500</td>
                  <td>${new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                  <td class="status-${user.paymentDetails?.paymentStatus}">${user.paymentDetails?.paymentStatus?.toUpperCase() || 'PENDING'}</td>
                  <td>${user.paymentDetails?.adminRemarks || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Admin Header */}
      <div className="bg-red-600 px-6 py-2 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-white">🛡️ Admin Dashboard - Indian Oil Corporation Private Limited</h1>
          <p className="text-xs text-red-100">
            Last refreshed: {lastRefreshTime.toLocaleTimeString()} | Auto-refresh: Every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => {
              
              loadData()
              toast.info('Data refreshed!')
            }}
            disabled={isLoading}
            className="bg-white text-red-600 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
            {isLoading ? 'REFRESHING...' : 'REFRESH'}
          </button>

          {/* Logout Button */}
          <button
            onClick={() => {
              localStorage.removeItem('user')
              localStorage.removeItem('token')
              window.location.href = '/login'
            }}
            className="bg-white text-red-600 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-100 flex items-center gap-2"
          >
            <span>🚪</span> LOGOUT
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{filteredUsers.length}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredPayments.filter(p => p.paymentDetails?.paymentStatus === 'processing').length}
                </p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified Payments</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredPayments.filter(p => p.paymentDetails?.paymentStatus === 'verified').length}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{filteredPayments.filter(p => p.paymentDetails?.paymentStatus === 'verified').length * 500}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Clear Filter
                </button>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {selectedDate ? `Showing data for: ${new Date(selectedDate).toLocaleDateString('en-IN')}` : 'Showing all data'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setSelectedTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${selectedTab === 'users'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                👥 All Users ({filteredUsers.length})
              </button>
              <button
                onClick={() => setSelectedTab('payments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${selectedTab === 'payments'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                💳 Payment Management ({filteredPayments.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Registered Users</h3>
                  <button
                    onClick={handlePrintUsers}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    🖨️ Print Report
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.userId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.userId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fullName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.emailAddress}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.mobileNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.paymentDetails?.paymentStatus === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                              }`}>
                              {user.paymentDetails?.paymentStatus === 'verified' ? 'Successful' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedTab === 'payments' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Payment Management</h3>
                  <button
                    onClick={handlePrintPayments}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    🖨️ Print Report
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UTR Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.map((user) => (
                        <tr key={user.userId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.userId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{user.paymentDetails?.utrNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹500</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.paymentDetails?.paymentStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              user.paymentDetails?.paymentStatus === 'verified' ? 'bg-green-100 text-green-800' :
                                user.paymentDetails?.paymentStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                              }`}>
                              {user.paymentDetails?.paymentStatus?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {user.paymentDetails?.paymentStatus === 'processing' && (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handlePaymentStatusUpdate(user.userId, 'verified')}
                                  disabled={loadingButtons[user.userId]}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${loadingButtons[user.userId] === 'verified'
                                    ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg transform hover:scale-105'
                                    }`}
                                >
                                  {loadingButtons[user.userId] === 'verified' ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                                      <span>Approving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-lg">✅</span>
                                      <span>APPROVE</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handlePaymentStatusUpdate(user.userId, 'cancelled')}
                                  disabled={loadingButtons[user.userId]}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${loadingButtons[user.userId] === 'cancelled'
                                    ? 'bg-red-100 text-red-600 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg transform hover:scale-105'
                                    }`}
                                >
                                  {loadingButtons[user.userId] === 'cancelled' ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                                      <span>Rejecting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-lg">❌</span>
                                      <span>REJECT</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {user.paymentDetails?.paymentStatus === 'verified' && (
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                  ✅ APPROVED
                                </span>
                              </div>
                            )}

                            {user.paymentDetails?.paymentStatus === 'cancelled' && (
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                  ❌ REJECTED
                                </span>
                              </div>
                            )}

                            {!user.paymentDetails?.paymentStatus && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                                ⏳ PENDING
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard





















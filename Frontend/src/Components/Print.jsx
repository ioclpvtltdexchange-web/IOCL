import React, { useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Print = () => {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) {
        navigate('/login')
        return
      }

      

      // Get all user data from different endpoints
      const [candidateResponse, qualificationResponse, documentResponse] = await Promise.all([
        authAPI.getCandidateDetails(user.userId).catch((err) => {
          
          return { candidateDetails: null }
        }),
        authAPI.getQualificationDetails(user.userId).catch((err) => {
          
          return { qualificationDetails: null }
        }),
        authAPI.getDocumentDetails(user.userId).catch((err) => {
          
          return { documentDetails: null }
        })
      ])



      // Combine all data
      const completeUserData = {
        ...user,
        candidateDetails: candidateResponse.candidateDetails,
        qualificationDetails: qualificationResponse.qualificationDetails,
        documentDetails: documentResponse.documentDetails
      }

  

      setUserData(completeUserData)
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load user data')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Data Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { margin: 0; padding: 20px; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div className="print-page max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-red-600 pb-6">
          <div className="flex justify-center mb-4">
            <img
              src="/src/assets/IOCL logo.png"
              alt="IOCL India Limited"
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">INDIAN OIL CORPORATION LIMITED</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Registration Form</h2>
          <p className="text-gray-600">Application ID: {userData.userId}</p>
          <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        {/* Candidate Details Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded">
            📋 CANDIDATE DETAILS
          </h3>

          <div className="flex gap-6">
            {/* Details Section - Left Side */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name:</label>
                      <p className="font-semibold text-gray-800">{(userData.fullName || '-').toUpperCase()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Father's Name:</label>
                      <p className="font-semibold text-gray-800">{(userData.candidateDetails?.personalDetails?.fatherName || '-').toUpperCase()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Mother's Name:</label>
                      <p className="font-semibold text-gray-800">{(userData.candidateDetails?.personalDetails?.motherName || '-').toUpperCase()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Post Code:</label>
                      <p className="font-semibold text-gray-800">{userData.postCode || userData.candidateDetails?.postCode || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date of Birth:</label>
                      <p className="font-semibold text-gray-800">{userData.candidateDetails?.dobDetails?.dateOfBirth ? new Date(userData.candidateDetails.dobDetails.dateOfBirth).toLocaleDateString('en-IN') : '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Gender:</label>
                      <p className="font-semibold text-gray-800 capitalize">{userData.candidateDetails?.personalDetails?.gender || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Category & Status</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Category:</label>
                      <p className="font-semibold text-gray-800 uppercase">{userData.candidateDetails?.personalDetails?.category || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nationality:</label>
                      <p className="font-semibold text-gray-800">{userData.candidateDetails?.personalDetails?.nationality || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Marital Status:</label>
                      <p className="font-semibold text-gray-800 capitalize">{userData.candidateDetails?.personalDetails?.maritalStatus || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Benchmark Disability:</label>
                      <p className="font-semibold text-gray-800">{userData.candidateDetails?.benchmarkDisability?.isDisabled ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ex-Servicemen:</label>
                      <p className="font-semibold text-gray-800">{userData.candidateDetails?.exServicemen?.isExServicemen ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Contact Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Mobile Number:</label>
                      <p className="font-semibold text-gray-800">
                        {userData?.mobileNumber ||
                          userData?.candidateDetails?.personalDetails?.mobileNumber ||
                          userData?.candidateDetails?.mobileNumber ||
                          JSON.parse(localStorage.getItem('user'))?.mobileNumber ||
                          'Not Available'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email Address:</label>
                      <p className="font-semibold text-gray-800">{userData.emailAddress || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Correspondence Address:</label>
                      <p className="font-semibold text-gray-800 text-sm leading-relaxed">
                        {userData.candidateDetails?.correspondenceAddress?.addressLine1 ?
                          `${userData.candidateDetails.correspondenceAddress.addressLine1}, ${userData.candidateDetails.correspondenceAddress.cityDistrict}, ${userData.candidateDetails.correspondenceAddress.state} - ${userData.candidateDetails.correspondenceAddress.pincode}` : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Permanent Address:</label>
                      <p className="font-semibold text-gray-800 text-sm leading-relaxed">
                        {userData.candidateDetails?.permanentAddress?.sameAsCorrespondence ? 'Same as Correspondence Address' :
                          (userData.candidateDetails?.permanentAddress?.addressLine1 ?
                            `${userData.candidateDetails.permanentAddress.addressLine1}, ${userData.candidateDetails.permanentAddress.cityDistrict}, ${userData.candidateDetails.permanentAddress.state} - ${userData.candidateDetails.permanentAddress.pincode}` : '-')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Section - Right Side */}
            <div className="w-64">
              <div className="text-center mb-6">
                <div className="inline-block border-2 border-gray-300 p-2 rounded">
                  {userData.documentDetails?.passportPhoto ? (
                    <img
                      src={userData.documentDetails.passportPhoto}
                      alt="Candidate Photo"
                      className="w-32 h-40 object-cover rounded"
                    />
                  ) : (
                    <div className="w-32 h-40 bg-gray-200 flex items-center justify-center rounded">
                      <span className="text-gray-500">No Photo</span>
                    </div>
                  )}
                  <p className="text-xs text-center mt-2 font-medium">Candidate Photo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Qualification Details Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded">
            🎓 QUALIFICATION DETAILS
          </h3>

          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Qualification</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Board/Institute</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Year</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Percentage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subjects/Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium">10th Standard</td>
                  <td className="px-4 py-3 text-sm">{(userData.qualificationDetails?.matriculation?.boardName || '-').toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm">{userData.qualificationDetails?.matriculation?.yearOfPassing || '-'}</td>
                  <td className="px-4 py-3 text-sm">{userData.qualificationDetails?.matriculation?.percentage || '-'}%</td>
                  <td className="px-4 py-3 text-sm">
                    {userData.qualificationDetails?.matriculation?.subjects ?
                      (userData.qualificationDetails.matriculation.subjects.replace(/\([^)]*\)/g, '').trim() || userData.qualificationDetails.matriculation.subjects).toUpperCase() :
                      '-'
                    }
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium">12th Standard</td>
                  <td className="px-4 py-3 text-sm">{(userData.qualificationDetails?.intermediate?.boardName || '-').toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm">{userData.qualificationDetails?.intermediate?.yearOfPassing || '-'}</td>
                  <td className="px-4 py-3 text-sm">{userData.qualificationDetails?.intermediate?.percentage || '-'}%</td>
                  <td className="px-4 py-3 text-sm">
                    {userData.qualificationDetails?.intermediate?.subjects ?
                      (userData.qualificationDetails.intermediate.subjects.replace(/\([^)]*\)/g, '').trim() || userData.qualificationDetails.intermediate.subjects).toUpperCase() :
                      (userData.qualificationDetails?.intermediate?.stream ? userData.qualificationDetails.intermediate.stream.toUpperCase() : '-')
                    }
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium">ITI</td>
                  <td className="px-4 py-3 text-sm">{(userData.qualificationDetails?.iti?.instituteName || '-').toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm">{userData.qualificationDetails?.iti?.yearOfPassing || '-'}</td>
                  <td className="px-4 py-3 text-sm">{userData.qualificationDetails?.iti?.percentage || '-'}%</td>
                  <td className="px-4 py-3 text-sm">
                    {userData.qualificationDetails?.iti?.trade ?
                      (userData.qualificationDetails.iti.trade.replace(/\([^)]*\)/g, '').trim() || userData.qualificationDetails.iti.trade).toUpperCase() :
                      '-'
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* City Preferences Section */}
          {userData.qualificationDetails?.examCityPreference && (
            <div className="mt-6 bg-blue-50 p-4 rounded border border-blue-200">
              <h4 className="font-semibold text-gray-700 mb-3 border-b border-blue-300 pb-2">🏙️ Exam City Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">First Preference:</label>
                  <p className="font-semibold text-gray-800">{(userData.qualificationDetails.examCityPreference.city1 || '-').toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Second Preference:</label>
                  <p className="font-semibold text-gray-800">{(userData.qualificationDetails.examCityPreference.city2 || '-').toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Third Preference:</label>
                  <p className="font-semibold text-gray-800">{(userData.qualificationDetails.examCityPreference.city3 || '-').toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Document Upload Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">
            📄 DOCUMENT UPLOADS
          </h3>

          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Document Type</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-3 py-2 text-sm">10th Marksheet</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${userData.documentDetails?.class10Marksheet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {userData.documentDetails?.class10Marksheet ? '✅ Uploaded' : '❌ Not Uploaded'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {userData.documentDetails?.class10Marksheet && (
                      <button
                        onClick={() => window.open(userData.documentDetails.class10Marksheet, '_blank')}
                        className="text-blue-600 hover:text-blue-800 text-sm no-print"
                      >
                        Click Here
                      </button>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm">12th Marksheet</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${userData.documentDetails?.class12Marksheet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {userData.documentDetails?.class12Marksheet ? '✅ Uploaded' : '❌ Not Uploaded'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {userData.documentDetails?.class12Marksheet && (
                      <button
                        onClick={() => window.open(userData.documentDetails.class12Marksheet, '_blank')}
                        className="text-blue-600 hover:text-blue-800 text-sm no-print"
                      >
                        Click Here
                      </button>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm">ITI Marksheet</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${userData.documentDetails?.itiMarksheet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {userData.documentDetails?.itiMarksheet ? '✅ Uploaded' : '❌ Not Uploaded'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {userData.documentDetails?.itiMarksheet && (
                      <button
                        onClick={() => window.open(userData.documentDetails.itiMarksheet, '_blank')}
                        className="text-blue-600 hover:text-blue-800 text-sm no-print"
                      >
                        Click Here
                      </button>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm">Cast Certificate</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${userData.documentDetails?.castCertificate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {userData.documentDetails?.castCertificate ? '✅ Uploaded' : '❌ Not Uploaded'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {userData.documentDetails?.castCertificate && (
                      <button
                        onClick={() => window.open(userData.documentDetails.castCertificate, '_blank')}
                        className="text-blue-600 hover:text-blue-800 text-sm no-print"
                      >
                        Click Here
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature Section */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2 bg-gray-100 p-2 rounded">
            ✍️ CANDIDATE SIGNATURE
          </h3>

          <div className="border-2 border-gray-300 p-3 rounded w-60">
            {userData.documentDetails?.signature ? (
              <img
                src={userData.documentDetails.signature}
                alt="Candidate Signature"
                className="w-full h-16 object-contain"
              />
            ) : (
              <div className="w-full h-16 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No Signature</span>
              </div>
            )}
            <p className="text-xs text-center mt-1 font-medium">Candidate Signature</p>
          </div>
        </div>

        {/* Payment Status Section */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2 bg-gray-100 p-2 rounded">
            💳 PAYMENT STATUS
          </h3>

          <div className="border border-gray-200 p-3 rounded bg-green-50">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-lg">✓</span>
                </div>
                <h4 className="text-lg font-bold text-green-800 mb-1">PAYMENT SUCCESSFUL</h4>
                <p className="text-green-700 font-medium text-sm">Registration Fee: ₹500</p>
                <p className="text-xs text-green-600">Payment Verified & Registration Complete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Declaration */}
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-800 mb-2 bg-gray-100 p-2 rounded">
            📝 DECLARATION
          </h3>

          <div className="border border-gray-200 p-3 rounded bg-gray-50">
            <p className="text-xs text-gray-700 leading-tight">
              I hereby declare that all the information provided by me in this application form is true, complete and correct to the best of my knowledge and belief. I understand that any false information or concealment of facts will render my candidature liable for rejection/cancellation at any stage of the recruitment process or even after appointment. I also undertake to abide by the rules and regulations of IOCL Company.
            </p>
          </div>
        </div>

        {/* Print Button */}
        <div className="text-center no-print mb-8">
          <button
            onClick={handlePrint}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors mr-4"
          >
            🖨️ PRINT REGISTRATION FORM
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('user')
              localStorage.removeItem('token')
              navigate('/login')
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
          >
            🚪 LOGOUT
          </button>
        </div>
      </div>
    </div>
  )
}

export default Print































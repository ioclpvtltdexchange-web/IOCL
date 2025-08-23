import React, { useState, useEffect } from 'react'
import { AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'
import { toast } from 'react-toastify'
import Header from './Header'
import Payment from './Payment'
import { authAPI } from '../services/api'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [activeStep, setActiveStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
      checkUserProgress(JSON.parse(userData))
    }
  }, [])

  const steps = [
    { id: 1, name: 'CANDIDATE DETAILS', key: 'candidate' },
    { id: 2, name: 'QUALIFICATION', key: 'qualification' },
    { id: 3, name: 'DOCUMENT UPLOADING', key: 'documents' },
    { id: 4, name: 'PAYMENT', key: 'payment' }
  ]

  const handleStepClick = (stepId) => {
    // Only allow clicking on completed steps or the next immediate step
    if (completedSteps.includes(stepId) || stepId === activeStep) {
      setActiveStep(stepId)
    } else {
      toast.error('Please complete previous steps first')
    }
  }

  const handleStepComplete = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId])
    }

    // Move to next step
    if (stepId < steps.length) {
      setActiveStep(stepId + 1)
    }
  }
  const checkUserProgress = async (userData) => {
    try {
      setIsLoading(true)

      // Admin ke liye API calls mat karo
      if (userData.userId === 'Devil109' || userData.role === 'admin') {
        setCompletedSteps([])
        setActiveStep(1)
        return
      }

      const responses = await Promise.all([
        authAPI.getCandidateDetails(userData.userId).catch(() => ({ candidateDetails: null })),
        authAPI.getQualificationDetails(userData.userId).catch(() => ({ qualificationDetails: null })),
        authAPI.getDocumentDetails(userData.userId).catch(() => ({ documentDetails: null })),
        authAPI.getPaymentDetails(userData.userId).catch(() => ({ paymentDetails: null }))
      ])

      const [candidateResponse, qualificationResponse, documentResponse, paymentResponse] = responses

      const completed = []
      let nextActiveStep = 1

      // Check candidate details properly
      if (candidateResponse.candidateDetails &&
        candidateResponse.candidateDetails.personalDetails &&
        Object.keys(candidateResponse.candidateDetails.personalDetails).length > 0) {
        completed.push(1)
        nextActiveStep = 2
      } else {
        // New user - start from step 1
        setCompletedSteps([])
        setActiveStep(1)
        setIsLoading(false)
        return
      }

      // Check qualification details properly
      if (qualificationResponse.qualificationDetails &&
        Object.keys(qualificationResponse.qualificationDetails).length > 0) {
        completed.push(2)
        nextActiveStep = 3
      } else {
        // Stop here if qualification not completed
        setCompletedSteps(completed)
        setActiveStep(nextActiveStep)
        setIsLoading(false)
        return
      }

      // Check document details properly
      if (documentResponse.documentDetails && (
        documentResponse.documentDetails.passportPhoto ||
        documentResponse.documentDetails.signature ||
        documentResponse.documentDetails.class10Marksheet
      )) {
        completed.push(3)
        nextActiveStep = 4
      } else {
        // Stop here if documents not uploaded
        setCompletedSteps(completed)
        setActiveStep(nextActiveStep)
        setIsLoading(false)
        return
      }

      // Check payment details
      if (paymentResponse.paymentDetails && paymentResponse.paymentDetails.utrNumber) {
        completed.push(4)
        nextActiveStep = 4 // Stay on payment step if completed
      }

      setCompletedSteps(completed)
      setActiveStep(nextActiveStep)

    } catch (error) {
      console.error('Error checking user progress:', error)
      // Default to step 1 for new users
      setCompletedSteps([])
      setActiveStep(1)
    } finally {
      setIsLoading(false)
    }
  }

  const getStepClass = (stepId) => {
    if (completedSteps.includes(stepId)) {
      return 'bg-green-600 text-white cursor-pointer'
    } else if (stepId === activeStep) {
      return 'bg-red-600 text-white cursor-pointer'
    } else {
      return 'bg-gray-400 text-gray-700 cursor-not-allowed'
    }
  }

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gray-200">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p>Loading your progress...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Header />

      {/* Red Header Banner with Logout */}
      <div className="bg-red-600 px-6 py-2 flex justify-between items-center">
        <h1 className="text-lg font-bold text-white">IOCL Application Form</h1>
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

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Navigation Steps */}
          <div className="bg-gray-600 rounded-t">
            <div className="flex">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  className={`px-6 py-3 text-sm font-semibold border-r border-gray-500 last:border-r-0 transition-colors ${getStepClass(step.id)}`}
                >
                  {step.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white min-h-96 p-6 rounded-b border border-gray-300">
            {activeStep === 1 && <CandidateDetails onComplete={() => handleStepComplete(1)} />}
            {activeStep === 2 && <Qualification onComplete={() => handleStepComplete(2)} onBack={() => setActiveStep(1)} />}
            {activeStep === 3 && <DocumentUploading onComplete={() => handleStepComplete(3)} onBack={() => setActiveStep(2)} />}
            {activeStep === 4 && <Payment onComplete={() => handleStepComplete(4)} onBack={() => setActiveStep(3)} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// State and City Data
const statesAndCities = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kadapa', 'Anantapur', 'Chittoor'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur', 'Bomdila', 'Ziro', 'Along', 'Tezu', 'Changlang', 'Khonsa'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Karimganj', 'Sivasagar'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Mahasamund'],
  'Goa': ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Cuncolim', 'Quepem'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Navsari'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Una', 'Kullu', 'Hamirpur'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur', 'Kasaragod'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Ukhrul', 'Senapati', 'Tamenglong', 'Jiribam', 'Chandel'],
  'Meghalaya': ['Shillong', 'Tura', 'Cherrapunji', 'Jowai', 'Baghmara', 'Nongpoh', 'Mawkyrwat', 'Resubelpara', 'Ampati', 'Williamnagar'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Mamit', 'Lawngtlai', 'Saitual', 'Khawzawl'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Kiphire', 'Longleng', 'Peren'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda'],
  'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur', 'Batala', 'Pathankot'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar'],
  'Sikkim': ['Gangtok', 'Namchi', 'Geyzing', 'Mangan', 'Jorethang', 'Nayabazar', 'Rangpo', 'Singtam', 'Pakyong', 'Ravangla'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukkudi'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia', 'Khowai', 'Ambassa', 'Teliamura', 'Sabroom', 'Sonamura'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Kotdwar', 'Ramnagar', 'Jaspur'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Bardhaman', 'Kharagpur', 'Haldia', 'Raiganj'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi']
}

// Candidate Details Component
const CandidateDetails = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [sections, setSections] = useState({
    personalDetails: true,
    benchmarkDisability: true,
    exServicemen: true,
    employeeDetails: true,
    wclDetails: true,
    correspondenceAddress: true,
    permanentAddress: true,
    dobDetails: true
  })

  const [formData, setFormData] = useState({
    personalDetails: {
      fatherName: '',
      motherName: '',
      gender: '',
      maritalStatus: '',
      nationality: '',
      religion: '',
      category: ''
    },
    benchmarkDisability: {
      isDisabled: false,
      disabilityType: '',
      disabilityPercentage: '',
      certificateNumber: ''
    },
    exServicemen: {
      isExServicemen: false,
      serviceNumber: '',
      rank: '',
      unit: '',
      serviceFrom: '',
      serviceTo: '',
      dischargeType: ''
    },
    employeeDetails: {
      employeeId: '',
      department: '',
      designation: '',
      joiningDate: '',
      currentSalary: '',
      workLocation: ''
    },
    wclDetails: {
      wclEmployeeId: '',
      wclDepartment: '',
      wclDesignation: '',
      wclJoiningDate: '',
      wclWorkLocation: ''
    },
    correspondenceAddress: {
      addressLine1: '',
      addressLine2: '',
      country: '',
      state: '',
      cityDistrict: '',
      postOffice: '',
      pincode: '',
      policeStation: '',
      nearestRailwayStation: ''
    },
    permanentAddress: {
      sameAsCorrespondence: false,
      addressLine1: '',
      addressLine2: '',
      country: '',
      state: '',
      cityDistrict: '',
      postOffice: '',
      pincode: '',
      policeStation: '',
      nearestRailwayStation: ''
    },
    dobDetails: {
      dateOfBirth: '',
      calculatedAge: ''
    }
  })

  // Load existing data on component mount
  useEffect(() => {
    loadCandidateDetails()
  }, [])

  const loadCandidateDetails = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))

      // Admin ke liye API call mat karo
      if (user.userId === 'Devil109' || user.role === 'admin') {
        return
      }

      const response = await authAPI.getCandidateDetails(user.userId)

      if (response.candidateDetails) {
        // Fix date format for input field
        const candidateData = { ...response.candidateDetails }
        if (candidateData.dobDetails?.dateOfBirth) {
          candidateData.dobDetails.dateOfBirth = candidateData.dobDetails.dateOfBirth.split('T')[0]
          // Calculate age when loading data
          candidateData.dobDetails.calculatedAge = calculateAge(candidateData.dobDetails.dateOfBirth)
        }

        const completeData = {
          personalDetails: candidateData.personalDetails || {
            fatherName: '',
            motherName: '',
            gender: '',
            maritalStatus: '',
            nationality: 'Indian',
            religion: '',
            category: ''
          },
          benchmarkDisability: candidateData.benchmarkDisability || {
            isDisabled: false,
            disabilityType: '',
            disabilityPercentage: '',
            certificateNumber: ''
          },
          exServicemen: candidateData.exServicemen || {
            isExServicemen: false,
            serviceNumber: '',
            rank: '',
            unit: '',
            serviceFrom: '',
            serviceTo: '',
            dischargeType: ''
          },
          employeeDetails: candidateData.employeeDetails || {
            employeeId: '',
            department: '',
            designation: '',
            joiningDate: '',
            currentSalary: '',
            workLocation: ''
          },
          wclDetails: candidateData.wclDetails || {
            wclEmployeeId: '',
            wclDepartment: '',
            wclDesignation: '',
            wclJoiningDate: '',
            wclWorkLocation: ''
          },
          correspondenceAddress: candidateData.correspondenceAddress || {
            addressLine1: '',
            addressLine2: '',
            country: 'India',
            state: '',
            cityDistrict: '',
            postOffice: '',
            pincode: '',
            policeStation: '',
            nearestRailwayStation: ''
          },
          permanentAddress: candidateData.permanentAddress || {
            sameAsCorrespondence: false,
            addressLine1: '',
            addressLine2: '',
            country: 'India',
            state: '',
            cityDistrict: '',
            postOffice: '',
            pincode: '',
            policeStation: '',
            nearestRailwayStation: ''
          },
          dobDetails: candidateData.dobDetails || {
            dateOfBirth: '',
            calculatedAge: ''
          }
        }

        setFormData(completeData)
      }
    } catch (error) {
      console.error('Error loading candidate details:', error)
    }
  }

  const calculateAge = (birthDate) => {
    if (!birthDate) return ''

    const birth = new Date(birthDate)
    const today = new Date() // Current date use kariye, fixed date nahi

    // Invalid date check
    if (isNaN(birth.getTime())) return ''

    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()
    let days = today.getDate() - birth.getDate()

    if (days < 0) {
      months--
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      days += lastMonth.getDate()
    }

    if (months < 0) {
      years--
      months += 12
    }

    return `${years} Years ${months} Months ${days} Days`
  }

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))

    // Auto calculate age for DOB - immediate calculation
    if (section === 'dobDetails' && field === 'dateOfBirth') {
      const age = calculateAge(value)
      setFormData(prev => ({
        ...prev,
        dobDetails: {
          ...prev.dobDetails,
          dateOfBirth: value,
          calculatedAge: age
        }
      }))
    }

    // Copy correspondence to permanent address
    if (section === 'permanentAddress' && field === 'sameAsCorrespondence' && value) {
      setFormData(prev => ({
        ...prev,
        permanentAddress: {
          ...prev.correspondenceAddress,
          sameAsCorrespondence: true
        }
      }))
    }
  }

  const toggleSection = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSaveAndNext = async () => {
    setIsLoading(true)

    try {
      const user = JSON.parse(localStorage.getItem('user'))

      // Ensure all required fields have default values
      const completeFormData = {
        personalDetails: formData.personalDetails || {},
        benchmarkDisability: formData.benchmarkDisability || { isDisabled: false },
        exServicemen: formData.exServicemen || {},
        employeeDetails: formData.employeeDetails || {},
        wclDetails: formData.wclDetails || {},
        correspondenceAddress: {
          addressLine1: formData.correspondenceAddress?.addressLine1 || '',
          addressLine2: formData.correspondenceAddress?.addressLine2 || '',
          country: formData.correspondenceAddress?.country || 'India',
          state: formData.correspondenceAddress?.state || '',
          cityDistrict: formData.correspondenceAddress?.cityDistrict || '',
          postOffice: formData.correspondenceAddress?.postOffice || '',
          pincode: formData.correspondenceAddress?.pincode || '',
          policeStation: formData.correspondenceAddress?.policeStation || '',
          nearestRailwayStation: formData.correspondenceAddress?.nearestRailwayStation || ''
        },
        permanentAddress: {
          sameAsCorrespondence: formData.permanentAddress?.sameAsCorrespondence || false,
          addressLine1: formData.permanentAddress?.addressLine1 || '',
          addressLine2: formData.permanentAddress?.addressLine2 || '',
          country: formData.permanentAddress?.country || 'India',
          state: formData.permanentAddress?.state || '',
          cityDistrict: formData.permanentAddress?.cityDistrict || '',
          postOffice: formData.permanentAddress?.postOffice || '',
          pincode: formData.permanentAddress?.pincode || '',
          policeStation: formData.permanentAddress?.policeStation || '',
          nearestRailwayStation: formData.permanentAddress?.nearestRailwayStation || ''
        },
        dobDetails: {
          dateOfBirth: formData.dobDetails?.dateOfBirth || null,
          calculatedAge: formData.dobDetails?.calculatedAge || 0
        }
      }

      const response = await authAPI.saveCandidateDetails(user.userId, completeFormData)

      toast.success('Candidate details saved successfully!')
      onComplete() // Move to next step

    } catch (error) {
      console.error('Error saving candidate details:', error)
      toast.error('Failed to save candidate details')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Personal Details Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        {/* Personal Details Header */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('personalDetails')}>
          <h3 className="font-semibold text-gray-800">Personal Details</h3>
          {sections.personalDetails ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {/* Personal Details Form */}
        {sections.personalDetails && (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Gender: <span className="text-red-500">*</span>
                </label>
                <select className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.personalDetails.gender}
                  onChange={(e) => handleInputChange('personalDetails', 'gender', e.target.value)}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nationality <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="indian"
                    name="nationality"
                    value="indian"
                    className="mr-2"
                    checked={formData.personalDetails.nationality === 'indian'}
                    onChange={(e) => handleInputChange('personalDetails', 'nationality', e.target.value)}
                  />
                  <label htmlFor="indian" className="text-sm">Indian</label>
                </div>
              </div>

              {/* Father's Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Father's Name: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Father's Name"
                  className="w-full uppercase border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.personalDetails.fatherName}
                  onChange={(e) => handleInputChange('personalDetails', 'fatherName', e.target.value)}
                />
              </div>

              {/* Mother's Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mother's Name: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Mother's Name"
                  className="w-full uppercase border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.personalDetails.motherName}
                  onChange={(e) => handleInputChange('personalDetails', 'motherName', e.target.value)}
                />
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Marital Status <span className="text-red-500">*</span>
                </label>
                <select className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.personalDetails.maritalStatus}
                  onChange={(e) => handleInputChange('personalDetails', 'maritalStatus', e.target.value)}>
                  <option value="">Marital Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>

              {/* Caste */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Caste<span className="text-red-500">*</span>
                </label>
                <select className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.personalDetails.category}
                  onChange={(e) => handleInputChange('personalDetails', 'category', e.target.value)}>
                  <option value="">Category</option>
                  <option value="general">General</option>
                  <option value="obc">OBC</option>
                  <option value="sc">SC</option>
                  <option value="st">ST</option>
                  <option value="ews">EWS</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Person with Benchmark Disability Details Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        {/* Benchmark Disability Header */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('benchmarkDisability')}>
          <h3 className="font-semibold text-gray-800">Person with Benchmark Disability Details</h3>
          {sections.benchmarkDisability ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {/* Benchmark Disability Form */}
        {sections.benchmarkDisability && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-4">
                Do you have any Benchmark Disability?<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="benchmarkDisability"
                    value="yes"
                    className="mr-2"
                    checked={formData.benchmarkDisability.isDisabled === true}
                    onChange={(e) => handleInputChange('benchmarkDisability', 'isDisabled', true)}
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="benchmarkDisability"
                    value="no"
                    className="mr-2"
                    checked={formData.benchmarkDisability.isDisabled === false}
                    onChange={(e) => handleInputChange('benchmarkDisability', 'isDisabled', false)}
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ex Servicemen Details Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        {/* Ex Servicemen Header */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('exServicemen')}>
          <h3 className="font-semibold text-gray-800">Ex Servicemen Details</h3>
          {sections.exServicemen ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {/* Ex Servicemen Form */}
        {sections.exServicemen && (
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium mb-4">
                Are you an Ex-Servicemen [as defined in the Advertisement Clause no. 7. (vii)]?<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exServicemen"
                    value="yes"
                    className="mr-2"
                    checked={formData.exServicemen.isExServicemen}
                    onChange={(e) => handleInputChange('exServicemen', 'isExServicemen', e.target.value === 'yes')}
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exServicemen"
                    value="no"
                    className="mr-2"
                    checked={!formData.exServicemen.isExServicemen}
                    onChange={(e) => handleInputChange('exServicemen', 'isExServicemen', e.target.value === 'yes')}
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Employee Details Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        {/* Employee Details Header */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('employeeDetails')}>
          <h3 className="font-semibold text-gray-800">Employee Details</h3>
          {sections.employeeDetails ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {/* Employee Details Form */}
        {sections.employeeDetails && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-4">
                Are you employed in any Government Department/ PSU/ Autonomous Bodies ?<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="governmentEmployee"
                    value="yes"
                    className="mr-2"
                    checked={formData.employeeDetails.employeeId !== ''}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('employeeDetails', 'employeeId', 'temp_id')
                      }
                    }}
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="governmentEmployee"
                    value="no"
                    className="mr-2"
                    checked={formData.employeeDetails.employeeId === ''}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          employeeDetails: {
                            employeeId: '',
                            department: '',
                            designation: '',
                            joiningDate: '',
                            currentSalary: '',
                            workLocation: ''
                          }
                        }))
                      }
                    }}
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>

            {/* Show employee fields only if Yes is selected */}
            {formData.employeeDetails.employeeId !== '' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeDetails.employeeId}
                    onChange={(e) => handleInputChange('employeeDetails', 'employeeId', e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
                {/* ... other employee fields ... */}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Work contract labours (WCLs) Details Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        {/* WCL Details Header */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('wclDetails')}>
          <h3 className="font-semibold text-gray-800">Work contract labours (WCLs) Details</h3>
          {sections.wclDetails ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {/* WCL Details Form */}
        {sections.wclDetails && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-4">
                Are you employed in WCL ?<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="wclEmployee"
                    value="yes"
                    className="mr-2"
                    checked={formData.wclDetails.wclEmployeeId !== ''}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('wclDetails', 'wclEmployeeId', 'temp_id')
                      }
                    }}
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="wclEmployee"
                    value="no"
                    className="mr-2"
                    checked={formData.wclDetails.wclEmployeeId === ''}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          wclDetails: {
                            wclEmployeeId: '',
                            wclDepartment: '',
                            wclDesignation: '',
                            wclJoiningDate: '',
                            wclWorkLocation: ''
                          }
                        }))
                      }
                    }}
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Correspondence Address Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        {/* Correspondence Address Header */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('correspondenceAddress')}>
          <h3 className="font-semibold text-gray-800">Correspondence Address</h3>
          {sections.correspondenceAddress ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {/* Correspondence Address Form */}
        {sections.correspondenceAddress && (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Address Line 1"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.correspondenceAddress.addressLine1}
                  onChange={(e) => handleInputChange('correspondenceAddress', 'addressLine1', e.target.value)}
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  placeholder="Address Line 2"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.correspondenceAddress.addressLine2}
                  onChange={(e) => handleInputChange('correspondenceAddress', 'addressLine2', e.target.value)}
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.correspondenceAddress.country}
                  onChange={(e) => handleInputChange('correspondenceAddress', 'country', e.target.value)}>
                  <option value="">Select Country</option>
                  <option value="India">India</option>
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <select className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.correspondenceAddress.state}
                  onChange={(e) => handleInputChange('correspondenceAddress', 'state', e.target.value)}>
                  <option value="">Select State</option>
                  {Object.keys(statesAndCities).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* City/District */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  City/District <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.correspondenceAddress.cityDistrict}
                  onChange={(e) => handleInputChange('correspondenceAddress', 'cityDistrict', e.target.value)}
                  placeholder="Enter your city/district"
                />
              </div>

              {/* Post Office */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Post Office <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Post Office"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.correspondenceAddress.postOffice}
                  onChange={(e) => handleInputChange('correspondenceAddress', 'postOffice', e.target.value)}
                />
              </div>

              {/* Pincode/Postal Code */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pincode/Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Pincode/Postal Code"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.correspondenceAddress.pincode}
                  onChange={(e) => handleInputChange('correspondenceAddress', 'pincode', e.target.value)}
                />
              </div>

              {/* Police Station */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Police Station <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Police Station"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.correspondenceAddress.policeStation}
                  onChange={(e) => handleInputChange('correspondenceAddress', 'policeStation', e.target.value)}
                />
              </div>

              {/* Nearest Railway Station */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nearest Railway Station <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nearest Railway Station"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.correspondenceAddress.nearestRailwayStation}
                  onChange={(e) => handleInputChange('correspondenceAddress', 'nearestRailwayStation', e.target.value)}
                />
              </div>
            </div>

            {/* Same as Permanent Address Question */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-4">
                Is Permanent Address Same as Correspondence address? <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sameAsPermanent"
                    value="yes"
                    className="mr-2"
                    checked={formData.permanentAddress.sameAsCorrespondence === true}
                    onChange={(e) => handleInputChange('permanentAddress', 'sameAsCorrespondence', true)}
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sameAsPermanent"
                    value="no"
                    className="mr-2"
                    checked={formData.permanentAddress.sameAsCorrespondence === false}
                    onChange={(e) => handleInputChange('permanentAddress', 'sameAsCorrespondence', false)}
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Permanent Address Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        {/* Permanent Address Header */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('permanentAddress')}>
          <h3 className="font-semibold text-gray-800">Permanent Address</h3>
          {sections.permanentAddress ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {/* Permanent Address Form */}
        {sections.permanentAddress && (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Address Line 1"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.permanentAddress.addressLine1}
                  onChange={(e) => handleInputChange('permanentAddress', 'addressLine1', e.target.value)}
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  placeholder="Address Line 2"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.permanentAddress.addressLine2}
                  onChange={(e) => handleInputChange('permanentAddress', 'addressLine2', e.target.value)}
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.permanentAddress.country}
                  onChange={(e) => handleInputChange('permanentAddress', 'country', e.target.value)}>
                  <option value="">Select Country</option>
                  <option value="India">India</option>
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <select className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.permanentAddress.state}
                  onChange={(e) => handleInputChange('permanentAddress', 'state', e.target.value)}>
                  <option value="">Select State</option>
                  {Object.keys(statesAndCities).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* City/District */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  City/District <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.permanentAddress.cityDistrict}
                  onChange={(e) => handleInputChange('permanentAddress', 'cityDistrict', e.target.value)}
                  placeholder="Enter your city/district"
                />
              </div>

              {/* Post Office */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Post Office <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Post Office"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.permanentAddress.postOffice}
                  onChange={(e) => handleInputChange('permanentAddress', 'postOffice', e.target.value)}
                />
              </div>

              {/* Pincode/Postal Code */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pincode/Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Pincode/Postal Code"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.permanentAddress.pincode}
                  onChange={(e) => handleInputChange('permanentAddress', 'pincode', e.target.value)}
                />
              </div>

              {/* Police Station */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Police Station <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Police Station"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.permanentAddress.policeStation}
                  onChange={(e) => handleInputChange('permanentAddress', 'policeStation', e.target.value)}
                />
              </div>

              {/* Nearest Railway Station */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nearest Railway Station <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nearest Railway Station"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.permanentAddress.nearestRailwayStation}
                  onChange={(e) => handleInputChange('permanentAddress', 'nearestRailwayStation', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* D.O.B Details Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        {/* D.O.B Details Header */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('dobDetails')}>
          <h3 className="font-semibold text-gray-800">D.O.B Details</h3>
          {sections.dobDetails ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {/* D.O.B Details Form */}
        {sections.dobDetails && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 items-end">
              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Date of Birth (DD/MM/YYYY)<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.dobDetails.dateOfBirth}
                    onChange={(e) => handleInputChange('dobDetails', 'dateOfBirth', e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Age Calculation */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your age calculate.
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-yellow-400 text-white text-xs rounded-full">
                    !
                  </span>
                </label>
                <div className="bg-gray-50 border border-gray-300 px-3 py-2 text-sm text-gray-700 rounded">
                  {formData.dobDetails.calculatedAge || 'Select date of birth to calculate age'}
                </div>
              </div>
            </div>

            {/* Back & Save & Next Buttons */}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={handleSaveAndNext}
                disabled={isLoading}
                className={`px-8 py-2 text-sm font-medium rounded transition-colors ${isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    SAVING...
                  </div>
                ) : (
                  'SAVE & NEXT'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const Qualification = ({ onComplete, onBack }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [sections, setSections] = useState({
    matriculation: true,
    intermediate: true,
    iti: true,
    examCityPreference: true
  })

  const [formData, setFormData] = useState({
    matriculation: {
      boardName: '',
      yearOfPassing: '',
      percentage: '',
      subjects: ''
    },
    intermediate: {
      boardName: '',
      yearOfPassing: '',
      percentage: '',
      subjects: '',
      stream: ''
    },
    iti: {
      instituteName: '',
      yearOfPassing: '',
      percentage: '',
      trade: '',
      duration: ''
    },
    examCityPreference: {
      city1: '',
      city2: '',
      city3: ''
    }
  })

  // Load existing data on component mount
  useEffect(() => {
    loadQualificationDetails()
  }, [])

  const loadQualificationDetails = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const response = await authAPI.getQualificationDetails(user.userId)

      if (response.qualificationDetails) {
        // Ensure all sections have default values
        const completeData = {
          matriculation: response.qualificationDetails.matriculation || {
            boardName: '',
            yearOfPassing: '',
            percentage: '',
            subjects: ''
          },
          intermediate: response.qualificationDetails.intermediate || {
            boardName: '',
            yearOfPassing: '',
            percentage: '',
            subjects: '',
            stream: ''
          },
          iti: response.qualificationDetails.iti || {
            instituteName: '',
            yearOfPassing: '',
            percentage: '',
            trade: '',
            duration: ''
          },
          examCityPreference: response.qualificationDetails.examCityPreference || {
            city1: '',
            city2: '',
            city3: ''
          }
        }
        setFormData(completeData)
      }
    } catch (error) {
      console.error('Error loading qualification details:', error)
    }
  }

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }



  const toggleSection = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSaveAndNext = async () => {
    setIsLoading(true)

    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const response = await authAPI.saveQualificationDetails(user.userId, formData)

      toast.success('Qualification details saved successfully!')
      onComplete() // Move to next step

    } catch (error) {
      console.error('Error saving qualification details:', error)
      toast.error('Failed to save qualification details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackClick = () => {
    onBack() // Use the onBack prop instead of setActiveStep
  }

  return (
    <div>
      {/* Matriculation (10th) Details Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('matriculation')}>
          <h3 className="font-semibold text-gray-800">Matriculation (10th) Details</h3>
          {sections.matriculation ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {sections.matriculation && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Name of the Board */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name of the Board <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full uppercase border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.matriculation.boardName}
                  onChange={(e) => handleInputChange('matriculation', 'boardName', e.target.value)}
                />
              </div>

              {/* Year of Passing */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Year of Passing <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.matriculation.yearOfPassing}
                  onChange={(e) => handleInputChange('matriculation', 'yearOfPassing', e.target.value)}
                >
                  <option value="">Select Year</option>
                  {Array.from({ length: 30 }, (_, i) => 2024 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Percentage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.matriculation.percentage}
                  onChange={(e) => handleInputChange('matriculation', 'percentage', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Intermediate (12th) Details Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('intermediate')}>
          <h3 className="font-semibold text-gray-800">Intermediate (12th) Details</h3>
          {sections.intermediate ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {sections.intermediate && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Name of the Board */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name of the Board <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full uppercase border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"

                  value={formData.intermediate.boardName}
                  onChange={(e) => handleInputChange('intermediate', 'boardName', e.target.value)}
                />
              </div>

              {/* Year of Passing */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Year of Passing <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.intermediate.yearOfPassing}
                  onChange={(e) => handleInputChange('intermediate', 'yearOfPassing', e.target.value)}
                >
                  <option value="">Select Year</option>
                  {Array.from({ length: 30 }, (_, i) => 2024 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Stream */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stream <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.intermediate.stream}
                  onChange={(e) => handleInputChange('intermediate', 'stream', e.target.value)}
                >
                  <option value="">Select Stream</option>
                  <option value="science">Science</option>
                  <option value="commerce">Commerce</option>
                  <option value="arts">Arts</option>
                </select>
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Percentage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.intermediate.percentage}
                  onChange={(e) => handleInputChange('intermediate', 'percentage', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ITI Details Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('iti')}>
          <h3 className="font-semibold text-gray-800">ITI Details</h3>
          {sections.iti ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {sections.iti && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Institute Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Institute Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.iti.instituteName}
                  onChange={(e) => handleInputChange('iti', 'instituteName', e.target.value)}
                />
              </div>

              {/* Year of Passing */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Year of Passing <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.iti.yearOfPassing}
                  onChange={(e) => handleInputChange('iti', 'yearOfPassing', e.target.value)}
                >
                  <option value="">Select Year</option>
                  {Array.from({ length: 30 }, (_, i) => 2024 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Trade */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Trade <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.iti.trade}
                  onChange={(e) => handleInputChange('iti', 'trade', e.target.value)}
                >
                  <option value="">Select Trade</option>
                  <option value="electrician">Electrician</option>
                  <option value="fitter">Fitter</option>
                  <option value="welder">Welder</option>
                  <option value="mechanic">Mechanic</option>
                  <option value="plumber">Plumber</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.iti.duration}
                  onChange={(e) => handleInputChange('iti', 'duration', e.target.value)}
                >
                  <option value="">Select Duration</option>
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                </select>
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Percentage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.iti.percentage}
                  onChange={(e) => handleInputChange('iti', 'percentage', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exam City Choice Preference Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('examCityPreference')}>
          <h3 className="font-semibold text-gray-800">Exam City Choice Preference</h3>
          {sections.examCityPreference ?
            <AiOutlineMinus className="text-red-600" /> :
            <AiOutlinePlus className="text-red-600" />
          }
        </div>

        {sections.examCityPreference && (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* City 1 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  City 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full uppercase border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.examCityPreference.city1}
                  onChange={(e) => handleInputChange('examCityPreference', 'city1', e.target.value)}
                  placeholder="Enter your first preference city for exam"
                />
              </div>

              {/* City 2 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  City 2 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full uppercase border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.examCityPreference.city2}
                  onChange={(e) => handleInputChange('examCityPreference', 'city2', e.target.value)}
                  placeholder="Enter your second preference city for exam"
                />
              </div>

              {/* City 3 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  City 3 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full uppercase border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={formData.examCityPreference.city3}
                  onChange={(e) => handleInputChange('examCityPreference', 'city3', e.target.value)}
                  placeholder="Enter your third preference city for exam"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back & Save & Next Buttons */}
      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={handleBackClick}
          className="px-8 py-2 text-sm font-medium rounded transition-colors bg-gray-500 hover:bg-gray-600 text-white"
        >
          BACK
        </button>
        <button
          onClick={handleSaveAndNext}
          disabled={isLoading}
          className={`px-8 py-2 text-sm font-medium rounded transition-colors ${isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700'
            } text-white`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              SAVING...
            </div>
          ) : (
            'SAVE & NEXT'
          )}
        </button>
      </div>
    </div>
  )
}

const DocumentUploading = ({ onComplete, onBack }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [sections, setSections] = useState({
    documentsUpload: true
  })
  const [uploadedFiles, setUploadedFiles] = useState({
    passportPhoto: null,
    signature: null,
    class10Marksheet: null,
    class12Marksheet: null,
    itiMarksheet: null,
    castCertificate: null
  })
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [currentUploadType, setCurrentUploadType] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)

  // Load existing documents on component mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'))
        const response = await authAPI.getDocumentDetails(user.userId)

        if (response.documentDetails) {
          // Mark files as uploaded if URLs exist
          const loadedFiles = {}
          Object.keys(uploadedFiles).forEach(docType => {
            if (response.documentDetails[docType]) {
              loadedFiles[docType] = { uploaded: true, url: response.documentDetails[docType] }
            }
          })
          setUploadedFiles(prev => ({ ...prev, ...loadedFiles }))
        }
      } catch (error) {
        console.error('Error loading documents:', error)
      }
    }

    loadDocuments()
  }, [])

  const handleBackClick = () => {
    onBack()
  }

  const handleSaveAndNext = async () => {
    // Validate mandatory documents
    const mandatoryDocs = ['passportPhoto', 'signature', 'class10Marksheet']
    const missingDocs = []

    mandatoryDocs.forEach(doc => {
      if (!uploadedFiles[doc] || (!uploadedFiles[doc].uploaded && !uploadedFiles[doc].name)) {
        const docNames = {
          passportPhoto: 'Passport Photo',
          signature: 'Signature',
          class10Marksheet: 'Class 10th Marksheet'
        }
        missingDocs.push(docNames[doc])
      }
    })

    if (missingDocs.length > 0) {
      toast.error(`Please upload mandatory documents: ${missingDocs.join(', ')}`)
      return
    }

    setIsLoading(true)

    try {
      const user = JSON.parse(localStorage.getItem('user'))

      // Convert files to base64 for backend - ONLY NEW FILES
      const documentData = {}

      for (const [docType, file] of Object.entries(uploadedFiles)) {
        // Only send files that are NOT already uploaded to Cloudinary
        if (file && !file.uploaded && file.name) {
          const reader = new FileReader()
          const base64Data = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result.split(',')[1])
            reader.readAsDataURL(file)
          })

          documentData[docType] = {
            data: base64Data,
            name: file.name,
            type: file.type
          }
        }
      }

      // Only call API if there are new files to upload
      if (Object.keys(documentData).length > 0) {
        const response = await authAPI.saveDocumentDetails(user.userId, documentData)
        toast.success('New documents uploaded successfully!')
      } else {
        toast.success('All documents are already uploaded!')
      }

      onComplete()
    } catch (error) {
      console.error('Error uploading documents:', error)
      toast.error('Failed to upload documents')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleFileUpload = (documentType) => {
    
    setCurrentUploadType(documentType)
    setShowUploadModal(true)
    setPreviewFile(null)
    setUploadProgress(0)
  }

  const handleFileSelect = async (file) => {
    if (!file) return

    // Validate file size for photo/signature
    if (currentUploadType === 'passportPhoto' || currentUploadType === 'signature') {
      if (file.size < 50 * 1024 || file.size > 200 * 1024) {
        toast.error('File size should be between 50kb and 200kb')
        return
      }
    }

    // General file size limit (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size should not exceed 2MB')
      return
    }

    // Validate file format
    if (!file.type.includes('image/') && !file.type.includes('pdf')) {
      toast.error('Please upload only image files (.jpg, .jpeg, .png) or PDF')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Compress image if it's too large
    let processedFile = file
    if (file.type.includes('image/') && file.size > 500 * 1024) {
      processedFile = await compressImage(file)
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewFile({
        name: processedFile.name,
        size: processedFile.size,
        type: processedFile.type,
        url: e.target.result
      })
    }
    reader.readAsDataURL(processedFile)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          setUploadedFiles(prevFiles => ({
            ...prevFiles,
            [currentUploadType]: processedFile
          }))
          toast.success('File uploaded successfully!')
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  // Image compression function
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 800
        const maxHeight = 600
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(resolve, 'image/jpeg', 0.7)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const UploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[600px] max-w-2xl">
        {/* Header */}
        <div className="bg-red-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
          <h3 className="font-semibold">Document / Image Upload</h3>
          <button
            onClick={() => setShowUploadModal(false)}
            className="text-white hover:text-gray-200 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Type Button */}
          <div className="mb-6">
            <button className="border border-red-600 text-red-600 px-4 py-2 text-sm rounded font-medium">
              {getModalTitle()}
            </button>
          </div>

          {/* Upload Area */}
          {!previewFile && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) handleFileSelect(file)
                }}
                className="hidden"
                id="fileInput"
              />
              <div className="text-gray-600">
                <div className="text-lg mb-2">📁</div>
                <p className="font-medium">Drop files here / Browse to upload</p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="mb-6">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">Uploading... {uploadProgress}%</p>
            </div>
          )}

          {/* File Preview */}
          {previewFile && (
            <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Uploaded File:</h4>
                <button
                  onClick={handleDeleteFile}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded transition-colors"
                >
                  Delete
                </button>
              </div>

              {previewFile.type.includes('image') ? (
                <img
                  src={previewFile.url}
                  alt="Preview"
                  className="w-full h-40 object-contain border rounded mb-3 bg-white"
                />
              ) : (
                <div className="w-full h-40 bg-white border rounded mb-3 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <div className="text-4xl mb-2">📄</div>
                    <span>PDF Document</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-600 bg-white p-2 rounded">
                <p><strong>Name:</strong> {previewFile.name}</p>
                <p><strong>Size:</strong> {(previewFile.size / 1024).toFixed(2)} KB</p>
                <p><strong>Type:</strong> {previewFile.type}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-700 mb-6 bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold mb-2">
              Instructions to upload {currentUploadType === 'passportPhoto' ? 'photograph' :
                currentUploadType === 'signature' ? 'signature' : 'document'}:
            </p>
            <ol className="list-decimal list-inside space-y-1">
              {getInstructions().map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          {/* Close Button */}
          <div className="text-center">
            <button
              onClick={() => setShowUploadModal(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const getModalTitle = () => {
    switch (currentUploadType) {
      case 'passportPhoto':
        return 'Passport Photo'
      case 'signature':
        return 'Signature'
      case 'dateOfBirth':
        return 'Class 10th Marksheet'
      case 'employmentExchange':
        return 'Cast Certificate'
      default:
        return 'Document'
    }
  }

  const getInstructions = () => {
    switch (currentUploadType) {
      case 'passportPhoto':
        return [
          'The photograph should be recent and clear.',
          'The background should be plain white.',
          'The face should be clearly visible without any obstruction.',
          'The photograph should be in JPEG or PNG format.',
          'The file size should be between 50kb and 200kb.'
        ]
      case 'signature':
        return [
          'The signature should be clear and legible.',
          'The signature should be in JPEG or PNG format.',
          'The file size should be between 50kb and 200kb.'
        ]
      case 'dateOfBirth':
        return [
          'Upload the scanned copy of your Class 10th marksheet.',
          'The document should be clear and legible.',
          'The file should be in JPEG, PNG, or PDF format.',
          'The file size should not exceed 2MB.'
        ]
      case 'employmentExchange':
        return [
          'Upload the scanned copy of your Cast Certificate.',
          'The document should be clear and legible.',
          'The file should be in JPEG, PNG, or PDF format.',
          'The file size should not exceed 2MB.'
        ]
      default:
        return [
          'Upload the required document.',
          'The document should be clear and legible.',
          'The file should be in JPEG, PNG, or PDF format.',
          'The file size should not exceed 2MB.'
        ]
    }
  }

  const handleDeleteFile = () => {
    setPreviewFile(null)
    setUploadedFiles(prevFiles => ({
      ...prevFiles,
      [currentUploadType]: null
    }))
    toast.success('File deleted successfully!')
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all documents?')) {
      return
    }

    setIsLoading(true)

    try {
      const user = JSON.parse(localStorage.getItem('user'))
      await authAPI.deleteAllDocuments(user.userId)

      // Reset all uploaded files
      setUploadedFiles({
        passportPhoto: null,
        signature: null,
        class10Marksheet: null,
        class12Marksheet: null,
        itiMarksheet: null,
        castCertificate: null
      })

      toast.success('All documents deleted successfully!')
    } catch (error) {
      console.error('Error deleting documents:', error)
      toast.error('Failed to delete documents')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Documents Upload Section */}
      <div className="bg-white border border-gray-300 rounded mb-4">
        {/* Header */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('documentsUpload')}>
          <h3 className="font-semibold text-gray-800">Documents Upload</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Collapse</span>
            {sections.documentsUpload ?
              <AiOutlineMinus className="text-red-600" /> :
              <AiOutlinePlus className="text-red-600" />
            }
          </div>
        </div>

        {/* Documents Upload Form */}
        {sections.documentsUpload && (
          <div className="p-6 space-y-4">
            {/* Passport Photo Upload */}
            <div className="py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Upload the scanned copy of your recent passport size photo:
                  </span>
                  <span className="text-red-500">*</span>
                </div>
                <button
                  onClick={() => handleFileUpload('passportPhoto')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium rounded transition-colors"
                >
                  CLICK HERE TO UPLOAD
                </button>
              </div>
              {(uploadedFiles.passportPhoto && (uploadedFiles.passportPhoto.uploaded || uploadedFiles.passportPhoto.name)) && (
                <div className="mt-2">
                  <span className="text-green-600 text-sm font-medium">✓ Successfully Uploaded</span>
                </div>
              )}
            </div>

            {/* Signature Upload */}
            <div className="py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Upload the scanned copy of your signature:
                  </span>
                  <span className="text-red-500">*</span>
                </div>
                <button
                  onClick={() => handleFileUpload('signature')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium rounded transition-colors"
                >
                  CLICK HERE TO UPLOAD
                </button>
              </div>
              {(uploadedFiles.signature && (uploadedFiles.signature.uploaded || uploadedFiles.signature.name)) && (
                <div className="mt-2">
                  <span className="text-green-600 text-sm font-medium">✓ Successfully Uploaded</span>
                </div>
              )}
            </div>

            {/* Class 10th Marksheet Upload */}
            <div className="py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Upload the scanned copy of your Class 10th Marksheet:
                  </span>
                  <span className="text-red-500">*</span>
                </div>
                <button
                  onClick={() => handleFileUpload('class10Marksheet')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium rounded transition-colors"
                >
                  CLICK HERE TO UPLOAD
                </button>
              </div>
              {uploadedFiles.class10Marksheet && (
                <div className="mt-2">
                  <span className="text-green-600 text-sm font-medium">✓ Successfully Uploaded</span>
                </div>
              )}
            </div>

            {/* Class 12th Marksheet Upload */}
            <div className="py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Upload the scanned copy of your Class 12th Marksheet:
                  </span>
                  <span className="text-red-500">*</span>
                </div>
                <button
                  onClick={() => handleFileUpload('class12Marksheet')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium rounded transition-colors"
                >
                  CLICK HERE TO UPLOAD
                </button>
              </div>
              {uploadedFiles.class12Marksheet && (
                <div className="mt-2">
                  <span className="text-green-600 text-sm font-medium">✓ Successfully Uploaded</span>
                </div>
              )}
            </div>

            {/* ITI Marksheet Upload */}
            <div className="py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Upload the scanned copy of your ITI Marksheet:
                  </span>
                  <span className="text-red-500">*</span>
                </div>
                <button
                  onClick={() => handleFileUpload('itiMarksheet')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium rounded transition-colors"
                >
                  CLICK HERE TO UPLOAD
                </button>
              </div>
              {uploadedFiles.itiMarksheet && (
                <div className="mt-2">
                  <span className="text-green-600 text-sm font-medium">✓ Successfully Uploaded</span>
                </div>
              )}
            </div>

            {/* Cast Certificate Upload */}
            <div className="py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Upload the scanned copy of your Cast Certificate:
                  </span>
                  <span className="text-red-500">*</span>
                </div>
                <button
                  onClick={() => handleFileUpload('castCertificate')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium rounded transition-colors"
                >
                  CLICK HERE TO UPLOAD
                </button>
              </div>
              {uploadedFiles.castCertificate && (
                <div className="mt-2">
                  <span className="text-green-600 text-sm font-medium">✓ Successfully Uploaded</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-w-2xl">
            {/* Header */}
            <div className="bg-red-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
              <h3 className="font-semibold">Document / Image Upload</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-white hover:text-gray-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Upload Type Button */}
              <div className="mb-6">
                <button className="border border-red-600 text-red-600 px-4 py-2 text-sm rounded font-medium">
                  {getModalTitle()}
                </button>
              </div>

              {/* Upload Area - Show only if no file uploaded */}
              {!previewFile && !isUploading && (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) handleFileSelect(file)
                    }}
                    className="hidden"
                    id="fileInput"
                  />
                  <div className="text-gray-600">
                    <div className="text-lg mb-2">📁</div>
                    <p className="font-medium">Drop files here / Browse to upload</p>
                  </div>
                </div>
              )}

              {/* Progress Bar - Show during upload */}
              {isUploading && (
                <div className="mb-6 p-6 border border-gray-300 rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-sm mb-4 text-center">Uploading File...</h4>
                  <div className="bg-gray-200 rounded-full h-4 mb-3">
                    <div
                      className="bg-green-600 h-4 rounded-full transition-all duration-300 flex items-center justify-center"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <span className="text-white text-xs font-medium">{uploadProgress}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">Please wait while your file is being uploaded...</p>
                </div>
              )}

              {/* File Preview - Show after upload */}
              {previewFile && !isUploading && (
                <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-green-600">✓ File Uploaded Successfully!</h4>
                    <button
                      onClick={handleDeleteFile}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                  {previewFile.type.includes('image') ? (
                    <img
                      src={previewFile.url}
                      alt="Preview"
                      className="w-full h-48 object-contain border rounded mb-3 bg-white"
                    />
                  ) : (
                    <div className="w-full h-48 bg-white border rounded mb-3 flex items-center justify-center">
                      <div className="text-center text-gray-600">
                        <div className="text-5xl mb-2">📄</div>
                        <span className="font-medium">PDF Document</span>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-600 bg-white p-3 rounded mb-4">
                    <p><strong>File Name:</strong> {previewFile.name}</p>
                    <p><strong>File Size:</strong> {(previewFile.size / 1024).toFixed(2)} KB</p>
                    <p><strong>File Type:</strong> {previewFile.type}</p>
                  </div>

                  {/* Close Button after upload */}
                  <div className="text-center">
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Close & Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Instructions - Show only when no file uploaded */}
              {!previewFile && (
                <div className="text-sm text-gray-700 mb-6 bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">
                    Instructions to upload {currentUploadType === 'passportPhoto' ? 'photograph' :
                      currentUploadType === 'signature' ? 'signature' : 'document'}:
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    {getInstructions().map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Close Button - Show only when no file uploaded */}
              {!previewFile && !isUploading && (
                <div className="text-center">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={handleBackClick}
          className="px-8 py-2 text-sm font-medium rounded transition-colors bg-gray-500 hover:bg-gray-600 text-white"
        >
          BACK
        </button>
        <button
          onClick={handleSaveAndNext}
          disabled={isLoading}
          className={`px-8 py-2 text-sm font-medium rounded transition-colors ${isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700'
            } text-white`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              UPLOADING...
            </div>
          ) : (
            'SAVE & NEXT'
          )}
        </button>
        <button
          onClick={handleDeleteAll}
          disabled={isLoading}
          className="px-8 py-2 text-sm font-medium rounded transition-colors bg-orange-600 hover:bg-orange-700 text-white"
        >
          DELETE ALL
        </button>
      </div>
    </div>
  )
}

// const Payment = ({ onComplete, onBack }) => {
//   const [paymentData, setPaymentData] = useState({
//     utrNumber: '',
//     paymentMethod: 'online' // online, card, netbanking
//   })
//   const [paymentStatus, setPaymentStatus] = useState(null)
//   const [isLoading, setIsLoading] = useState(false)
//   const [showTracking, setShowTracking] = useState(false)

//   useEffect(() => {
//     loadPaymentDetails()
//   }, [])

//   const loadPaymentDetails = async () => {
//     try {
//       const user = JSON.parse(localStorage.getItem('user'))
//       const response = await authAPI.getPaymentDetails(user.userId)

//       if (response.paymentDetails.utrNumber) {
//         setPaymentData({ utrNumber: response.paymentDetails.utrNumber })
//         setPaymentStatus(response.paymentDetails.paymentStatus)
//         setShowTracking(true)
//       }
//     } catch (error) {
//       console.error('Error loading payment details:', error)
//     }
//   }

//   const handleSubmitPayment = async (e) => {
//     e.preventDefault()

//     if (!paymentData.utrNumber.trim()) {
//       toast.error('Please enter UTR number')
//       return
//     }

//     setIsLoading(true)

//     try {
//       const user = JSON.parse(localStorage.getItem('user'))
//       await authAPI.savePaymentDetails(user.userId, paymentData)

//       setPaymentStatus('processing')
//       setShowTracking(true)
//       toast.success('Payment details submitted successfully!')
//     } catch (error) {
//       console.error('Error submitting payment:', error)
//       toast.error('Failed to submit payment details')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const getProgressPercentage = () => {
//     switch (paymentStatus) {
//       case 'processing': return 66
//       case 'verified': return 100
//       case 'cancelled': return 0
//       default: return 33
//     }
//   }

//   const getStatusText = () => {
//     switch (paymentStatus) {
//       case 'processing': return 'Payment Under Verification'
//       case 'verified': return 'Payment Verified Successfully'
//       case 'cancelled': return 'Payment Rejected'
//       default: return 'UTR Number Submitted'
//     }
//   }

//   const handleRetryPayment = () => {
//     setShowTracking(false)
//     setPaymentData({ utrNumber: '' })
//     setPaymentStatus(null)
//   }

//   if (showTracking) {
//     return (
//       <div className="max-w-4xl mx-auto">
//         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-200">
//           <div className="text-center mb-8">
//             <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Status</h3>
//             <p className="text-gray-600">Track your registration payment status</p>
//           </div>

//           {/* Progress Tracker */}
//           <div className="mb-10">
//             <div className="flex justify-between items-center mb-4">
//               <div className="flex flex-col items-center">
//                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
//                   getProgressPercentage() >= 33 ? 'bg-green-500' : 'bg-gray-300'
//                 }`}>
//                   1
//                 </div>
//                 <span className="text-xs mt-2 font-medium">UTR Submitted</span>
//               </div>

//               <div className="flex-1 h-2 mx-4 bg-gray-200 rounded">
//                 <div 
//                   className={`h-full rounded transition-all duration-700 ${
//                     paymentStatus === 'cancelled' ? 'bg-red-500' : 'bg-green-500'
//                   }`}
//                   style={{ width: `${Math.min(getProgressPercentage(), 66)}%` }}
//                 ></div>
//               </div>

//               <div className="flex flex-col items-center">
//                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
//                   getProgressPercentage() >= 66 ? 'bg-green-500' : 'bg-gray-300'
//                 }`}>
//                   2
//                 </div>
//                 <span className="text-xs mt-2 font-medium">Under Review</span>
//               </div>

//               <div className="flex-1 h-2 mx-4 bg-gray-200 rounded">
//                 <div 
//                   className={`h-full rounded transition-all duration-700 ${
//                     paymentStatus === 'cancelled' ? 'bg-red-500' : 'bg-green-500'
//                   }`}
//                   style={{ width: `${getProgressPercentage() >= 66 ? (getProgressPercentage() - 66) * 3 : 0}%` }}
//                 ></div>
//               </div>

//               <div className="flex flex-col items-center">
//                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
//                   getProgressPercentage() === 100 ? 'bg-green-500' : paymentStatus === 'cancelled' ? 'bg-red-500' : 'bg-gray-300'
//                 }`}>
//                   {paymentStatus === 'cancelled' ? '✕' : '✓'}
//                 </div>
//                 <span className="text-xs mt-2 font-medium">
//                   {paymentStatus === 'cancelled' ? 'Rejected' : 'Verified'}
//                 </span>
//               </div>
//             </div>

//             <div className="text-center">
//               <p className={`text-lg font-semibold ${
//                 paymentStatus === 'cancelled' ? 'text-red-600' : 
//                 paymentStatus === 'verified' ? 'text-green-600' : 'text-blue-600'
//               }`}>
//                 {getStatusText()}
//               </p>
//             </div>
//           </div>

//           {/* Payment Details Card */}
//           <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
//             <h4 className="font-semibold text-gray-800 mb-4">Payment Information</h4>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-gray-600">UTR Number</p>
//                 <p className="font-mono text-lg font-semibold text-gray-800">{paymentData.utrNumber}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Status</p>
//                 <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
//                   paymentStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
//                   paymentStatus === 'verified' ? 'bg-green-100 text-green-800' :
//                   paymentStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
//                   'bg-blue-100 text-blue-800'
//                 }`}>
//                   {paymentStatus?.toUpperCase()}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex justify-center gap-4">
//             {paymentStatus === 'cancelled' && (
//               <button 
//                 onClick={handleRetryPayment}
//                 className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
//               >
//                 <span>🔄</span>
//                 RETRY PAYMENT
//               </button>
//             )}

//             {paymentStatus === 'verified' && (
//               <button 
//                 onClick={() => window.print()}
//                 className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
//               >
//                 <span>📄</span>
//                 DOWNLOAD CERTIFICATE
//               </button>
//             )}

//             {paymentStatus === 'processing' && (
//               <div className="text-center">
//                 <div className="animate-pulse text-blue-600 mb-2">⏳</div>
//                 <p className="text-gray-600">Please wait while we verify your payment...</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-4xl mx-auto">
//       {/* Payment Header */}
//       <div className="text-center mb-8">
//         <h3 className="text-3xl font-bold text-gray-800 mb-2">💳 Complete Your Payment</h3>
//         <p className="text-gray-600">Choose your preferred payment method</p>
//         <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 inline-block">
//           <p className="text-green-800 font-semibold">Registration Fee: ₹500.00</p>
//         </div>
//       </div>

//       {/* Payment Method Selection */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         {/* Online Payment */}
//         <div 
//           className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
//             paymentData.paymentMethod === 'online' 
//               ? 'border-blue-500 bg-blue-50' 
//               : 'border-gray-200 hover:border-blue-300'
//           }`}
//           onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'online' }))}
//         >
//           <div className="text-center">
//             <div className="text-4xl mb-3">📱</div>
//             <h4 className="font-semibold text-gray-800 mb-2">Online Payment</h4>
//             <p className="text-sm text-gray-600">UPI, PhonePe, GPay, Paytm</p>
//           </div>
//         </div>

//         {/* Card Payment */}
//         <div 
//           className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
//             paymentData.paymentMethod === 'card' 
//               ? 'border-blue-500 bg-blue-50' 
//               : 'border-gray-200 hover:border-blue-300'
//           }`}
//           onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'card' }))}
//         >
//           <div className="text-center">
//             <div className="text-4xl mb-3">💳</div>
//             <h4 className="font-semibold text-gray-800 mb-2">Card Payment</h4>
//             <p className="text-sm text-gray-600">Credit & Debit Cards</p>
//           </div>
//         </div>

//         {/* Net Banking */}
//         <div 
//           className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
//             paymentData.paymentMethod === 'netbanking' 
//               ? 'border-blue-500 bg-blue-50' 
//               : 'border-gray-200 hover:border-blue-300'
//           }`}
//           onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'netbanking' }))}
//         >
//           <div className="text-center">
//             <div className="text-4xl mb-3">🏦</div>
//             <h4 className="font-semibold text-gray-800 mb-2">Net Banking</h4>
//             <p className="text-sm text-gray-600">All Major Banks</p>
//           </div>
//         </div>
//       </div>

//       {/* Payment Content Based on Selection */}
//       <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
//         {paymentData.paymentMethod === 'online' && (
//           <div>
//             <div className="text-center mb-6">
//               <h4 className="text-xl font-semibold text-gray-800 mb-2">📱 Scan QR Code to Pay</h4>
//               <p className="text-gray-600">Use any UPI app to scan and pay ₹500</p>
//             </div>

//             <div className="flex flex-col md:flex-row items-center gap-8">
//               {/* QR Code */}
//               <div className="flex-1 text-center">
//                 <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 inline-block">
//                   <img 
//                     src="/qr-code.jpeg" 
//                     alt="Payment QR Code" 
//                     className="w-48 h-48 mx-auto object-contain"
//                   />
//                 </div>
//                 <p className="text-sm text-gray-500 mt-3">Scan with any UPI app</p>
//               </div>

//               {/* UPI Apps */}
//               <div className="flex-1">
//                 <h5 className="font-semibold text-gray-800 mb-4">💡 Supported Apps:</h5>
//                 <div className="grid grid-cols-2 gap-3">
//                   <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
//                     <span className="text-2xl">📱</span>
//                     <span className="font-medium">PhonePe</span>
//                   </div>
//                   <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
//                     <span className="text-2xl">🟢</span>
//                     <span className="font-medium">Google Pay</span>
//                   </div>
//                   <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
//                     <span className="text-2xl">💙</span>
//                     <span className="font-medium">Paytm</span>
//                   </div>
//                   <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
//                     <span className="text-2xl">🏦</span>
//                     <span className="font-medium">BHIM UPI</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {paymentData.paymentMethod === 'card' && (
//           <div className="text-center">
//             <div className="text-6xl mb-4">💳</div>
//             <h4 className="text-xl font-semibold text-gray-800 mb-2">Card Payment</h4>
//             <p className="text-gray-600 mb-6">Secure payment with Credit/Debit Cards</p>
//             <div className="flex justify-center gap-4 mb-6">
//               <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">💳 Visa</span>
//               <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium">💳 Mastercard</span>
//               <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg font-medium">💳 RuPay</span>
//             </div>
//             <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
//               🔒 Pay ₹500 Securely
//             </button>
//           </div>
//         )}

//         {paymentData.paymentMethod === 'netbanking' && (
//           <div className="text-center">
//             <div className="text-6xl mb-4">🏦</div>
//             <h4 className="text-xl font-semibold text-gray-800 mb-2">Net Banking</h4>
//             <p className="text-gray-600 mb-6">Pay directly from your bank account</p>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
//               {['SBI', 'HDFC', 'ICICI', 'Axis', 'PNB', 'BOI', 'Canara', 'Union'].map(bank => (
//                 <div key={bank} className="p-3 bg-gray-50 rounded-lg text-center">
//                   <span className="font-medium">{bank}</span>
//                 </div>
//               ))}
//             </div>
//             <button className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
//               🔒 Pay via Net Banking
//             </button>
//           </div>
//         )}

//         {/* UTR Input Section */}
//         <div className="mt-8 pt-8 border-t border-gray-200">
//           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
//             <h5 className="font-semibold text-yellow-800 mb-2">📝 After Payment:</h5>
//             <p className="text-sm text-yellow-700">Enter your transaction UTR number below to complete registration</p>
//           </div>

//           <form onSubmit={handleSubmitPayment}>
//             <div className="mb-6">
//               <label className="block text-sm font-semibold text-gray-700 mb-3">
//                 🔢 Enter UTR/Transaction ID <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={paymentData.utrNumber}
//                 onChange={(e) => setPaymentData(prev => ({ ...prev, utrNumber: e.target.value.toUpperCase() }))}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
//                 placeholder="Enter 12-digit UTR Number"
//                 maxLength="12"
//                 required
//               />
//               <p className="text-xs text-gray-500 mt-2">
//                 💡 UTR number is found on your payment confirmation receipt
//               </p>
//             </div>

//             <div className="flex justify-center gap-4">
//               <button 
//                 type="button"
//                 onClick={onBack}
//                 className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
//               >
//                 <span>←</span> BACK
//               </button>
//               <button 
//                 type="submit"
//                 disabled={isLoading}
//                 className={`px-8 py-3 rounded-lg font-medium text-white transition-colors flex items-center gap-2 ${
//                   isLoading 
//                     ? 'bg-gray-400 cursor-not-allowed' 
//                     : 'bg-green-600 hover:bg-green-700'
//                 }`}
//               >
//                 {isLoading ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                     PROCESSING...
//                   </>
//                 ) : (
//                   <>
//                     <span>✓</span> SUBMIT PAYMENT
//                   </>
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }

export default Dashboard

















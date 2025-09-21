import React, { useState } from 'react'
import { AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'
import pdf from '../assets/ADVERTISEMENT of IOCL.pdf'
import { IoMdDocument } from 'react-icons/io'
import { BiBadgeCheck } from "react-icons/bi";
import { FaLink } from 'react-icons/fa'
import Header from './Header'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()
  const [sections, setSections] = useState({
    important: true,
    general: true,
    keyDates: true,
    helpdesk: true
  })

  const toggleSection = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="text-white min-h-screen">
      <Header />
      {/* Header Banner */}
      <div className="bg-red-600 px-4 sm:px-6 py-2 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
        <h1 className="text-base sm:text-lg font-bold text-center sm:text-left">IOCL COMPANY APPLICATION FORM</h1>
        <div className="flex gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/register')}
            className="bg-red-700 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-semibold hover:bg-red-800"
          >
            REGISTER
          </button>
          <button
            onClick={() => navigate('/login')}
            className="bg-red-700 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-semibold hover:bg-red-800"
          >
            LOGIN
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4">
        {/* Important Information Section */}
        <div className="bg-gray-100 rounded">
          <div className="bg-gray-200 px-3 sm:px-4 py-3 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('important')}>
            <h2 className="text-red-600 font-bold text-sm sm:text-base">Important Information</h2>
            {sections.important ?
              <AiOutlineMinus className="text-red-600 text-lg sm:text-xl" /> :
              <AiOutlinePlus className="text-red-600 text-lg sm:text-xl" />
            }
          </div>
          {sections.important && (
            <div className="p-3 sm:p-4 text-gray-800">
              <p className="mb-4 text-sm sm:text-base">Read the below instructions carefully, before filling up the form:</p>
              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm leading-relaxed">
                <li>Candidate has to fill the details to receive the <strong>User ID</strong> and <strong>Password</strong>.</li>
                <li>Candidate will receive the <strong>User ID</strong> and <strong>Password</strong> on the registered email address and or on the registered mobile number.</li>
                <li>Candidate can login with the <strong>User ID</strong> and <strong>Password</strong> to complete the application form for Indian Oil Corporation Pvt Ltd.</li>
                <li>Candidate must provide <strong>Correct Name, Post Code, Mobile Number</strong> and <strong>Email Address</strong> as these details cannot be changed once the registration is completed.</li>
              </ol>
            </div>
          )}
        </div>

        {/* General Links Section */}
        <div className="bg-gray-100 rounded">
          <div className="bg-gray-200 px-3 sm:px-4 py-3 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('general')}>
            <h2 className="text-black font-bold text-sm sm:text-base">GENERAL LINKS</h2>
            {sections.general ?
              <AiOutlineMinus className="text-black text-lg sm:text-xl" /> :
              <AiOutlinePlus className="text-black text-lg sm:text-xl" />
            }
          </div>
          {sections.general && (
            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b gap-2 sm:gap-0">
                <div className="flex items-center gap-2">
                  <IoMdDocument className="text-gray-600 text-lg sm:text-base" />
                  <span className="text-gray-700 text-xs sm:text-sm">To read Advertisement</span>
                </div>
                <a
                  href={pdf} className="text-red-600 hover:underline flex items-center gap-1 text-xs sm:text-sm"
                  target="_blank">
                  <IoMdDocument />
                  Click here
                </a>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b gap-2 sm:gap-0">
                <div className="flex items-center gap-2">
                  <IoMdDocument className="text-gray-600 text-lg sm:text-base" />
                  <span className="text-gray-700 text-xs sm:text-sm">Download certificate of Medical Fitness for the Post Code JTF12025</span>
                </div>
                <a href={pdf} target="_blank" className="text-red-600 hover:underline flex items-center gap-1 text-xs sm:text-sm">
                  <IoMdDocument />
                  Click here
                </a>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b gap-2 sm:gap-0">
                <div className="flex items-center gap-2">
                  <IoMdDocument className="text-gray-600 text-lg sm:text-base" />
                  <span className="text-gray-700 text-xs sm:text-sm">Manual of online Application Form</span>
                </div>
                <a href="#" className="text-red-600 hover:underline flex items-center gap-1 text-xs sm:text-sm">
                  <IoMdDocument />
                  Click here
                </a>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b gap-2 sm:gap-0">
                <div className="flex items-center gap-2">
                  <BiBadgeCheck className="text-gray-600 text-lg sm:text-base" />
                  <span className="text-gray-700 text-xs sm:text-sm">Already Registered? To Login</span>
                </div>
                <a href="#" className="text-blue-600 hover:underline flex items-center gap-1 text-xs sm:text-sm"
                  onClick={() => navigate('/login')}>
                  <FaLink />
                  Click here
                </a>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-2 sm:gap-0">
                <div className="flex items-center gap-2">
                  <BiBadgeCheck className="text-gray-600 text-lg sm:text-base" />
                  <span className="text-gray-700 text-xs sm:text-sm">To Register</span>
                </div>
                <a href="#" className="text-blue-600 hover:underline flex items-center gap-1 text-xs sm:text-sm"
                  onClick={() => navigate('/register')}>
                  <FaLink />
                  Click here
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Key Dates Section */}
        <div className="bg-gray-100 rounded">
          <div className="bg-gray-200 px-3 sm:px-4 py-3 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('keyDates')}>
            <h2 className="text-black font-bold text-sm sm:text-base">KEY DATES</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm"></span>
              {sections.keyDates ?
                <AiOutlineMinus className="text-black text-lg sm:text-xl" /> :
                <AiOutlinePlus className="text-black text-lg sm:text-xl" />
              }
            </div>
          </div>
          {sections.keyDates && (
            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1 sm:gap-0">
                <span className="text-gray-700 text-xs sm:text-sm">📅 Starting date for application</span>
                <span className="text-red-600 font-semibold text-xs sm:text-sm">25-09-2025 (02:00PM)</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1 sm:gap-0">
                <span className="text-gray-700 text-xs sm:text-sm">📅 Last date for online submission</span>
                <span className="text-red-600 font-semibold text-xs sm:text-sm">15-10-2025 (11:59 PM)</span>
              </div>
            </div>
          )}
        </div>

        {/* Helpdesk Section */}
        <div className="bg-gray-100 rounded">
          <div className="bg-gray-200 px-3 sm:px-4 py-3 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('helpdesk')}>
            <h2 className="text-black font-bold text-sm sm:text-base">HELPDESK</h2>
            {sections.helpdesk ?
              <AiOutlineMinus className="text-black text-lg sm:text-xl" /> :
              <AiOutlinePlus className="text-black text-lg sm:text-xl" />
            }
          </div>
          {sections.helpdesk && (
            <div className="p-3 sm:p-4 space-y-3 text-gray-700">
              <p className="text-xs sm:text-sm">📞 Helpdesk - Please feel free to contact through Helpdesk tab integrated in the Application portal .</p>
              <p className="text-xs sm:text-sm">📞 Helpline No 082-94980489</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home




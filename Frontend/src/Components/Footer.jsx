import React from 'react'

const Footer = () => {
  return (
    <div className="bg-red-600 text-white">
      {/* Scrolling Text */}
      <div className="bg-red-600 py-2 overflow-hidden">
        <div className="animate-scroll whitespace-nowrap">
          <span className="text-sm font-semibold">
            Application will remain live from 18-07-2025 (02:00PM) to 18-08-2025(11:59PM).
          </span>
        </div>
      </div>
      
      {/* Center Text */}
      <div className="bg-red-600 py-2 text-center">
        <span className="text-sm">Version 15.02.01</span>
      </div>
    </div>
  )
}

export default Footer
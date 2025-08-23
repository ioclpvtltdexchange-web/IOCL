import React from 'react'
import logo from '../assets/IOCL logo.png'

const Header = () => {
  return (
    <div className="bg-white py-4 px-6 shadow-sm">
      <div className="flex justify-center">
        <img 
          src={logo}
          alt="IOCL India Limited" 
          className="h-20 w-auto"
        />
      </div>
    </div>
  )
}

export default Header

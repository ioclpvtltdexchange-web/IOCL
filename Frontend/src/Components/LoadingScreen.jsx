import React, { useState, useEffect } from 'react'
import logo from '../assets/IOCL logo.png'

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => onComplete(), 500)
          return 100
        }
        return prev + 2
      })
    }, 50)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="mb-4">
          <img 
            src={logo}
            alt="Oil India Limited" 
            className="h-16 w-auto mx-auto mb-4"
          />
        </div>
        
        <div className="w-80 bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className="bg-blue-500 h-4 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-gray-700 font-medium">
          Loading... Please wait...! {progress}%
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen
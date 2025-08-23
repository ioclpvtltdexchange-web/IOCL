const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  postCode: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true
  },
  alternateMobileNumber: {
    type: String
  },
  emailAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },

  // ==================== CANDIDATE DETAILS DATA START ====================

  // Personal Details
  personalDetails: {
    fatherName: String,
    motherName: String,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed']
    },
    nationality: String,
    religion: String,
    category: {
      type: String,
      enum: ['general', 'obc', 'sc', 'st', 'ews']
    }
  },

  // Benchmark Disability Details
  benchmarkDisability: {
    isDisabled: {
      type: Boolean,
      default: false
    },
    disabilityType: String,
    disabilityPercentage: Number,
    certificateNumber: String
  },

  // Ex-Servicemen Details
  exServicemen: {
    isExServicemen: {
      type: Boolean,
      default: false
    },
    serviceNumber: String,
    rank: String,
    unit: String,
    serviceFrom: Date,
    serviceTo: Date,
    dischargeType: String
  },

  // Employee Details
  employeeDetails: {
    employeeId: String,
    department: String,
    designation: String,
    joiningDate: Date,
    currentSalary: Number,
    workLocation: String
  },

  // WCL Details
  wclDetails: {
    wclEmployeeId: String,
    wclDepartment: String,
    wclDesignation: String,
    wclJoiningDate: Date,
    wclWorkLocation: String
  },

  // Correspondence Address
  correspondenceAddress: {
    addressLine1: {
      type: String,
      required: false
    },
    addressLine2: String,
    country: {
      type: String,
      default: 'India',
      required: false
    },
    state: {
      type: String,
      required: false
    },
    cityDistrict: {
      type: String,
      required: false
    },
    postOffice: {
      type: String,
      required: false
    },
    pincode: {
      type: String,
      required: false
    },
    policeStation: {
      type: String,
      required: false
    },
    nearestRailwayStation: {
      type: String,
      required: false
    }
  },

  // Permanent Address
  permanentAddress: {
    sameAsCorrespondence: {
      type: Boolean,
      default: false
    },
    addressLine1: String,
    addressLine2: String,
    country: String,
    state: String,
    cityDistrict: String,
    postOffice: String,
    pincode: String,
    policeStation: String,
    nearestRailwayStation: String
  },

  // D.O.B Details
  dobDetails: {
    dateOfBirth: {
      type: Date,
      required: false
    },
    calculatedAge: Number
  },

  // Form Completion Status
  candidateDetailsStatus: {
    personalDetailsCompleted: {
      type: Boolean,
      default: false
    },
    benchmarkDisabilityCompleted: {
      type: Boolean,
      default: false
    },
    exServicemenCompleted: {
      type: Boolean,
      default: false
    },
    employeeDetailsCompleted: {
      type: Boolean,
      default: false
    },
    wclDetailsCompleted: {
      type: Boolean,
      default: false
    },
    correspondenceAddressCompleted: {
      type: Boolean,
      default: false
    },
    permanentAddressCompleted: {
      type: Boolean,
      default: false
    },
    dobDetailsCompleted: {
      type: Boolean,
      default: false
    },
    allSectionsCompleted: {
      type: Boolean,
      default: false
    }
  },

  // ==================== CANDIDATE DETAILS DATA END ====================

  // ==================== QUALIFICATION DETAILS DATA START ====================

  qualificationDetails: {
    // Matriculation (10th) Details
    matriculation: {
      boardName: String,
      yearOfPassing: String,
      percentage: String,
      subjects: String
    },

    // Intermediate (12th) Details
    intermediate: {
      boardName: String,
      yearOfPassing: String,
      percentage: String,
      subjects: String,
      stream: String
    },

    // ITI Details
    iti: {
      instituteName: String,
      yearOfPassing: String,
      percentage: String,
      trade: String,
      duration: String
    },

    // Exam City Choice Preference
    examCityPreference: {
      city1: String,
      city2: String,
      city3: String
    }
  },

  // Qualification Form Completion Status
  qualificationDetailsStatus: {
    matriculationCompleted: {
      type: Boolean,
      default: false
    },
    intermediateCompleted: {
      type: Boolean,
      default: false
    },
    itiCompleted: {
      type: Boolean,
      default: false
    },
    examCityPreferenceCompleted: {
      type: Boolean,
      default: false
    },
    allQualificationSectionsCompleted: {
      type: Boolean,
      default: false
    }
  },

  // ==================== QUALIFICATION DETAILS DATA END ====================

  // ==================== DOCUMENT DETAILS DATA START ====================

  documentDetails: {
    passportPhoto: {
      type: String, // Cloudinary URL
      default: null
    },
    signature: {
      type: String, // Cloudinary URL
      default: null
    },
    class10Marksheet: {
      type: String, // Cloudinary URL
      default: null
    },
    class12Marksheet: {
      type: String, // Cloudinary URL
      default: null
    },
    itiMarksheet: {
      type: String, // Cloudinary URL
      default: null
    },
    castCertificate: {
      type: String, // Cloudinary URL
      default: null
    }
  },

  // Document Form Completion Status
  documentDetailsStatus: {
    documentsUploaded: {
      type: Boolean,
      default: false
    }
  },

  // ==================== DOCUMENT DETAILS DATA END ====================

  // ==================== PAYMENT DETAILS DATA START ====================

  paymentDetails: {
    utrNumber: {
      type: String,
      default: null
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'verified', 'cancelled'],
      default: 'pending'
    },
    paymentDate: {
      type: Date,
      default: null
    },
    adminVerifiedAt: {
      type: Date,
      default: null
    },
    adminRemarks: {
      type: String,
      default: null
    }
  },

  // Payment Form Completion Status
  paymentDetailsStatus: {
    paymentCompleted: {
      type: Boolean,
      default: false
    }
  }

  // ==================== PAYMENT DETAILS DATA END ====================

}, {
  timestamps: true
})

// Password hash karne ke liye
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Password compare karne ke liye
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// User ID generate karne ke liye
userSchema.statics.generateUserId = async function () {
  let userId
  let userExists = true

  while (userExists) {
    userId = 'IOCL' + Math.floor(100000 + Math.random() * 900000)
    userExists = await this.findOne({ userId })
  }

  return userId
}

module.exports = mongoose.model('User', userSchema)










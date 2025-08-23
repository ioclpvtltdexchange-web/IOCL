const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
  try {
    // Create transporter for Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Email options
    const mailOptions = {
      from: `"IOCL" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    }

    // Send email
    await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully to:', options.email)
    
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    throw new Error('Email could not be sent')
  }
}

module.exports = sendEmail



import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import emailService from './services/emailService.js'

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to DB')
  
  try {
    const res = await emailService.sendOTPEmail('test@example.com', '123456', 'signup')
    console.log('Result:', res)
  } catch (err) {
    console.error('Final error:', err)
  }
  process.exit(0)
}
run()

import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import EmailTemplate from './models/EmailTemplate.js'

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to DB')
  
  const template = await EmailTemplate.findOne({ slug: 'otp-signup' })
  if (!template) {
    console.log('NOT FOUND')
  } else {
    console.log('Template HTML length:', template.htmlContent.length)
    console.log('Is HTML premium format?', template.htmlContent.includes('background:#f97316'))
  }
  process.exit(0)
}
run()

// Script to update passwords for existing users from SQL file
// Run on VPS: node scripts/updatePasswords.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function updatePasswords() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcf'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB:', mongoUri)

    // Read SQL file
    const sqlPath = path.join(__dirname, '../../hcfinvest_live.sql')
    if (!fs.existsSync(sqlPath)) {
      console.error('SQL file not found:', sqlPath)
      process.exit(1)
    }

    console.log('Reading SQL file...')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Find user data using regex
    const userRegex = /\((\d+),\s*'([^']*)',\s*'(\d+)',\s*'([^']+@[^']+)',\s*(?:'[^']*'|NULL),\s*'(\$2[yab]\$[^']+)'/g
    
    const users = []
    let match
    while ((match = userRegex.exec(sqlContent)) !== null) {
      users.push({
        email: match[4].toLowerCase(),
        password: match[5]
      })
    }

    console.log(`Found ${users.length} users in SQL file`)

    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    let updated = 0
    let notFound = 0

    for (const userData of users) {
      try {
        const result = await usersCollection.updateOne(
          { email: userData.email },
          { $set: { password: userData.password } }
        )
        
        if (result.matchedCount > 0) {
          console.log(`Updated: ${userData.email}`)
          updated++
        } else {
          notFound++
        }
      } catch (err) {
        console.error(`Error updating ${userData.email}:`, err.message)
      }
    }

    console.log('\n========== Update Complete ==========')
    console.log(`Total in SQL: ${users.length}`)
    console.log(`Updated: ${updated}`)
    console.log(`Not found in MongoDB: ${notFound}`)
    console.log('======================================')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Update failed:', error)
    process.exit(1)
  }
}

updatePasswords()

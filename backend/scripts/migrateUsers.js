// Migration script to import old users from MySQL SQL file to MongoDB
// Run on VPS: node scripts/migrateUsers.js
// Or use: MONGODB_URI=mongodb://localhost:27017/hcf node scripts/migrateUsers.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrateUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcf'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB:', mongoUri)

    // Read SQL file
    const sqlPath = path.join(__dirname, '../../hcfinvest_live.sql')
    if (!fs.existsSync(sqlPath)) {
      console.error('SQL file not found:', sqlPath)
      console.log('Please copy hcfinvest_live.sql to the project root folder')
      process.exit(1)
    }

    console.log('Reading SQL file...')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Find user data using regex - looking for INSERT INTO `users` VALUES
    const userRegex = /\((\d+),\s*'([^']*)',\s*'(\d+)',\s*'([^']+@[^']+)',\s*(?:'[^']*'|NULL),\s*'(\$2[yab]\$[^']+)'/g
    
    const users = []
    let match
    while ((match = userRegex.exec(sqlContent)) !== null) {
      users.push({
        mysqlUserId: parseInt(match[1]),
        firstName: match[2],
        username: match[3],
        email: match[4].toLowerCase(),
        password: match[5]
      })
    }

    console.log(`Found ${users.length} users to migrate`)

    if (users.length === 0) {
      console.log('No users found in SQL file. Check the file format.')
      process.exit(1)
    }

    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const userData of users) {
      try {
        // Check if user already exists
        const existing = await usersCollection.findOne({ email: userData.email })
        if (existing) {
          console.log(`Skipping existing: ${userData.email}`)
          skipped++
          continue
        }

        // Insert directly to bypass password hashing (password is already hashed)
        await usersCollection.insertOne({
          firstName: userData.firstName,
          email: userData.email,
          password: userData.password, // Already bcrypt hashed from PHP
          phone: '',
          countryCode: '+91',
          walletBalance: 0,
          isBlocked: false,
          isBanned: false,
          blockReason: '',
          banReason: '',
          isIB: false,
          ibStatus: null,
          ibPlanId: null,
          referralCode: null,
          parentIBId: null,
          ibLevel: 0,
          referredBy: null,
          assignedAdmin: null,
          adminUrlSlug: null,
          bankDetails: {
            bankName: '',
            accountNumber: '',
            accountHolderName: '',
            ifscCode: '',
            branchName: ''
          },
          upiId: '',
          mysqlUserId: userData.mysqlUserId,
          createdAt: new Date(),
          passwordChangedAt: null
        })

        console.log(`Migrated: ${userData.email}`)
        migrated++
      } catch (err) {
        console.error(`Error migrating ${userData.email}:`, err.message)
        errors++
      }
    }

    console.log('\n========== Migration Complete ==========')
    console.log(`Total found: ${users.length}`)
    console.log(`Migrated: ${migrated}`)
    console.log(`Skipped (existing): ${skipped}`)
    console.log(`Errors: ${errors}`)
    console.log('=========================================')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateUsers()

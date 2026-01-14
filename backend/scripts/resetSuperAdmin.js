// Reset Super Admin Script
// Run: node scripts/resetSuperAdmin.js

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const AdminSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String,
  isActive: Boolean,
  urlSlug: String,
  status: String,
  brandName: String,
  permissions: Object
}, { collection: 'admins' })

const AdminWalletSchema = new mongoose.Schema({
  adminId: mongoose.Schema.Types.ObjectId,
  balance: Number
}, { collection: 'adminwallets' })

const Admin = mongoose.model('Admin', AdminSchema)
const AdminWallet = mongoose.model('AdminWallet', AdminWalletSchema)

async function resetSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Delete all existing super admins
    const deleted = await Admin.deleteMany({ role: 'SUPER_ADMIN' })
    console.log(`Deleted ${deleted.deletedCount} super admin(s)`)

    // Also delete the old admin we just created
    await Admin.deleteMany({ email: 'admin@hcfinvest.com' })

    // Create new super admin
    const hashedPassword = await bcrypt.hash('Heddge@2026', 10)
    
    const superAdmin = await Admin.create({
      email: 'support@heddgecapitals.com',
      password: hashedPassword,
      firstName: 'Support',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      urlSlug: 'hcfinvest',
      status: 'ACTIVE',
      brandName: 'HC Finvest',
      permissions: {
        canManageUsers: true,
        canManageAccounts: true,
        canManageTransactions: true,
        canManageTrades: true,
        canManageIB: true,
        canManageSettings: true
      }
    })

    // Create wallet
    await AdminWallet.create({
      adminId: superAdmin._id,
      balance: 999999999
    })

    console.log('✅ Super Admin created successfully!')
    console.log('Email: support@heddgecapitals.com')
    console.log('Password: Heddge@2026')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

resetSuperAdmin()

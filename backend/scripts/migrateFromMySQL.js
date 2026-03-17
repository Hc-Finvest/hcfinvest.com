import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

// MongoDB Models
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  countryCode: { type: String, default: '+91' },
  password: { type: String, required: true, minlength: 6 },
  walletBalance: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  blockReason: { type: String, default: '' },
  banReason: { type: String, default: '' },
  isIB: { type: Boolean, default: false },
  ibStatus: { type: String, enum: ['PENDING', 'ACTIVE', 'BLOCKED', null], default: null },
  ibPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'IBPlan', default: null },
  referralCode: { type: String, default: null },
  parentIBId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ibLevel: { type: Number, default: 0 },
  referredBy: { type: String, default: null },
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  adminUrlSlug: { type: String, default: null },
  bankDetails: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branchName: { type: String, default: '' }
  },
  upiId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  passwordChangedAt: { type: Date, default: null },
  // Store old MySQL ID for reference
  mysqlUserId: { type: Number, default: null }
})

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  pendingDeposits: { type: Number, default: 0 },
  pendingWithdrawals: { type: Number, default: 0 }
}, { timestamps: true })

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  type: { type: String, enum: ['Deposit', 'Withdrawal', 'Transfer_To_Account', 'Transfer_From_Account', 'Account_Transfer_Out', 'Account_Transfer_In', 'IB_Commission', 'System'], required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['Bank Transfer', 'UPI', 'QR Code', 'Internal', 'Crypto', 'Manual'], default: 'Internal' },
  tradingAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradingAccount' },
  tradingAccountName: { type: String, default: '' },
  toTradingAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradingAccount' },
  toTradingAccountName: { type: String, default: '' },
  fromTradingAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradingAccount' },
  fromTradingAccountName: { type: String, default: '' },
  transactionRef: { type: String, default: '' },
  screenshot: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed'], default: 'Completed' },
  adminRemarks: { type: String, default: '' },
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Store old MySQL transaction ID for reference
  mysqlTxId: { type: String, default: null },
  note: { type: String, default: '' }
}, { timestamps: true })

const User = mongoose.model('User', userSchema)
const Wallet = mongoose.model('Wallet', walletSchema)
const Transaction = mongoose.model('Transaction', transactionSchema)

// Parse SQL INSERT statements
function parseInsertStatement(sql, tableName) {
  const regex = new RegExp(`INSERT INTO \`${tableName}\`[^(]*\\(([^)]+)\\)\\s*VALUES\\s*`, 'i')
  const match = sql.match(regex)
  if (!match) return { columns: [], rows: [] }
  
  const columns = match[1].split(',').map(col => col.trim().replace(/`/g, ''))
  
  // Find all value sets
  const valuesSection = sql.substring(sql.indexOf('VALUES') + 6)
  const rows = []
  
  let currentRow = []
  let currentValue = ''
  let inString = false
  let stringChar = ''
  let parenDepth = 0
  let escaped = false
  
  for (let i = 0; i < valuesSection.length; i++) {
    const char = valuesSection[i]
    
    if (escaped) {
      currentValue += char
      escaped = false
      continue
    }
    
    if (char === '\\') {
      escaped = true
      currentValue += char
      continue
    }
    
    if (!inString && (char === "'" || char === '"')) {
      inString = true
      stringChar = char
      currentValue += char
      continue
    }
    
    if (inString && char === stringChar) {
      inString = false
      currentValue += char
      continue
    }
    
    if (inString) {
      currentValue += char
      continue
    }
    
    if (char === '(') {
      if (parenDepth === 0) {
        currentValue = ''
        currentRow = []
      } else {
        currentValue += char
      }
      parenDepth++
      continue
    }
    
    if (char === ')') {
      parenDepth--
      if (parenDepth === 0) {
        currentRow.push(parseValue(currentValue.trim()))
        rows.push(currentRow)
        currentRow = []
        currentValue = ''
      } else {
        currentValue += char
      }
      continue
    }
    
    if (char === ',' && parenDepth === 1) {
      currentRow.push(parseValue(currentValue.trim()))
      currentValue = ''
      continue
    }
    
    if (parenDepth > 0) {
      currentValue += char
    }
  }
  
  return { columns, rows }
}

function parseValue(val) {
  if (val === 'NULL' || val === 'null') return null
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\')
  }
  if (!isNaN(val) && val !== '') return parseFloat(val)
  return val
}

// Extract data from SQL file
function extractTableData(sqlContent, tableName) {
  // Find the INSERT statement for this table
  const insertRegex = new RegExp(`INSERT INTO \`${tableName}\`[^;]+;`, 'gis')
  const matches = sqlContent.match(insertRegex)
  
  if (!matches) return []
  
  const allRows = []
  for (const insertStatement of matches) {
    const { columns, rows } = parseInsertStatement(insertStatement, tableName)
    for (const row of rows) {
      const obj = {}
      columns.forEach((col, idx) => {
        obj[col] = row[idx]
      })
      allRows.push(obj)
    }
  }
  
  return allRows
}

// Convert PHP bcrypt hash to Node.js compatible format
function convertPasswordHash(phpHash) {
  if (!phpHash) return null
  // PHP uses $2y$ prefix, Node.js bcryptjs uses $2a$ or $2b$
  // They are compatible, just need to change the prefix
  return phpHash.replace(/^\$2y\$/, '$2a$')
}

async function migrate() {
  console.log('🚀 Starting MySQL to MongoDB Migration...\n')
  
  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcf'
  console.log(`📦 Connecting to MongoDB: ${mongoUri}`)
  await mongoose.connect(mongoUri)
  console.log('✅ Connected to MongoDB\n')
  
  // Read SQL file
  const sqlFilePath = path.join(__dirname, '..', '..', 'hcfinvest_live.sql')
  console.log(`📄 Reading SQL file: ${sqlFilePath}`)
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
  console.log(`✅ SQL file loaded (${(sqlContent.length / 1024 / 1024).toFixed(2)} MB)\n`)
  
  // Extract users data
  console.log('📊 Extracting users from SQL...')
  const mysqlUsers = extractTableData(sqlContent, 'users')
  console.log(`   Found ${mysqlUsers.length} users`)
  
  // Extract users_profile data
  console.log('📊 Extracting user profiles from SQL...')
  const mysqlProfiles = extractTableData(sqlContent, 'users_profile')
  console.log(`   Found ${mysqlProfiles.length} profiles`)
  
  // Extract transactions
  console.log('📊 Extracting transactions from SQL...')
  const mysqlTransactions = extractTableData(sqlContent, 'account_transactions')
  console.log(`   Found ${mysqlTransactions.length} transactions\n`)
  
  // Create profile lookup by user_id
  const profileByUserId = {}
  for (const profile of mysqlProfiles) {
    profileByUserId[profile.user_id] = profile
  }
  
  // Migrate users
  console.log('👥 Migrating users...')
  const userIdMap = {} // Map MySQL user_id to MongoDB _id
  let usersCreated = 0
  let usersSkipped = 0
  
  for (const mysqlUser of mysqlUsers) {
    try {
      // Check if user already exists by email
      const existingUser = await User.findOne({ email: mysqlUser.email?.toLowerCase() })
      if (existingUser) {
        userIdMap[mysqlUser.id] = existingUser._id
        usersSkipped++
        continue
      }
      
      const profile = profileByUserId[mysqlUser.id] || {}
      
      // Convert password hash
      const convertedPassword = convertPasswordHash(mysqlUser.password)
      if (!convertedPassword) {
        console.log(`   ⚠️ Skipping user ${mysqlUser.email} - no password`)
        continue
      }
      
      // Calculate wallet balance from profile
      const walletBalance = parseFloat(profile.total_ib_commission || 0)
      
      // Create user - use insertOne to bypass the pre-save password hashing hook
      const userData = {
        firstName: mysqlUser.name || 'User',
        email: mysqlUser.email?.toLowerCase(),
        phone: profile.phone || '',
        countryCode: '+91',
        password: convertedPassword, // Already hashed from MySQL
        walletBalance: walletBalance,
        isBlocked: mysqlUser.status !== 1,
        isBanned: false,
        blockReason: '',
        banReason: '',
        isIB: profile.is_ib === 1,
        ibStatus: profile.is_ib === 1 ? 'ACTIVE' : null,
        ibPlanId: null,
        referralCode: mysqlUser.username || null,
        parentIBId: null,
        ibLevel: profile.ib_level || 0,
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
        createdAt: mysqlUser.created_at ? new Date(mysqlUser.created_at) : new Date(),
        passwordChangedAt: null,
        mysqlUserId: mysqlUser.id
      }
      
      // Use collection.insertOne to bypass mongoose middleware (pre-save hook)
      const result = await User.collection.insertOne(userData)
      const newUser = { _id: result.insertedId }
      userIdMap[mysqlUser.id] = newUser._id
      usersCreated++
      
      // Create wallet for user
      const wallet = new Wallet({
        userId: newUser._id,
        balance: walletBalance,
        pendingDeposits: 0,
        pendingWithdrawals: 0
      })
      await wallet.save()
      
    } catch (error) {
      console.log(`   ❌ Error migrating user ${mysqlUser.email}: ${error.message}`)
    }
  }
  
  console.log(`   ✅ Created ${usersCreated} users, skipped ${usersSkipped} existing\n`)
  
  // Migrate transactions
  console.log('💰 Migrating transactions...')
  let txCreated = 0
  let txSkipped = 0
  
  for (const mysqlTx of mysqlTransactions) {
    try {
      const mongoUserId = userIdMap[mysqlTx.user_id]
      if (!mongoUserId) {
        txSkipped++
        continue
      }
      
      // Check if transaction already exists
      const existingTx = await Transaction.findOne({ mysqlTxId: mysqlTx.txid })
      if (existingTx) {
        txSkipped++
        continue
      }
      
      // Map transaction type
      let txType = 'Deposit'
      if (mysqlTx.source === 'Deposit') txType = 'Deposit'
      else if (mysqlTx.source === 'Transfer') txType = mysqlTx.type === 'credit' ? 'Transfer_From_Account' : 'Transfer_To_Account'
      else if (mysqlTx.source === 'IB') txType = 'IB_Commission'
      else if (mysqlTx.source === 'System') txType = 'System'
      else if (mysqlTx.type === 'debit') txType = 'Withdrawal'
      
      const newTx = new Transaction({
        userId: mongoUserId,
        type: txType,
        amount: parseFloat(mysqlTx.amount) || 0,
        paymentMethod: mysqlTx.method === 'manual' ? 'Manual' : 'Internal',
        transactionRef: mysqlTx.txid || '',
        status: mysqlTx.status === 3 ? 'Completed' : 'Pending',
        note: mysqlTx.note || '',
        mysqlTxId: mysqlTx.txid,
        createdAt: mysqlTx.created_at ? new Date(mysqlTx.created_at) : new Date()
      })
      
      await newTx.save()
      txCreated++
      
    } catch (error) {
      console.log(`   ❌ Error migrating transaction ${mysqlTx.txid}: ${error.message}`)
    }
  }
  
  console.log(`   ✅ Created ${txCreated} transactions, skipped ${txSkipped}\n`)
  
  // Summary
  console.log('=' .repeat(50))
  console.log('📋 MIGRATION SUMMARY')
  console.log('=' .repeat(50))
  console.log(`   Users created: ${usersCreated}`)
  console.log(`   Users skipped (already exist): ${usersSkipped}`)
  console.log(`   Transactions created: ${txCreated}`)
  console.log(`   Transactions skipped: ${txSkipped}`)
  console.log('=' .repeat(50))
  console.log('\n✅ Migration completed successfully!')
  console.log('\n⚠️  IMPORTANT: Users can now login with their SAME email and password from the old system.')
  
  await mongoose.disconnect()
  process.exit(0)
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})

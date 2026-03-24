import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import AdminLayout from '../components/AdminLayout'
import { useTheme } from '../context/ThemeContext'
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Shield,
  DollarSign,
  User,
  FileText,
  RefreshCw,
  Check,
  AlertTriangle
} from 'lucide-react'

const AdminUserDetails = () => {

  const { modeColors } = useTheme()
  const { userId } = useParams()
  const navigate = useNavigate()

  const [user,setUser] = useState(null)
  const [loading,setLoading] = useState(true)
  const [activeTab,setActiveTab] = useState('profile')

  const [tradingAccounts,setTradingAccounts] = useState([])
  const [bankAccounts,setBankAccounts] = useState([])
  const [documents,setDocuments] = useState([])
  const [wallets,setWallets] = useState([])
  const [transactions,setTransactions] = useState([])
  const [logs,setLogs] = useState([])
  const [security,setSecurity] = useState(null)
  const [affiliate,setAffiliate] = useState(null)
  const [originalData, setOriginalData] = useState({});

  const [message, setMessage] = useState({
  type: '',
  text: ''
})

  const [tabLoading,setTabLoading] = useState(false)
  const [formData, setFormData] = useState({
  title: 'Mr',
  firstName: '',
  lastName: '',
  mobile: '',
  phone: '',
  email: '',
  country: 'India',
  gender: 'Male',
  usCitizen: 'NO',
  dateOfBirth: '',
  nationality: 'India',
  address: '',
  addressLine2: '',
  city: '',
  postalCode: '',
  language: 'English',
  source: '',
  politicallyExposed: 'NO',
  taxIdentificationNumber: '',
  idType: '',
  idCountry: '',
  idNumber: '',
  idDateOfIssue: '',
  idDateOfExpiry: ''
})

  useEffect(()=>{
    if(userId){
      fetchUserDetails()
    }
  },[userId])

  useEffect(()=>{

    if(!userId) return

    const loadTab = async () => {

      setTabLoading(true)

      try{

        switch(activeTab){

          case "trading":
            await fetchTradingAccounts()
            break

          case "bank":
            await fetchBankAccounts()
            break

          case "documents":
            await fetchDocuments()
            break

          case "wallets":
            await fetchWallets()
            break

          case "transactions":
            await fetchTransactions()
            break

          case "logs":
            await fetchLogs()
            break

          case "security":
            await fetchSecurity()
            break

          case "affiliate":
            await fetchAffiliate()
            break

          default:
            break
        }

      }catch(err){
        console.error(err)
      }

      setTabLoading(false)

    }

    loadTab()

  },[activeTab,userId])


  const handleInputChange = (field, value) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }))
}

const handleUpdateProfile = async () => {

  try {

    let updatedFields = {}

    Object.keys(formData).forEach(key => {

      // ❌ Ignore lastName completely
      if (key === "lastName") return

      if (formData[key] !== originalData[key]) {
        updatedFields[key] = formData[key]
      }

    })

    // 🚨 No changes
    if (Object.keys(updatedFields).length === 0) {
      setMessage({
        type: "error",
        text: "No changes made"
      })
      return
    }

    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: "PUT", // ✅ better
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedFields)
    })

    const data = await response.json()

    if (response.ok) {

      setMessage({
        type: "success",
        text: "Profile updated successfully"
      })

      fetchUserDetails()

    } else {

      setMessage({
        type: "error",
        text: data.message || "Failed to update profile"
      })

    }

  } catch (error) {

    console.error("Update error:", error)

    setMessage({
      type: "error",
      text: "Server error while updating profile"
    })

  }

}

  const fetchUserDetails = async () => {

    try{
      const res = await fetch(`${API_URL}/admin/users/${userId}`)
      const data = await res.json()

if(data.user){
  setUser(data.user)

  const mapped = {
    title: 'Mr',
    firstName: data.user.firstName || '',
    mobile: data.user.mobile || '',
    phone: data.user.phone || '',
    email: data.user.email || '',
    country: data.user.country || 'India',
    gender: data.user.gender || 'Male',
    usCitizen: data.user.usCitizen || 'NO',
    dateOfBirth: data.user.dateOfBirth || '',
    nationality: data.user.nationality || 'India',
    address: data.user.address || '',
    addressLine2: data.user.addressLine2 || '',
    city: data.user.city || '',
    postalCode: data.user.postalCode || '',
    language: data.user.language || 'English',
    source: data.user.source || '',
    politicallyExposed: data.user.politicallyExposed || 'NO',
    taxIdentificationNumber: data.user.taxIdentificationNumber || '',
    idType: data.user.idType || '',
    idCountry: data.user.idCountry || '',
    idNumber: data.user.idNumber || '',
    idDateOfIssue: data.user.idDateOfIssue || '',
    idDateOfExpiry: data.user.idDateOfExpiry || ''
  }

  setFormData(mapped)
  setOriginalData(mapped) // ✅ IMPORTANT
}

    }catch(err){
      console.error('Error fetching user details:', err)
      setMessage({
        type: 'error',
        text: 'Failed to fetch user details'
      })
    }

    setLoading(false)

  }



  const fetchTradingAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/trading-accounts/user/${userId}`)
      const data = await res.json()
      
      if(data.success) {
        setTradingAccounts(data.accounts || [])
      } else {
        console.error('Error fetching trading accounts:', data.message)
      }
    } catch(err) {
      console.error('Error fetching trading accounts:', err)
    }
  }

  const fetchBankAccounts = async () => {
    try {
      // Using UserBankAccount model - endpoint might not exist, let's use a fallback
      const res = await fetch(`${API_URL}/user-bank-accounts/${userId}`)
      if(res.ok) {
        const data = await res.json()
        setBankAccounts(data.accounts || [])
      } else {
        // If endpoint doesn't exist, set empty array
        setBankAccounts([])
      }
    } catch(err) {
      console.error('Error fetching bank accounts:', err)
      setBankAccounts([])
    }
  }

  const fetchDocuments = async () => {
    try {
      // Using KYC model for documents
      const res = await fetch(`${API_URL}/kyc/user/${userId}`)
      if(res.ok) {
        const data = await res.json()
        setDocuments(data.kyc ? [data.kyc] : [])
      } else {
        setDocuments([])
      }
    } catch(err) {
      console.error('Error fetching documents:', err)
      setDocuments([])
    }
  }

  const fetchWallets = async () => {
    try {
      const res = await fetch(`${API_URL}/wallet/${userId}`)
      const data = await res.json()
      
      if(data.wallet) {
        setWallets([data.wallet])
      } else {
        setWallets([])
      }
    } catch(err) {
      console.error('Error fetching wallets:', err)
      setWallets([])
    }
  }

  const fetchTransactions = async () => {
    try {
      // Using Transaction model - fetch user transactions
      const res = await fetch(`${API_URL}/transactions/user/${userId}`)
      if(res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
      } else {
        setTransactions([])
      }
    } catch(err) {
      console.error('Error fetching transactions:', err)
      setTransactions([])
    }
  }

  const fetchLogs = async () => {
    try {
      // Using AdminLog model for user logs
      const res = await fetch(`${API_URL}/admin/logs/user/${userId}`)
      if(res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      } else {
        setLogs([])
      }
    } catch(err) {
      console.error('Error fetching logs:', err)
      setLogs([])
    }
  }

  const fetchSecurity = async () => {
    try {
      // Security data might be stored in user model or separate
      const res = await fetch(`${API_URL}/admin/users/${userId}/security`)
      if(res.ok) {
        const data = await res.json()
        setSecurity(data)
      } else {
        setSecurity({ twoFactor: false, lastLogin: null })
      }
    } catch(err) {
      console.error('Error fetching security:', err)
      setSecurity({ twoFactor: false, lastLogin: null })
    }
  }

  const fetchAffiliate = async () => {
    try {
      // Using IBUser model for affiliate data
      const res = await fetch(`${API_URL}/ib/user/${userId}`)
      if(res.ok) {
        const data = await res.json()
        setAffiliate(data)
      } else {
        setAffiliate({ referralCode: null, commission: 0 })
      }
    } catch(err) {
      console.error('Error fetching affiliate:', err)
      setAffiliate({ referralCode: null, commission: 0 })
    }
  }



  const tabs = [
    { id:'profile',label:'Profile',icon:User },
    { id:'bank',label:'Bank Accounts',icon:CreditCard },
    { id:'documents',label:'Documents',icon:FileText },
    { id:'trading',label:'Trading Accounts',icon:Wallet },
    { id:'wallets',label:'Wallets',icon:DollarSign },
    { id:'transactions',label:'Transactions',icon:CreditCard },
    { id:'logs',label:'Logs',icon:FileText },
    { id:'security',label:'Security',icon:Shield },
    { id:'affiliate',label:'Affiliate',icon:User }
  ]


  if(loading){

    return(
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="animate-spin text-gray-400" size={30}/>
        </div>
      </AdminLayout>
    )

  }



  return(

    <AdminLayout>

      <div className="p-6 bg-">

        {/* HEADER */}

        <div className="flex items-center gap-4 mb-6">

          <button
            onClick={()=>navigate('/admin/users')}
            className="p-2 rounded-lg"
            // style={{backgroundColor:modeColors.bgCard}}
          >
            <ArrowLeft size={20}/>
          </button>

          <h1 className="text-2xl font-bold text-black">
            Client Details
          </h1>

        </div>



        {/* TABS */}

        <div className="flex gap-1 mb-6 border-b" style={{borderColor:modeColors.border}}>

          {tabs.map(tab=>{

            const Icon = tab.icon

            return(

              <button
                key={tab.id}
                onClick={()=>setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 ${
                  activeTab === tab.id
                  ? "border-accent-green text-accent-green"
                  : "text-gray-400 border-transparent"
                }`}
              >
                <Icon size={16}/>
                {tab.label}
              </button>

            )

          })}

        </div>



        {/* LOADER */}

        {tabLoading && (
          <div className="flex justify-center py-10">
            <RefreshCw className="animate-spin text-gray-400"/>
          </div>
        )}



        {/* PROFILE */}

        {activeTab === "profile" && (
          <div className="rounded-lg p-6" style={{ backgroundColor: modeColors.bgCard }}>

            {/* Message Display */}
            {message.text && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                message.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              }`}>
                {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            <h3 className="text-lg font-semibold text-white mb-6">General Information</h3>

<div className="grid grid-cols-2 gap-6">

{/* LEFT COLUMN */}

<div className="space-y-4">

<div>
<label className="text-gray-400 text-sm">Title</label>
<select
value={formData.title}
onChange={(e)=>handleInputChange("title",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
>
<option value="Mr">Mr</option>
<option value="Mrs">Mrs</option>
<option value="Miss">Miss</option>
<option value="Dr">Dr</option>
</select>
</div>

<div>
<label className="text-gray-400 text-sm">First Name</label>
<input
value={formData.firstName}
onChange={(e)=>handleInputChange("firstName",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
/>
</div>

<div>
<label className="text-gray-400 text-sm">Mobile</label>
<input
value={formData.mobile}
onChange={(e)=>handleInputChange("mobile",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
/>
</div>

<div>
<label className="text-gray-400 text-sm">Country</label>
<input
value={formData.country}
onChange={(e)=>handleInputChange("country",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
/>
</div>

<div>
<label className="text-gray-400 text-sm">Gender</label>
<select
value={formData.gender}
onChange={(e)=>handleInputChange("gender",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
>
<option>Male</option>
<option>Female</option>
<option>Other</option>
</select>
</div>

<div>
<label className="text-gray-400 text-sm">US Citizen</label>
<select
value={formData.usCitizen}
onChange={(e)=>handleInputChange("usCitizen",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
>
<option value="YES">YES</option>
<option value="NO">NO</option>
</select>
</div>

</div>

{/* RIGHT COLUMN */}

<div className="space-y-4">

<div>
<label className="text-gray-400 text-sm">Last Name</label>
<input
value={formData.lastName}
onChange={(e)=>handleInputChange("lastName",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
/>
</div>

<div>
<label className="text-gray-400 text-sm">Phone</label>
<input
value={formData.phone}
onChange={(e)=>handleInputChange("phone",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
/>
</div>

<div>
<label className="text-gray-400 text-sm">Email</label>
<input
value={formData.email}
onChange={(e)=>handleInputChange("email",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
/>
</div>

<div>
<label className="text-gray-400 text-sm">Date of Birth</label>
<input
type="date"
value={formData.dateOfBirth}
onChange={(e)=>handleInputChange("dateOfBirth",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
/>
</div>

<div>
<label className="text-gray-400 text-sm">Nationality</label>
<input
value={formData.nationality}
onChange={(e)=>handleInputChange("nationality",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
/>
</div>

<div>
<label className="text-gray-400 text-sm">Address</label>
<input
value={formData.address}
onChange={(e)=>handleInputChange("address",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
/>
</div>

<div>
<label className="text-gray-400 text-sm">City</label>
<input
value={formData.city}
onChange={(e)=>handleInputChange("city",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
/>
</div>

<div>
<label className="text-gray-400 text-sm">Postal Code</label>
<input
value={formData.postalCode}
onChange={(e)=>handleInputChange("postalCode",e.target.value)}
className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600"
/>
</div>

</div>

</div>

{/* UPDATE BUTTON */}

<div className="mt-8 flex justify-end">

<button
onClick={handleUpdateProfile}
className="px-6 py-3 bg-accent-green text-black font-semibold rounded-lg"
>
Update
</button>

</div>

</div>
        )}



        {/* TRADING */}

        {activeTab === "trading" && (
          <div className="rounded-lg p-6" style={{ backgroundColor: modeColors.bgCard }}>
            <h3 className="text-lg font-semibold text-white mb-4">Trading Accounts</h3>
            <div className="space-y-4">
              {tradingAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No trading accounts found</p>
                </div>
              ) : (
                tradingAccounts.map(acc => (
                  <div
                    key={acc._id}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: modeColors.bgSecondary,
                      borderColor: modeColors.border
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold text-lg">
                          {acc.accountId || 'N/A'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {acc.accountTypeId?.name || "Standard Account"}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Leverage: {acc.leverage || '1:100'}
                        </p>
                        {acc.isDemo && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded mt-2">
                            Demo Account
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-lg">
                          ${(acc.balance || 0).toFixed(2)}
                        </p>
                        {acc.credit && acc.credit > 0 && (
                          <p className="text-purple-400 text-sm">
                            Credit: ${acc.credit.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}



        {/* BANK */}

        {activeTab === "bank" && (
          <div className="rounded-lg p-6" style={{ backgroundColor: modeColors.bgCard }}>
            <h3 className="text-lg font-semibold text-white mb-4">Bank Accounts</h3>
            <div className="space-y-4">
              {bankAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No bank accounts found</p>
                </div>
              ) : (
                bankAccounts.map(acc => (
                  <div 
                    key={acc._id} 
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: modeColors.bgSecondary,
                      borderColor: modeColors.border
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">
                          {acc.bankName || 'Unknown Bank'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Account: {acc.accountNumber || 'N/A'}
                        </p>
                        {acc.accountHolderName && (
                          <p className="text-gray-500 text-sm">
                            Holder: {acc.accountHolderName}
                          </p>
                        )}
                      </div>
                      {acc.isPrimary && (
                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}



        {/* DOCUMENTS */}

        {activeTab === "documents" && (
          <div className="rounded-lg p-6" style={{ backgroundColor: modeColors.bgCard }}>
            <h3 className="text-lg font-semibold text-white mb-4">Documents</h3>
            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No documents found</p>
                </div>
              ) : (
                documents.map(doc => (
                  <div 
                    key={doc._id} 
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: modeColors.bgSecondary,
                      borderColor: modeColors.border
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">
                          {doc.documentType || 'Identity Document'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Status: 
                          <span className={`ml-2 px-2 py-1 text-xs rounded ${
                            doc.verified 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {doc.verified ? 'Verified' : 'Pending'}
                          </span>
                        </p>
                        {doc.submittedAt && (
                          <p className="text-gray-500 text-xs mt-1">
                            Submitted: {new Date(doc.submittedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}



        {/* WALLETS */}

        {activeTab === "wallets" && (
          <div className="rounded-lg p-6" style={{ backgroundColor: modeColors.bgCard }}>
            <h3 className="text-lg font-semibold text-white mb-4">Wallets</h3>
            <div className="space-y-4">
              {wallets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No wallets found</p>
                </div>
              ) : (
                wallets.map(w => (
                  <div 
                    key={w._id} 
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: modeColors.bgSecondary,
                      borderColor: modeColors.border
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-semibold">
                          {w.currency || 'USD'} Wallet
                        </p>
                        <p className="text-gray-400 text-sm">
                          Wallet ID: {w._id?.slice(-8) || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-lg">
                          ${(w.balance || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}



        {/* TRANSACTIONS */}

        {activeTab === "transactions" && (
          <div className="rounded-lg p-6" style={{ backgroundColor: modeColors.bgCard }}>
            <h3 className="text-lg font-semibold text-white mb-4">Transactions</h3>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No transactions found</p>
                </div>
              ) : (
                transactions.map(tx => (
                  <div 
                    key={tx._id} 
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: modeColors.bgSecondary,
                      borderColor: modeColors.border
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-semibold capitalize">
                          {tx.type || 'Transaction'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {tx.description || 'No description'}
                        </p>
                        {tx.createdAt && (
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          tx.type === 'deposit' || tx.type === 'credit' 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {tx.type === 'deposit' || tx.type === 'credit' ? '+' : '-'}
                          ${(tx.amount || 0).toFixed(2)}
                        </p>
                        {tx.status && (
                          <p className="text-gray-400 text-xs">
                            {tx.status}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}



        {/* LOGS */}

        {activeTab === "logs" && (
          <div className="rounded-lg p-6" style={{ backgroundColor: modeColors.bgCard }}>
            <h3 className="text-lg font-semibold text-white mb-4">Activity Logs</h3>
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No logs found</p>
                </div>
              ) : (
                logs.map(log => (
                  <div 
                    key={log._id} 
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: modeColors.bgSecondary,
                      borderColor: modeColors.border
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">
                          {log.action || 'System Action'}
                        </p>
                        {log.details && (
                          <p className="text-gray-400 text-sm mt-1">
                            {log.details}
                          </p>
                        )}
                      </div>
                      {log.createdAt && (
                        <p className="text-gray-500 text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}



        {/* SECURITY */}

        {activeTab === "security" && (
          <div className="rounded-lg p-6" style={{ backgroundColor: modeColors.bgCard }}>
            <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border" style={{
                backgroundColor: modeColors.bgSecondary,
                borderColor: modeColors.border
              }}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">Two-Factor Authentication</p>
                    <p className="text-gray-400 text-sm">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded ${
                    security?.twoFactor 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {security?.twoFactor ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              
              {security?.lastLogin && (
                <div className="p-4 rounded-lg border" style={{
                  backgroundColor: modeColors.bgSecondary,
                  borderColor: modeColors.border
                }}>
                  <div>
                    <p className="text-white font-medium">Last Login</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(security.lastLogin).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg border" style={{
                backgroundColor: modeColors.bgSecondary,
                borderColor: modeColors.border
              }}>
                <div>
                  <p className="text-white font-medium">Password</p>
                  <p className="text-gray-400 text-sm">
                    Last changed: {security?.passwordChanged ? 
                      new Date(security.passwordChanged).toLocaleDateString() : 
                      'Never'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* AFFILIATE */}

        {activeTab === "affiliate" && (
          <div className="rounded-lg p-6" style={{ backgroundColor: modeColors.bgCard }}>
            <h3 className="text-lg font-semibold text-white mb-4">Affiliate Information</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border" style={{
                backgroundColor: modeColors.bgSecondary,
                borderColor: modeColors.border
              }}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">Referral Code</p>
                    <p className="text-gray-400 text-sm">
                      Share this code with friends to earn commissions
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm font-mono">
                    {affiliate?.referralCode || 'Not Available'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg border" style={{
                backgroundColor: modeColors.bgSecondary,
                borderColor: modeColors.border
              }}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">Total Commission Earned</p>
                    <p className="text-gray-400 text-sm">
                      Lifetime earnings from referrals
                    </p>
                  </div>
                  <span className="text-green-400 font-bold text-lg">
                    ${(affiliate?.commission || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {affiliate?.referrals && affiliate.referrals > 0 && (
                <div className="p-4 rounded-lg border" style={{
                  backgroundColor: modeColors.bgSecondary,
                  borderColor: modeColors.border
                }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">Total Referrals</p>
                      <p className="text-gray-400 text-sm">
                        Number of users referred
                      </p>
                    </div>
                    <span className="text-white font-bold text-lg">
                      {affiliate.referrals}
                    </span>
                  </div>
                </div>
              )}

              {(!affiliate?.referralCode && !affiliate?.commission) && (
                <div className="text-center py-8">
                  <p className="text-gray-400">Affiliate program not activated</p>
                  <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Join Affiliate Program
                  </button>
                </div>
              )}
            </div>
          </div>
        )}



      </div>

    </AdminLayout>

  )

}

export default AdminUserDetails;
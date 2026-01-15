const Logo = ({ size = 'sm', showText = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl'
  }

  return (
    <div className="flex items-center gap-2">
      <img 
        src="/hcfinvest_orange_logo.png" 
        alt="hcfinvest" 
        className={`${sizeClasses[size]} object-contain`}
        onError={(e) => {
          // Fallback to text logo if image fails to load
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'flex'
        }}
      />
      <div 
        className={`${sizeClasses[size]} bg-orange-500 rounded items-center justify-center hidden`}
      >
        <span className={`text-white font-bold ${textSizes[size]}`}>HCF</span>
      </div>
      {showText && (
        <span className="text-white font-semibold">hcfinvest</span>
      )}
    </div>
  )
}

export default Logo

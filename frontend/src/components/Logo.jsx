const Logo = ({ size = "sm", showText = false, className = "" }) => {

  const sizeClasses = {
    xs: "h-6",
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
    xl: "h-16",
    "2xl": "h-20"
  };

  const textSizes = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
    "2xl": "text-xl"
  };

  const logoTextSizes = {
    xs: "text-sm",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>

      {/* Image Logo */}
      <img
        src="/hcfinvest_orange_logo.png"
        alt="hcfinvest"
        className={`${sizeClasses[size] || sizeClasses.sm} w-auto object-contain`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const fallback = e.currentTarget.parentElement.querySelector(".fallback-logo");
          if (fallback) fallback.style.display = "flex";
        }}
      />

      {/* Fallback Logo */}
      <div
        className={`fallback-logo ${sizeClasses[size] || sizeClasses.sm} w-auto px-2 bg-orange-500 rounded items-center justify-center hidden`}
      >
        <span className={`text-white font-bold ${textSizes[size] || textSizes.sm}`}>
          HCF
        </span>
      </div>

      {/* Logo Text */}
      {showText && (
        <span
          className={`font-semibold ${logoTextSizes[size] || logoTextSizes.sm} whitespace-nowrap text-gray-900 dark:text-white`}
        >
          hcfinvest
        </span>
      )}
    </div>
  );
};

export default Logo;












// const Logo = ({ size = 'sm', showText = false, className = '' }) => {
//   const sizeClasses = {
//     xs: 'w-6 h-6',
//     sm: 'w-8 h-8',
//     md: 'w-10 h-10',
//     lg: 'w-12 h-12',
//     xl: 'w-16 h-16',
//     '2xl': 'w-20 h-20'
//   }

//   const textSizes = {
//     xs: 'text-[10px]',
//     sm: 'text-xs',
//     md: 'text-sm',
//     lg: 'text-base',
//     xl: 'text-lg',
//     '2xl': 'text-xl'
//   }

//   const logoTextSizes = {
//     xs: 'text-sm',
//     sm: 'text-sm',
//     md: 'text-base',
//     lg: 'text-lg',
//     xl: 'text-xl',
//     '2xl': 'text-2xl'
//   }

//   return (
//     <div className={`flex items-center gap-2 ${className}`}>
//       <img 
//         src="/hcfinvest_orange_logo.png" 
//         alt="hcfinvest" 
//         className={`${sizeClasses[size] || sizeClasses.sm} object-contain flex-shrink-0`}
//         onError={(e) => {
//           // Fallback to text logo if image fails to load
//           e.target.style.display = 'none'
//           if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
//         }}
//       />
//       <div 
//         className={`${sizeClasses[size] || sizeClasses.sm} bg-orange-500 rounded items-center justify-center hidden flex-shrink-0`}
//       >
//         <span className={`text-white font-bold ${textSizes[size] || textSizes.sm}`}>HCF</span>
//       </div>
//       {showText && (
//         <span className={`text-white font-semibold ${logoTextSizes[size] || logoTextSizes.sm} whitespace-nowrap`}>hcfinvest</span>
//       )}
//     </div>
//   )
// }

// export default Logo

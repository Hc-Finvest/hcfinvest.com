// // Sidebar.jsx

// import { useNavigate } from "react-router-dom";
// import {
//   LayoutDashboard,
//   User,
//   Wallet,
//   Users,
//   Copy,
//   HelpCircle,
//   FileText,

//   Menu,
// } from "lucide-react";
// import { useLocation } from "react-router-dom";
// import { MdLeaderboard } from "react-icons/md";
// import { useTheme } from "../context/ThemeContext";
// import { useSidebar } from "../context/SidebarContext";

// const Sidebar = ({ activeMenu = "Dashboard" }) => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { isDarkMode, toggleDarkMode } = useTheme();

//   const { sidebarExpanded, toggleSidebar } = useSidebar();

//   const menuItems = [
//     { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
//     { name: "Account", icon: User, path: "/account" },
//     { name: "Wallet", icon: Wallet, path: "/wallet" },
//     { name: "Orders", icon: FileText, path: "/orders" },
//     { name: "IB", icon: Users, path: "/ib" },
//     { name: "Copytrade", icon: Copy, path: "/copytrade" },
//     { name: "Competition", icon: MdLeaderboard, path: "/competition" },
//     // { name: "Leader Board", icon: FileText, path: "/leader-board" },
//     //{ name: "Profile", icon: UserCircle, path: "/profile" },
//     { name: "Support", icon: HelpCircle, path: "/support" },
//     { name: "Instructions", icon: FileText, path: "/instructions" },
//   ];

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     navigate("/user/login");
//   };

//   return (
//     <aside
//       className={`${
//         sidebarExpanded ? "w-60" : "w-16"
//       } bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
//     >
//       {/* TOP SECTION */}
//       <div className="flex items-center justify-between p-3 border-b">
//         <button
//           onClick={toggleSidebar}
//           className="p-2 hover:bg-gray-100 rounded"
//         >
//           <Menu size={20} />
//         </button>

//         {sidebarExpanded && <span className="font-semibold text-lg"></span>}
//       </div>

//       {/* MENU */}
//       <nav className="flex-1 p-3 space-y-2">
//         {menuItems.map((item) => (
//           <button
//             key={item.name}
//             onClick={() => navigate(item.path)}
//             className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
//               location.pathname === item.path
//                 ? "bg-blue-50 text-blue-600"
//                 : "text-gray-600 hover:bg-gray-100"
//             }`}
//           >
//             <item.icon size={18} />
//             {sidebarExpanded && <span>{item.name}</span>}
//           </button>
//         ))}
//       </nav>
//     </aside>
//   );
// };

// export default Sidebar;


// Sidebar.jsx

import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Wallet,
  Users,
  Copy,
  HelpCircle,
  FileText,
  Menu,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { MdLeaderboard } from "react-icons/md";
import { useTheme } from "../context/ThemeContext";
import { useSidebar } from "../context/SidebarContext";

const Sidebar = ({ activeMenu = "Dashboard" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const { sidebarExpanded, toggleSidebar } = useSidebar();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Account", icon: User, path: "/account" },
    { name: "Wallet", icon: Wallet, path: "/wallet" },
    { name: "Orders", icon: FileText, path: "/orders" },
    { name: "IB", icon: Users, path: "/ib" },
    { name: "Copytrade", icon: Copy, path: "/copytrade" },
    { name: "Competition", icon: MdLeaderboard, path: "/competition" },
    /* { name: "Leader Board", icon: FileText, path: "/leader-board" }, */
    //{ name: "Profile", icon: UserCircle, path: "/profile" },
    { name: "Support", icon: HelpCircle, path: "/support" },
    { name: "Instructions", icon: FileText, path: "/instructions" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/user/login");
  };

  return (
    <aside
      className={`${
        sidebarExpanded ? "w-70" : "w-16"
      } bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
    >
      {/* TOP SECTION */}
      <div className="flex items-center justify-between p-4 border-b h-24">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded "
        >
          <Menu size={25} />
        </button>

        

        {/* 🔥 LOGO (ONLY WHEN EXPANDED) */}
    {sidebarExpanded && (
      <img
        src="/sidebarlogo.jpeg"
        alt="logo"
        className="h-8 object-contain "
      />
    )}
      </div>

      {/* MENU */}
      <nav className="flex-1 p-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
              location.pathname === item.path
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <item.icon size={18} />
            {sidebarExpanded && <span>{item.name}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

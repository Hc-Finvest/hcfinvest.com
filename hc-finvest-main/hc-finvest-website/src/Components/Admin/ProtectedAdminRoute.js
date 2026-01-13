import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedAdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("adminAuth") === "true";

  return isAuthenticated ? children : <Navigate to="/adminLogin" replace />;
};

export default ProtectedAdminRoute;

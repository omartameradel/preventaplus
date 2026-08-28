import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, userData } = useAuth();

  if (!currentUser) {
    return React.createElement(Navigate, { to: "/login", replace: true });
  }
  
  if (requireAdmin && userData?.role !== "admin") {
    return React.createElement(Navigate, { to: "/dashboard", replace: true });
  }

  return children;
}

import React from "react";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: string; // "admin" or "voter"
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const userRole = localStorage.getItem("userRole");

  // If the user is not logged in or does not have the required role, redirect to login page
  if (!userRole || userRole !== requiredRole) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Otherwise, allow access to the children (the dashboard)
  return <>{children}</>;
}

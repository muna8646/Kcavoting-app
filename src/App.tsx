import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { VoterDashboard } from "./pages/VoterDashboard";
import { ProtectedRoute } from "./ProtectedRoute"; // Import the ProtectedRoute

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        {/* Protect AdminDashboard route */}
        <Route
          path="/AdminDashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        {/* Protect VoterDashboard route */}
        <Route
          path="/VoterDashboard"
          element={
            <ProtectedRoute requiredRole="voter">
              <VoterDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

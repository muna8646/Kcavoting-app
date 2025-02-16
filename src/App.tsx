import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { VoterDashboard } from "./pages/VoterDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/VoterDashboard" element={<VoterDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

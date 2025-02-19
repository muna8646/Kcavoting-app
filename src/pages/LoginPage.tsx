import React from "react";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [nationalId, setNationalId] = React.useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ registrationNumber, nationalId }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("userRole", data.role); // Store the user role
        localStorage.setItem("registrationNumber", registrationNumber); // Store registration number
        console.log("✅ Login successful. Role:", data.role);

        // Redirect based on the role
        if (data.role === "admin") {
          navigate("/AdminDashboard");
        } else if (data.role === "voter") {
          navigate("/VoterDashboard");
        } else {
          console.warn("⚠️ Unknown role:", data.role);
          alert("Unknown user role. Contact administrator.");
        }
      } else {
        console.log("❌ Login failed:", data.message);
        alert(data.message);
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      alert("An error occurred during login. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          KCA Voting System
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="text"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="Registration Number"
            className="w-full p-3 border rounded-md"
            required
          />
          <input
            type="password"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            placeholder="National ID"
            className="w-full p-3 border rounded-md"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-300"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

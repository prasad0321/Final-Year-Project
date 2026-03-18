import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import HospitalLogin from "./pages/HospitalLogin";
import Register from "./pages/Register";
import HospitalDashboard from "./pages/HospitalDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/hospital-login" element={<HospitalLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="hospital">
            <HospitalDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
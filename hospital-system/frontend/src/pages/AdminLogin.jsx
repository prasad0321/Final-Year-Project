import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/admin/login", { email, password });
      localStorage.setItem("adminToken", res.data.token);
      alert("Welcome to Admin control panel.");
      navigate("/admin");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#1a1a2e" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "10px", width: "350px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
        <h2 style={{ textAlign: "center", color: "#1a1a2e", marginTop: 0 }}>🛡️ System Admin</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "30px", fontSize: "14px" }}>Authorized Personnel Only</p>
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Admin Email" 
            required 
            style={inputStyle} 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            style={inputStyle} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button type="submit" style={btnPrimary}>Login</button>
        </form>
      </div>
    </div>
  );
};

const inputStyle = { width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" };
const btnPrimary = { width: "100%", backgroundColor: "#1a1a2e", color: "white", padding: "12px 20px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" };

export default AdminLogin;
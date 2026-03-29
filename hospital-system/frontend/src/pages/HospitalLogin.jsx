import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

const HospitalLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const res = await API.post("/hospital/login", { email, password });
        
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", "hospital");

        alert("Login Successful");
        navigate("/dashboard");
    } catch (err) {
        alert(err.response?.data?.message || "Login Failed");
    }
    };

    return (
    <>
        <Navbar />
        <div style={{ 
        display: "flex", justifyContent: "center", alignItems: "center", 
        height: "80vh", backgroundColor: "#f0f2f5" 
        }}>
        <div style={{ 
            backgroundColor: "white", padding: "40px", borderRadius: "10px", 
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)", width: "350px", textAlign: "center" 
        }}>
            <h2 style={{ color: "#333", marginBottom: "20px" }}>Login</h2>
            <form onSubmit={handleLogin}>
            <input
                type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                style={inputStyle}
            />
            <input
                type="password" placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                style={inputStyle}
            />
            <button type="submit" style={buttonStyle}>Login</button>
            </form>
            <p style={{ marginTop: "15px", fontSize: "14px" }}>
            Don't have an account? <Link to="/register" style={{ color: "#2c6bed" }}>Register</Link>
            </p>
        </div>
        </div>
    </>
    );
};

const inputStyle = {
    width: "100%", padding: "12px", margin: "10px 0",
    border: "1px solid #ddd", borderRadius: "5px", boxSizing: "border-box"
};

const buttonStyle = {
    width: "100%", padding: "12px", backgroundColor: "#2c6bed",
    color: "white", border: "none", borderRadius: "5px",
    cursor: "pointer", fontSize: "16px", marginTop: "10px"
};

export default HospitalLogin;
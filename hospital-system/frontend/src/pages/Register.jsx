import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../services/api";

const Register = () => {
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "hospital" });
    
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
            alert("⚠️ Error: You must use a @gmail.com address to create an account.");
            return;
        }
        
        const path = formData.role === "hospital" ? "/hospital/register" : "/patient/register";
        
        try {
            await API.post(path, formData);
            alert("Registration Successful! Please Login.");
            
            navigate("/hospital-login"); 
            
        } catch (err) {
            alert("Registration Failed: " + (err.response?.data?.error || "Server error"));
        }
    };

    const inputStyle = {
        width: "100%", padding: "12px", margin: "10px 0",
        border: "1px solid #ddd", borderRadius: "5px", boxSizing: "border-box"
    };

    return (
    <>
        <Navbar />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", backgroundColor: "#f0f2f5" }}>
        <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", width: "350px", textAlign: "center" }}>
            <h2 style={{ marginBottom: "20px" }}>Register</h2>
            <form onSubmit={handleRegister}>
                <input 
                    type="text" 
                    placeholder="Full Name" 
                    style={inputStyle} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                />
                <input 
                    type="email" 
                    placeholder="Email" 
                    style={inputStyle} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    pattern=".+@gmail\.com" // <-- Added HTML5 validation!
                    title="Please provide a valid @gmail.com address"
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    style={inputStyle} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    required 
                />
                <button type="submit" style={{ width: "100%", padding: "12px", backgroundColor: "#2c6bed", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px", marginTop: "10px" }}>
                    Register
                </button>
            </form>
        </div>
        </div>
    </>
    );
};

export default Register;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AdminDashboard = () => {
  const [hospitals, setHospitals] = useState([]);
  const navigate = useNavigate();

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin-login");
        return;
      }

      const res = await API.get("/admin/hospitals", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setHospitals(res.data);
    } catch (err) {
      console.log("Failed to fetch hospitals:", err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin-login");
  };

  const handleDeleteHospital = async (id, name) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to completely delete ${name}? This cannot be undone.`)) return;
    
    try {
      const token = localStorage.getItem("adminToken");
      await API.delete(`/admin/hospital/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert("Hospital deleted successfully.");
      fetchHospitals(); 
    } catch (err) {
      alert("Failed to delete hospital.");
    }
  };

  
    // Add 'async' right here! 👇
  const handleViewHospital = async (id, name) => {
    console.log("Trying to impersonate Hospital ID:", id); 
    try {
      const adminToken = localStorage.getItem("adminToken");
      
      const res = await API.get(`/admin/impersonate/${id}`, { 
        headers: { Authorization: `Bearer ${adminToken}` } 
      });

      // ... rest of the code

      // Save it as the regular "token" (This is what HospitalDashboard looks for!)
      localStorage.setItem("token", res.data.token);
      
      alert(`Accessing ${name}'s Command Center...`);
      
      // Teleport the admin to the hospital dashboard!
      // NOTE: Change "/dashboard" if your hospital route is named something else!
      navigate("/dashboard"); 
      
    }  catch (err) {
      // This will now show the EXACT error coming from the backend!
      alert("Error: " + (err.response?.data?.error || err.response?.data?.message || err.message));
      console.log(err);
    }
  };

  return (
    <div style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
      {/* Admin Navbar */}
      <div style={{ backgroundColor: "#1a1a2e", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
        <h2 style={{ margin: 0 }}>🛡️Admin Control Panel</h2>
        <button onClick={handleLogout} style={btnDanger}>Logout</button>
      </div>

      <div style={{ padding: "30px" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
          <div style={statCardStyle}>
            <h3 style={{ margin: 0, color: "#1a1a2e", fontSize: "36px" }}>{hospitals.length}</h3>
            <p style={{ margin: 0, color: "#666", fontWeight: "bold" }}>Total Registered Hospitals</p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: 0, color: "#2e7d32", fontSize: "36px" }}>100%</h3>
            <p style={{ margin: 0, color: "#666", fontWeight: "bold" }}>System Uptime</p>
          </div>
        </div>

        {/* Hospital Management Table */}
        <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <h3 style={{ marginTop: 0, borderBottom: "2px solid #eee", paddingBottom: "15px" }}>Hospital Management Directory</h3>
          
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa", textAlign: "left" }}>
                <th style={thStyle}>Hospital Name</th>
                <th style={thStyle}>System Email</th>
                <th style={thStyle}>Registered Date</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px", color: "#666" }}>No hospitals registered in the system.</td></tr>
              ) : (
                hospitals.map(hospital => (
                  <tr key={hospital._id} style={{ borderBottom: "1px solid #eee" }}>
                   {/* Replace the existing Hospital Name <td> with this: */}
                    <td 
                      style={{ ...tdStyle, color: "#2c6bed", cursor: "pointer", textDecoration: "underline" }} 
                      onClick={() => handleViewHospital(hospital._id, hospital.name)}
                    >
                      <strong>{hospital.name}</strong>
                    </td>
                    <td style={tdStyle}>{hospital.email}</td>
                    <td style={tdStyle}>{new Date(hospital.createdAt || Date.now()).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <button onClick={() => handleDeleteHospital(hospital._id, hospital.name)} style={btnDanger}>
                        🗑️ Revoke Access
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const btnDanger = { backgroundColor: "#d32f2f", color: "white", padding: "8px 15px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" };
const statCardStyle = { backgroundColor: "white", padding: "20px 30px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", minWidth: "200px" };
const thStyle = { padding: "15px", borderBottom: "2px solid #ddd", color: "#444" };
const tdStyle = { padding: "15px", color: "#333" };

export default AdminDashboard;
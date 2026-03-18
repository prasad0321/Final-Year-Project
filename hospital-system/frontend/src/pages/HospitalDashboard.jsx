import { useEffect, useState } from "react";
import API from "../services/api";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";

const HospitalDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]); 
  const [doctors, setDoctors] = useState([]);
  const [activeTab, setActiveTab] = useState("queue"); 
  const token = localStorage.getItem("token");

  // --- MODAL STATES ---
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ name: "", specialization: "", experience: "", consultationFee: "" });

  const [resources, setResources] = useState({ AvailableBeds: 0, AvailableEmergencyBeds: 0, AvailableVentilators: 0, AvailableICUBeds: 0 });
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm] = useState({ ...resources });

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ patientName: "", mobile: "", doctorId: "", emergency: false });

  // --- NEW GALLERY STATES ---
  const [photos, setPhotos] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // --- FETCH DATA ---
  const fetchQueue = async () => {
    try {
      const res = await API.get("/appointment/queue", { headers: { Authorization: `Bearer ${token}` } });
      setQueue(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchHistory = async () => {
    try {
      const res = await API.get("/appointment/completed", { headers: { Authorization: `Bearer ${token}` } });
      setHistory(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchDoctors = async () => {
    try {
      const res = await API.get("/doctor", { headers: { Authorization: `Bearer ${token}` } });
      setDoctors(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchResources = async () => {
    try {
      const res = await API.get("/hospital/resources", { headers: { Authorization: `Bearer ${token}` } });
      if (res.data) {
        setResources(res.data);
        // If your backend sends photos attached to the hospital/resources object, grab them!
        if (res.data.photos) setPhotos(res.data.photos); 
      }
    } catch (err) { console.log(err); }
  };

const fetchPhotos = async () => {
    try {
      const res = await API.get("/upload/hospital-photo", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setPhotos(res.data.photos || []);
    } catch (err) { 
      console.log("Failed to fetch photos:", err); 
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchHistory();
    fetchDoctors();
    fetchResources();
    fetchPhotos();
    
    const socket = io("http://localhost:5000");
    socket.on("queueUpdated", () => {
      fetchQueue();
      fetchHistory(); 
    });
    return () => socket.disconnect();
  }, []);

  // --- ACTIONS ---
  const handleComplete = async (id) => {
    try {
      await API.put(`/appointment/complete/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.log(err); }
  };

  const handleCancel = async (id) => {
    try {
      await API.put(`/appointment/cancel/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.log(err); }
  };

  const handleWalkInBook = async (e) => {
    e.preventDefault();
    try {
      await API.post("/appointment/hospital-book", walkInForm, { headers: { Authorization: `Bearer ${token}` } });
      setShowWalkInModal(false);
      setWalkInForm({ patientName: "", mobile: "", doctorId: "", emergency: false });
      alert("Walk-in Appointment Booked!");
    } catch (err) { alert("Failed to book: " + (err.response?.data?.error || err.message)); }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`⚠️ Are you sure you want to remove Dr. ${name}?`)) return;
    try {
      await API.delete(`/doctor/remove/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      alert("Doctor removed successfully!");
      fetchDoctors(); 
    } catch (err) { console.log(err); }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await API.post("/doctor/add", doctorForm, { headers: { Authorization: `Bearer ${token}` } });
      setShowDoctorModal(false); 
      setDoctorForm({ name: "", specialization: "", experience: "", consultationFee: "" });
      fetchDoctors(); 
      alert("Doctor added successfully!");
    } catch (err) { alert(err.response?.data?.message || "Failed to add doctor"); }
  };

  const handleUpdateResources = async (e) => {
    e.preventDefault();
    try {
      await API.put("/hospital/resources", resourceForm, { headers: { Authorization: `Bearer ${token}` } });
      setShowResourceModal(false);
      fetchResources(); 
      alert("Resources updated successfully!");
    } catch (err) { alert("Failed to update resources"); }
  };

// --- REMOVE PHOTO ACTION ---
  const handleDeletePhoto = async (photoUrl) => {
    if (!window.confirm("⚠️ Are you sure you want to permanently remove this photo?")) return;
    
    try {
      // Axios requires 'data' when sending a body in a DELETE request
      const res = await API.delete("/upload/hospital-photo", {
        headers: { Authorization: `Bearer ${token}` },
        data: { photoUrl: photoUrl } 
      });
      
      setPhotos(res.data.photos); // Instantly updates the grid to remove the photo!
      alert("Photo removed successfully!");
    } catch (err) {
      alert("Failed to remove photo.");
      console.log(err);
    }
  };

  // --- NEW: UPLOAD PHOTO ACTION ---
  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Please select an image to upload.");

    const formData = new FormData();
    formData.append("image", imageFile); // "image" matches the upload.single("image") in backend

    setUploading(true);
    try {
      // Send as multipart/form-data so the backend knows it's a file!
      const res = await API.post("/upload/hospital-photo", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      setPhotos(res.data.photos); // Update the gallery with the new array of photos
      setImageFile(null); // Clear the file input
      alert("Photo successfully added to your gallery!");
    } catch (err) {
      // This will now show the EXACT error coming from the backend!
      alert("Upload Error: " + (err.response?.data?.error || err.response?.data?.message || err.message));
      console.log(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: "30px", backgroundColor: "#f0f2f5", minHeight: "90vh", position: "relative" }}>
        
        {/* --- DASHBOARD HEADER --- */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#333", margin: 0 }}>Command Center</h2>
          <div style={{ display: "flex", gap: "15px" }}>
            <StatBadge label="Total Waiting" value={queue.length} color="#2c6bed" />
            <StatBadge label="Patients Seen" value={history.length} color="#2e7d32" /> 
            <StatBadge label="Emergency Beds" value={resources.AvailableEmergencyBeds} color="#d32f2f" />
          </div>
        </div>

        {/* --- TAB NAVIGATION --- */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #ddd", paddingBottom: "10px", overflowX: "auto" }}>
          <TabButton active={activeTab === "queue"} onClick={() => setActiveTab("queue")} label="📋 Live Queue" />
          <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} label="✅ History" /> 
          <TabButton active={activeTab === "doctors"} onClick={() => setActiveTab("doctors")} label="👨‍⚕️ Doctors" />
          <TabButton active={activeTab === "resources"} onClick={() => setActiveTab("resources")} label="🛏️ Resources" />
          <TabButton active={activeTab === "gallery"} onClick={() => setActiveTab("gallery")} label="📸 Gallery" /> {/* <-- NEW TAB */}
        </div>

        {/* --- TAB 1: LIVE QUEUE --- */}
        {activeTab === "queue" && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>Live Patient Queue</h3>
              <button style={btnPrimary} onClick={() => setShowWalkInModal(true)}>➕ Book Walk-in</button>
            </div>
            {queue.length === 0 ? <p>No patients currently waiting.</p> : (
              <div style={{ display: "grid", gap: "15px" }}>
                {queue.map((item) => (
                  <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", border: "1px solid #eee", borderRadius: "8px", backgroundColor: item.emergency ? "#fff1f1" : "white" }}>
                    <div>
                      {item.emergency && <span style={{ color: "red", fontWeight: "bold", fontSize: "12px" }}>🚨 EMERGENCY</span>}
                      <h4 style={{ margin: "5px 0", color: "#2c6bed" }}>Queue #{item.queueNumber}</h4>
                      <p style={{ margin: 0 }}><strong>Patient:</strong> {item.patient?.name} | <strong>Doctor:</strong> {item.doctor?.name}</p>
                    </div>
                    <div>
                      <button onClick={() => handleComplete(item._id)} style={btnSuccess}>Complete</button>
                      <button onClick={() => handleCancel(item._id)} style={btnDanger}>Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: HISTORY --- */}
        {activeTab === "history" && (
          <div style={cardStyle}>
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#2e7d32" }}>Completed Appointments</h3>
              <p style={{ color: "#666", fontSize: "14px", margin: "5px 0 0 0" }}>Log of all successfully treated patients.</p>
            </div>
            {history.length === 0 ? <p>No completed appointments yet.</p> : (
              <div style={{ display: "grid", gap: "15px" }}>
                {history.map((item) => (
                  <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", border: "1px solid #e0e0e0", borderRadius: "8px", backgroundColor: "#f9fcf9" }}>
                    <div>
                      <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>{item.patient?.name}</h4>
                      <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
                        Treated by: <strong>{item.doctor?.name}</strong>
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "5px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>✅ Completed</span>
                      <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#888" }}>{new Date(item.appointmentDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: DOCTORS --- */}
        {activeTab === "doctors" && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>Doctor Management</h3>
              <button style={btnPrimary} onClick={() => setShowDoctorModal(true)}>+ Add Doctor</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa", textAlign: "left" }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Specialization</th>
                  <th style={thStyle}>Experience</th>
                  <th style={thStyle}>Fee</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#666" }}>No doctors found.</td></tr>
                ) : (
                  doctors.map(doc => (
                    <tr key={doc._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={tdStyle}><strong>{doc.name}</strong></td>
                      <td style={tdStyle}>{doc.specialization}</td>
                      <td style={tdStyle}>{doc.experience} Years</td>
                      <td style={tdStyle}>₹{doc.consultationFee}</td>
                      <td style={tdStyle}>
                        <button onClick={() => handleDeleteDoctor(doc._id, doc.name)} style={{...btnDanger, padding: "5px 10px", fontSize: "12px"}}>🗑️ Remove</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TAB 4: RESOURCES --- */}
        {activeTab === "resources" && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>Hospital Resources Overview</h3>
              <button style={btnPrimary} onClick={() => { setResourceForm(resources); setShowResourceModal(true); }}>⚙️ Update Resources</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <ResourceBox title="Available Beds" value={resources.AvailableBeds} icon="✅" />
              <ResourceBox title="Emergency Beds" value={resources.AvailableEmergencyBeds} icon="🚨" />
              <ResourceBox title="ICU Beds" value={resources.AvailableICUBeds} icon="🏥" />
              <ResourceBox title="Ventilators" value={resources.AvailableVentilators} icon="🫁" />
            </div>
          </div>
        )}

        {/* --- TAB 5: GALLERY (NEW!) --- */}
        {activeTab === "gallery" && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #eee", paddingBottom: "15px" }}>
              <div>
                <h3 style={{ margin: 0 }}>Hospital Photo Gallery</h3>
                <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>These photos will be displayed on the Patient Mobile App.</p>
              </div>
              
              {/* UPLOAD FORM */}
              <form onSubmit={handlePhotoUpload} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "5px", backgroundColor: "#f9f9f9" }}
                />
                <button type="submit" style={btnPrimary} disabled={uploading}>
                  {uploading ? "⏳ Uploading..." : "⬆️ Upload Photo"}
                </button>
              </form>
            </div>

            {/* PHOTO GRID */}
            {/* PHOTO GRID */}
            {(!photos || photos.length === 0) ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#888", backgroundColor: "#f9fcf9", borderRadius: "8px", border: "1px dashed #ccc" }}>
                <span style={{ fontSize: "40px" }}>📷</span>
                <p>No photos uploaded yet. Add some to build trust with your patients!</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
                {photos?.map((url, index) => (
                  <div key={index} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", border: "1px solid #eee", aspectRatio: "4/3" }}>
                    
                    {/* The Image */}
                    <img src={url} alt={`Hospital view ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    
                    {/* The Floating Delete Button */}
                    <button 
                      onClick={() => handleDeletePhoto(url)}
                      style={{ 
                        position: "absolute", top: "10px", right: "10px", 
                        backgroundColor: "rgba(211, 47, 47, 0.9)", color: "white", 
                        border: "none", borderRadius: "50%", width: "30px", height: "30px", 
                        cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", 
                        fontSize: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.3)", transition: "0.2s"
                      }}
                      title="Remove Photo"
                    >
                      ❌
                    </button>
                    
                  </div>
                ))}
              </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- MODALS (Unchanged) --- */}
      {showWalkInModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>Book Walk-in Patient</h3>
            <form onSubmit={handleWalkInBook}>
              <label style={labelStyle}>Patient Name</label>
              <input type="text" required style={inputStyle} value={walkInForm.patientName} onChange={(e) => setWalkInForm({...walkInForm, patientName: e.target.value})} />
              <label style={labelStyle}>Mobile Number</label>
              <input type="text" required style={inputStyle} value={walkInForm.mobile} onChange={(e) => setWalkInForm({...walkInForm, mobile: e.target.value})} />
              <label style={labelStyle}>Assign Doctor</label>
              <select required style={inputStyle} value={walkInForm.doctorId} onChange={(e) => setWalkInForm({...walkInForm, doctorId: e.target.value})}>
                <option value="">-- Select Doctor --</option>
                {doctors.map(doc => <option key={doc._id} value={doc._id}>{doc.name}</option>)}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", marginBottom: "20px", fontWeight: "bold", color: "#d32f2f" }}>
                <input type="checkbox" checked={walkInForm.emergency} onChange={(e) => setWalkInForm({...walkInForm, emergency: e.target.checked})} /> 🚨 Mark Emergency
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" style={{ ...btnSuccess, width: "100%" }}>Book Patient</button>
                <button type="button" onClick={() => setShowWalkInModal(false)} style={{ ...btnDanger, width: "100%" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDoctorModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>Add New Doctor</h3>
            <form onSubmit={handleAddDoctor}>
              <input type="text" placeholder="Name" required style={inputStyle} value={doctorForm.name} onChange={(e) => setDoctorForm({...doctorForm, name: e.target.value})} />
              <input type="text" placeholder="Specialization" required style={inputStyle} value={doctorForm.specialization} onChange={(e) => setDoctorForm({...doctorForm, specialization: e.target.value})} />
              <input type="number" placeholder="Experience" required style={inputStyle} value={doctorForm.experience} onChange={(e) => setDoctorForm({...doctorForm, experience: e.target.value})} />
              <input type="number" placeholder="Fee" required style={inputStyle} value={doctorForm.consultationFee} onChange={(e) => setDoctorForm({...doctorForm, consultationFee: e.target.value})} />
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" style={{ ...btnPrimary, width: "100%" }}>Save</button>
                <button type="button" onClick={() => setShowDoctorModal(false)} style={{ ...btnDanger, width: "100%" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResourceModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>Update Resources</h3>
            <form onSubmit={handleUpdateResources}>
              <label style={labelStyle}>Available Beds</label>
              <input type="number" required style={inputStyle} value={resourceForm.AvailableBeds} onChange={(e) => setResourceForm({...resourceForm, AvailableBeds: e.target.value})} />
              <label style={labelStyle}>Emergency Beds</label>
              <input type="number" required style={inputStyle} value={resourceForm.AvailableEmergencyBeds} onChange={(e) => setResourceForm({...resourceForm, AvailableEmergencyBeds: e.target.value})} />
              <label style={labelStyle}>ICU Beds</label>
              <input type="number" required style={inputStyle} value={resourceForm.AvailableICUBeds} onChange={(e) => setResourceForm({...resourceForm, AvailableICUBeds: e.target.value})} />
              <label style={labelStyle}>Ventilators</label>
              <input type="number" required style={inputStyle} value={resourceForm.AvailableVentilators} onChange={(e) => setResourceForm({...resourceForm, AvailableVentilators: e.target.value})} />
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" style={{ ...btnSuccess, width: "100%" }}>Save</button>
                <button type="button" onClick={() => setShowResourceModal(false)} style={{ ...btnDanger, width: "100%" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// --- STYLES & COMPONENTS ---
const StatBadge = ({ label, value, color }) => (
  <div style={{ backgroundColor: "white", borderLeft: `5px solid ${color}`, padding: "10px 20px", borderRadius: "5px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
    <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>{label}</p>
    <h3 style={{ margin: 0, color: color }}>{value || 0}</h3>
  </div>
);

const TabButton = ({ active, onClick, label }) => (
  <button onClick={onClick} style={{ padding: "10px 20px", border: "none", backgroundColor: active ? "#2c6bed" : "transparent", color: active ? "white" : "#555", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", transition: "0.2s", whiteSpace: "nowrap" }}>
    {label}
  </button>
);

const ResourceBox = ({ title, value, icon }) => (
  <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px", textAlign: "center", border: "1px solid #eee" }}>
    <div style={{ fontSize: "30px", marginBottom: "10px" }}>{icon}</div>
    <h2 style={{ margin: "0 0 5px 0", color: "#333" }}>{value || 0}</h2>
    <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>{title}</p>
  </div>
);

const cardStyle = { backgroundColor: "white", padding: "25px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" };
const thStyle = { padding: "15px", borderBottom: "2px solid #eee", color: "#555" };
const tdStyle = { padding: "15px", color: "#333" };
const inputStyle = { width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" };
const labelStyle = { fontSize: "12px", fontWeight: "bold", color: "#555", display: "block", marginBottom: "5px" };

const btnSuccess = { backgroundColor: "#2e7d32", color: "white", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer", marginRight: "10px" };
const btnDanger = { backgroundColor: "#d32f2f", color: "white", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer" };
const btnPrimary = { backgroundColor: "#2c6bed", color: "white", padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" };

const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "400px", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" };

export default HospitalDashboard;
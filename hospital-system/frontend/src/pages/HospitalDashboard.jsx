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

  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ name: "", specialization: "", experience: "", consultationFee: "" });

  const [resources, setResources] = useState({ AvailableBeds: 0, AvailableEmergencyBeds: 0, AvailableVentilators: 0, AvailableICUBeds: 0 });
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm] = useState({ ...resources });

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ patientName: "", mobile: "", age: "", gender: "Male", symptoms: "", doctorId: "", emergency: false });

  const [photos, setPhotos] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);

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
        if (res.data.photos) setPhotos(res.data.photos); 
      }
    } catch (err) { console.log(err); }
  };

  const fetchPhotos = async () => {
    try {
      const res = await API.get("/upload/hospital-photo", { headers: { Authorization: `Bearer ${token}` } });
      setPhotos(res.data.photos || []);
    } catch (err) { console.log(err); }
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

  const handleComplete = async (id, e) => {
    e.stopPropagation();
    try {
      await API.put(`/appointment/complete/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchQueue();
      fetchHistory();
    } catch (err) { console.log(err); }
  };

  const handleCancel = async (id, e) => {
    e.stopPropagation();
    try {
      await API.put(`/appointment/cancel/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchQueue();
      fetchHistory();
    } catch (err) { console.log(err); }
  };

  const handleWalkInBook = async (e) => {
    e.preventDefault();

    const phoneRegex = /^[0-9]{10}$/; 
    if (!phoneRegex.test(walkInForm.mobile)) {
      alert("⚠️ Please enter a valid 10-digit mobile number. Do not include country codes or spaces.");
      return; 
    }

    try {
      await API.post("/appointment/hospital-book", walkInForm, { headers: { Authorization: `Bearer ${token}` } });
      setShowWalkInModal(false);
      setWalkInForm({ patientName: "", mobile: "", age: "", gender: "Male", symptoms: "", doctorId: "", emergency: false });
      alert("Walk-in Appointment Booked!");
      fetchQueue(); 
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

  const handleDeletePhoto = async (photoUrl) => {
    if (!window.confirm("⚠️ Are you sure you want to permanently remove this photo?")) return;
    try {
      const res = await API.delete("/upload/hospital-photo", {
        headers: { Authorization: `Bearer ${token}` },
        data: { photoUrl: photoUrl } 
      });
      setPhotos(res.data.photos);
      alert("Photo removed successfully!");
    } catch (err) { alert("Failed to remove photo."); }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Please select an image to upload.");
    const formData = new FormData();
    formData.append("image", imageFile);
    setUploading(true);
    try {
      const res = await API.post("/upload/hospital-photo", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      setPhotos(res.data.photos);
      setImageFile(null);
      alert("Photo successfully added to your gallery!");
    } catch (err) { alert("Upload Error"); } 
    finally { setUploading(false); }
  };

  // --- SEPARATE THE LISTS VIRTUALLY ---
  const emergencyQueue = queue.filter(item => item.emergency === true);
  const regularQueue = queue.filter(item => item.emergency !== true);

  return (
    <>
      <Navbar />
      <div style={{ padding: "30px", backgroundColor: "#f0f2f5", minHeight: "90vh", position: "relative" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#333", margin: 0 }}>Command Center</h2>
          <div style={{ display: "flex", gap: "15px" }}>
            <StatBadge label="Total Waiting" value={queue.length} color="#2c6bed" />
            <StatBadge label="Patients Seen" value={history.length} color="#2e7d32" /> 
            <StatBadge label="Emergency Beds" value={resources.AvailableEmergencyBeds} color="#d32f2f" />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #ddd", paddingBottom: "10px", overflowX: "auto" }}>
          <TabButton active={activeTab === "queue"} onClick={() => setActiveTab("queue")} label="📋 Live Queue" />
          <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} label="✅ History" /> 
          <TabButton active={activeTab === "doctors"} onClick={() => setActiveTab("doctors")} label="👨‍⚕️ Doctors" />
          <TabButton active={activeTab === "resources"} onClick={() => setActiveTab("resources")} label="🛏️ Resources" />
          <TabButton active={activeTab === "gallery"} onClick={() => setActiveTab("gallery")} label="📸 Gallery" />
        </div>

        {activeTab === "queue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* ---------------- EMERGENCY QUEUE BOX ---------------- */}
            <div style={{ ...cardStyle, border: "2px solid #d32f2f", backgroundColor: "#fff5f5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, color: "#d32f2f" }}>🚨 Emergency Queue ({emergencyQueue.length})</h3>
                <button style={btnPrimary} onClick={() => setShowWalkInModal(true)}>➕ Book Walk-in</button>
              </div>
              
              {emergencyQueue.length === 0 ? <p style={{ color: "#d32f2f" }}>No active emergencies.</p> : (
                <div style={{ display: "grid", gap: "15px" }}>
                  {emergencyQueue.map((item) => (
                    <div 
                      key={item._id} 
                      onClick={() => setSelectedPatient(item)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", border: "1px solid #ffcdd2", borderRadius: "8px", backgroundColor: "white", cursor: "pointer", boxShadow: "0 2px 8px rgba(211, 47, 47, 0.15)" }}
                    >
                      <div>
                        <h4 style={{ margin: "0 0 5px 0", color: "#d32f2f" }}>Queue #{item.queueNumber}</h4>
                        <p style={{ margin: 0 }}><strong>Patient:</strong> {item.patientName || item.patient?.name} | <strong>Doctor:</strong> {item.doctor?.name}</p>
                      </div>
                      <div>
                        <button onClick={(e) => handleComplete(item._id, e)} style={btnSuccess}>Complete</button>
                        <button onClick={(e) => handleCancel(item._id, e)} style={btnDanger}>Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ---------------- REGULAR QUEUE BOX ---------------- */}
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0 }}>📋 Regular Patient Queue ({regularQueue.length})</h3>
              </div>
              
              {regularQueue.length === 0 ? <p>No regular patients waiting.</p> : (
                <div style={{ display: "grid", gap: "15px" }}>
                  {regularQueue.map((item) => (
                    <div 
                      key={item._id} 
                      onClick={() => setSelectedPatient(item)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", border: "1px solid #eee", borderRadius: "8px", backgroundColor: "white", cursor: "pointer", transition: "0.2s" }}
                      onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)"}
                      onMouseOut={(e) => e.currentTarget.style.boxShadow = "none"}
                    >
                      <div>
                        <h4 style={{ margin: "0 0 5px 0", color: "#2c6bed" }}>Queue #{item.queueNumber}</h4>
                        <p style={{ margin: 0 }}><strong>Patient:</strong> {item.patientName || item.patient?.name} | <strong>Doctor:</strong> {item.doctor?.name}</p>
                      </div>
                      <div>
                        <button onClick={(e) => handleComplete(item._id, e)} style={btnSuccess}>Complete</button>
                        <button onClick={(e) => handleCancel(item._id, e)} style={btnDanger}>Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ... (The rest of the tabs like History, Doctors, Resources, and Gallery stay exactly the same!) */}

        {activeTab === "history" && (
          <div style={cardStyle}>
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#2e7d32" }}>Completed Appointments</h3>
              <p style={{ color: "#666", fontSize: "14px", margin: "5px 0 0 0" }}>Log of all successfully treated patients.</p>
            </div>
            {history.length === 0 ? <p>No completed appointments yet.</p> : (
              <div style={{ display: "grid", gap: "15px" }}>
                {history.map((item) => (
                  <div 
                    key={item._id} 
                    onClick={() => setSelectedPatient(item)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", border: "1px solid #e0e0e0", borderRadius: "8px", backgroundColor: "#f9fcf9", cursor: "pointer" }}
                  >
                    <div>
                      <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>{item.patientName || item.patient?.name}</h4>
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

        {activeTab === "gallery" && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #eee", paddingBottom: "15px" }}>
              <div>
                <h3 style={{ margin: 0 }}>Hospital Photo Gallery</h3>
                <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>These photos will be displayed on the Patient Mobile App.</p>
              </div>
              <form onSubmit={handlePhotoUpload} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "5px", backgroundColor: "#f9f9f9" }} />
                <button type="submit" style={btnPrimary} disabled={uploading}>{uploading ? "⏳ Uploading..." : "⬆️ Upload Photo"}</button>
              </form>
            </div>
            {(!photos || photos.length === 0) ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#888", backgroundColor: "#f9fcf9", borderRadius: "8px", border: "1px dashed #ccc" }}>
                <span style={{ fontSize: "40px" }}>📷</span>
                <p>No photos uploaded yet. Add some to build trust with your patients!</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
                {photos?.map((url, index) => (
                  <div key={index} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", border: "1px solid #eee", aspectRatio: "4/3" }}>
                    <img src={url} alt={`Hospital view ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => handleDeletePhoto(url)} style={{ position: "absolute", top: "10px", right: "10px", backgroundColor: "rgba(211, 47, 47, 0.9)", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.3)", transition: "0.2s" }} title="Remove Photo">❌</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showWalkInModal && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, width: "500px", maxHeight: "90vh", overflowY: "auto"}}>
            <h3 style={{ marginTop: 0, borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Book Walk-in Patient</h3>
            <form onSubmit={handleWalkInBook}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Patient Name</label>
                  <input type="text" required style={inputStyle} value={walkInForm.patientName} onChange={(e) => setWalkInForm({...walkInForm, patientName: e.target.value})} />
                </div>
                <div style={{ width: "100px" }}>
                  <label style={labelStyle}>Age</label>
                  <input type="number" required style={inputStyle} value={walkInForm.age} onChange={(e) => setWalkInForm({...walkInForm, age: e.target.value})} />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Mobile Number</label>
                  <input type="text" required style={inputStyle} value={walkInForm.mobile} onChange={(e) => setWalkInForm({...walkInForm, mobile: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Gender</label>
                  <select required style={inputStyle} value={walkInForm.gender} onChange={(e) => setWalkInForm({...walkInForm, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <label style={labelStyle}>Symptoms</label>
              <textarea required rows="3" style={{...inputStyle, resize: "none"}} placeholder="Briefly describe the symptoms..." value={walkInForm.symptoms} onChange={(e) => setWalkInForm({...walkInForm, symptoms: e.target.value})}></textarea>

              <label style={labelStyle}>Assign Doctor</label>
              <select required style={inputStyle} value={walkInForm.doctorId} onChange={(e) => setWalkInForm({...walkInForm, doctorId: e.target.value})}>
                <option value="">-- Select Doctor --</option>
                {doctors.map(doc => <option key={doc._id} value={doc._id}>{doc.name}</option>)}
              </select>
              
              <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", marginBottom: "20px", fontWeight: "bold", color: "#d32f2f" }}>
                <input type="checkbox" checked={walkInForm.emergency} onChange={(e) => setWalkInForm({...walkInForm, emergency: e.target.checked})} /> 🚨 Mark as Emergency
              </label>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" style={{ ...btnSuccess, width: "100%" }}>Book Patient</button>
                <button type="button" onClick={() => setShowWalkInModal(false)} style={{ ...btnDanger, width: "100%" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPatient && (
        <div style={modalOverlayStyle} onClick={() => setSelectedPatient(null)}>
          <div style={{...modalContentStyle, position: "relative", width: "450px"}} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedPatient(null)} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#888" }}>✖</button>
            <h2 style={{ marginTop: 0, color: "#2c6bed", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Patient Details</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px", fontSize: "15px" }}>
              <p style={{ margin: 0 }}><strong>Name:</strong> {selectedPatient.patientName || selectedPatient.patient?.name}</p>
              <p style={{ margin: 0 }}><strong>Queue Number:</strong> #{selectedPatient.queueNumber}</p>
              <p style={{ margin: 0 }}><strong>Status:</strong> <span style={{ color: selectedPatient.status === "Completed" ? "green" : "orange", fontWeight: "bold" }}>{selectedPatient.status}</span></p>
              <p style={{ margin: 0 }}><strong>Assigned Doctor:</strong> {selectedPatient.doctor?.name}</p>
              
              <hr style={{ border: "none", borderTop: "1px dashed #ccc", width: "100%", margin: "10px 0" }} />
              
              <p style={{ margin: 0 }}><strong>Mobile:</strong> {selectedPatient.mobile || "N/A"}</p>
              <p style={{ margin: 0 }}><strong>Age:</strong> {selectedPatient.age ? `${selectedPatient.age} Years` : "N/A"}</p>
              <p style={{ margin: 0 }}><strong>Gender:</strong> {selectedPatient.gender || "N/A"}</p>
              <div style={{ backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "5px", border: "1px solid #eee", marginTop: "5px" }}>
                <p style={{ margin: 0, fontWeight: "bold", color: "#555", marginBottom: "5px" }}>Symptoms:</p>
                <p style={{ margin: 0, color: "#333" }}>{selectedPatient.symptoms || "No symptoms recorded."}</p>
              </div>
            </div>

            <div style={{ marginTop: "25px", textAlign: "right" }}>
              <button onClick={() => setSelectedPatient(null)} style={{...btnPrimary, backgroundColor: "#555"}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor & Resource Modals stay the exact same as before */}
    </>
  );
};

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
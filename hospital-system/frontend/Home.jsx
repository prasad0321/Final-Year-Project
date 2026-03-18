// pages/Home.jsx
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#ffffff",
    fontFamily: "Arial, sans-serif"
    };

    const headerStyle = {
    backgroundColor: "#2c6bed", // Hospital Blue
    width: "100%",
    padding: "20px",
    color: "white",
    textAlign: "center",
    position: "absolute",
    top: 0,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    };

    const cardContainer = {
    display: "flex",
    gap: "30px",
    marginTop: "60px"
    };

    const cardStyle = {
    width: "250px",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    textAlign: "center",
    cursor: "pointer",
    transition: "transform 0.2s",
    border: "2px solid #eef2f7"
    };

    return (
    <div style={containerStyle}>
        <div style={headerStyle}>
        <h1>🏥 Online Hospital Queue System</h1>
        </div>

        <div style={cardContainer}>
        <div style={cardStyle} onClick={() => navigate("/admin-login")}>
            <div style={{ fontSize: "50px" }}>🛡️</div>
            <h3 style={{ color: "#2c6bed" }}>Admin Portal</h3>
            <p style={{ color: "#666" }}>Manage Hospitals & Staff</p>
        </div>

        <div style={cardStyle} onClick={() => navigate("/hospital-login")}>
            <div style={{ fontSize: "50px" }}>🏥</div>
            <h3 style={{ color: "#2c6bed" }}>Hospital Portal</h3>
            <p style={{ color: "#666" }}>Manage Live Patient Queues</p>
        </div>
        </div>
    </div>
    );
};

export default Home;
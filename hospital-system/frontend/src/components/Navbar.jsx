import { Link } from "react-router-dom";

const Navbar = () => {
    return (
    <nav style={{
        backgroundColor: "#2c6bed",
        padding: "15px 50px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
        🏥 Hospital Monitor
        </h2>
        <div style={{ display: "flex", gap: "20px" }}>
        <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>Back to Portal</Link>
        </div>
    </nav>
    );
};

export default Navbar;
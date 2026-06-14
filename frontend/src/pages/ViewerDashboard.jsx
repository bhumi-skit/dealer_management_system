import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const ViewerDashboard = () => {
    const [entries, setEntries] = useState([]);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
 
    useEffect(() => {
        async function fetchEntries() {
            try {
                const response = await API.get("/entrylogs");
                const data = Array.isArray(response.data) ? response.data : [];
                setEntries(data);
            } catch (err) {
                console.error("Failed to fetch entries", err);
                setEntries([]);
            }
        }

        fetchEntries();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login");
    };

    const filtered = entries.filter((e) =>
        e.visitorName.toLowerCase().includes(search.toLowerCase()) ||
        e.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
        e.idCardNumber.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={styles.page}>
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>👁️ Viewer Dashboard</h2>
                <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </div>

            <div style={styles.container}>
                <div style={styles.statsBar}>
                    <div style={styles.statBox}>
                        <span style={styles.statNum}>{entries.length}</span>
                        <span style={styles.statLabel}>My Total Entries</span>
                    </div>
                    <div style={styles.statBox}>
                        <span style={styles.statNum}>
                            {entries.filter(e =>
                                new Date(e.enteredAt).toDateString() === new Date().toDateString()
                            ).length}
                        </span>
                        <span style={styles.statLabel}>My Today's Entries</span>
                    </div>
                </div>

                <div style={styles.card}>
                    <div style={styles.cardTop}>
                        <h3 style={styles.cardTitle}>My Visitor Entries ({filtered.length})</h3>
                        <input
                            type="text"
                            placeholder="Search by name, vehicle, ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    {filtered.length === 0 ? (
                        <p style={{ color: "#888" }}>No entries found.</p>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.tableHeader}>
                                        <th style={styles.th}>Visitor Name</th>
                                        <th style={styles.th}>ID Card</th>
                                        <th style={styles.th}>Vehicle No.</th>
                                        <th style={styles.th}>Entry Time</th>
                                        <th style={styles.th}>Recorded By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((entry, index) => (
                                        <tr key={entry._id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                                            <td style={styles.td}>{entry.visitorName}</td>
                                            <td style={styles.td}>{entry.idCardNumber}</td>
                                            <td style={styles.td}>{entry.vehicleNumber}</td>
                                            <td style={styles.td}>{new Date(entry.enteredAt).toLocaleString()}</td>
                                            <td style={styles.td}>{entry.recordedBy}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: "100vh", backgroundColor: "#f4f6f8", fontFamily: "sans-serif" },
    navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1a1a2e", padding: "14px 24px", color: "#fff" },
    navTitle: { margin: 0, fontSize: "18px" },
    logoutBtn: { padding: "8px 16px", backgroundColor: "#e74c3c", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
    container: { maxWidth: "1100px", margin: "30px auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: "20px" },
    statsBar: { display: "flex", gap: "16px" },
    statBox: { backgroundColor: "#fff", borderRadius: "10px", padding: "16px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "120px" },
    statNum: { fontSize: "28px", fontWeight: "700", color: "#1a1a2e" },
    statLabel: { fontSize: "12px", color: "#888", marginTop: "4px" },
    card: { backgroundColor: "#fff", borderRadius: "10px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" },
    cardTitle: { margin: 0, fontSize: "16px", fontWeight: "600", color: "#1a1a2e" },
    searchInput: { padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px", outline: "none", width: "260px" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
    tableHeader: { backgroundColor: "#1a1a2e", color: "#fff" },
    th: { padding: "10px 14px", textAlign: "left", fontWeight: "500" },
    td: { padding: "10px 14px", color: "#333" },
    trEven: { backgroundColor: "#f9f9f9" },
    trOdd: { backgroundColor: "#fff" },
};

export default ViewerDashboard; 

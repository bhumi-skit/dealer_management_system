import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import GuardianAssistant from "../components/GuardAssistant";

const FlagBadge = ({ severity = "low" }) => {
  const map = {
    low: { bg: "#fff8e1", color: "#8a5e00", label: "Flagged" },
    medium: { bg: "#fff3cd", color: "#9a6700", label: "Flagged" },
    high: { bg: "#fdecea", color: "#c0392b", label: "High Risk" },
  };
  const s = map[severity] || map.low;
  return (
    <span style={{
      padding: "2px 8px", borderRadius: "10px", fontSize: "10px",
      fontWeight: "700", backgroundColor: s.bg, color: s.color,
      display: "inline-block"
    }}>
      {s.label}
    </span>
  );
};

const AdminDashboard = () => {
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uiMessage, setUiMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    try {
      const response = await API.get("/entrylogs");
      setEntries(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch entries", err);
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      await API.delete(`/entrylogs/${id}`);
      setUiMessage({ type: "success", text: "Entry deleted successfully." });
      fetchEntries();
    } catch (err) {
      console.error("Delete entry failed", err);
      setUiMessage({ type: "error", text: "Failed to delete entry." });
    }
  };

  const handleEditClick = (entry) => {
    setEditingId(entry._id);
    setEditForm({
      visitorName: entry.visitorName || "",
      idCardNumber: entry.idCardNumber || "",
      vehicleNumber: entry.vehicleNumber || "",
      enteredAt: entry.enteredAt ? new Date(entry.enteredAt).toISOString().slice(0, 16) : "",
      recordedBy: entry.recordedBy || "",
      phoneNumber: entry.phoneNumber || "",
      countryCode: entry.countryCode || "+91",
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (id) => {
    try {
      await API.put(`/entrylogs/${id}`, editForm);
      setUiMessage({ type: "success", text: "Entry updated successfully." });
      setEditingId(null);
      fetchEntries();
    } catch (err) {
      console.error("Update entry failed", err);
      setUiMessage({ type: "error", text: "Failed to update entry." });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const todayCount = entries.filter(
    (entry) => new Date(entry.enteredAt).toDateString() === new Date().toDateString()
  ).length;
  const insideCount = entries.filter((entry) => entry.status === "INSIDE").length;
  const flaggedCount = entries.filter((entry) => entry.isFlagged).length;

  return (
    <div style={styles.page}>
      <div style={styles.navbar}>
        <h2 style={styles.navTitle}>Admin Dashboard</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={styles.container}>
        <div style={styles.statsBar}>
          <StatBox value={entries.length} label="Total Entries" />
          <StatBox value={todayCount} label="Today's Entries" />
          <StatBox value={insideCount} label="Currently Inside" />
          {flaggedCount > 0 && <StatBox value={flaggedCount} label="Flagged" valueColor="#c0392b" />}
        </div>

        {uiMessage.text && (
          <p style={{ color: uiMessage.type === "error" ? "red" : "green", margin: 0 }}>
            {uiMessage.text}
          </p>
        )}

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>All Visitor Entries ({entries.length})</h3>

          {entries.length === 0 ? (
            <p style={{ color: "#888" }}>No entries found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Visitor Name</th>
                    <th style={styles.th}>ID Card</th>
                    <th style={styles.th}>Vehicle No.</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Entry Time</th>
                    <th style={styles.th}>Recorded By</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry._id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                      {editingId === entry._id ? (
                        <>
                          <td style={styles.td}>
                            <input name="visitorName" value={editForm.visitorName} onChange={handleEditChange} style={styles.inlineInput} />
                          </td>
                          <td style={styles.td}>
                            <input name="idCardNumber" value={editForm.idCardNumber} onChange={handleEditChange} style={styles.inlineInput} />
                          </td>
                          <td style={styles.td}>
                            <input name="vehicleNumber" value={editForm.vehicleNumber} onChange={handleEditChange} style={styles.inlineInput} />
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <input name="countryCode" value={editForm.countryCode} onChange={handleEditChange} style={{ ...styles.inlineInput, width: "64px" }} />
                              <input name="phoneNumber" value={editForm.phoneNumber} onChange={handleEditChange} style={styles.inlineInput} />
                            </div>
                          </td>
                          <td style={styles.td}>
                            <input type="datetime-local" name="enteredAt" value={editForm.enteredAt} onChange={handleEditChange} style={styles.inlineInput} />
                          </td>
                          <td style={styles.td}>
                            <input name="recordedBy" value={editForm.recordedBy} onChange={handleEditChange} style={styles.inlineInput} />
                          </td>
                          <td style={styles.td}>{entry.status}</td>
                          <td style={styles.td}>
                            <button onClick={() => handleEditSave(entry._id)} style={styles.saveBtn}>Save</button>
                            <button onClick={() => setEditingId(null)} style={styles.cancelBtn}>Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={styles.td}>{entry.visitorName}</td>
                          <td style={styles.td}>{entry.idCardNumber}</td>
                          <td style={styles.td}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: entry.isFlagged ? "700" : "normal" }}>
                                {entry.vehicleNumber}
                              </span>
                              {entry.isFlagged && (
                                <div style={{ marginTop: "4px" }}>
                                  <FlagBadge severity={entry.flagSeverity} />
                                  <div style={{ fontSize: "10px", color: "#c0392b", marginTop: "2px", fontWeight: "500" }}>
                                    ⚠️ {entry.flagReason || "Suspicious vehicle"}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>{entry.countryCode} {entry.phoneNumber}</td>
                          <td style={styles.td}>{new Date(entry.enteredAt).toLocaleString()}</td>
                          <td style={styles.td}>{entry.recordedBy}</td>
                          <td style={styles.td}>{entry.status}</td>
                          <td style={styles.td}>
                            <button onClick={() => handleEditClick(entry)} style={styles.editBtn}>Edit</button>
                            <button onClick={() => handleDelete(entry._id)} style={styles.deleteBtn}>Delete</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <GuardianAssistant />
    </div>
  );
};

const StatBox = ({ value, label, valueColor = "#1a1a2e" }) => (
  <div style={styles.statBox}>
    <span style={{ ...styles.statNum, color: valueColor }}>{value}</span>
    <span style={styles.statLabel}>{label}</span>
  </div>
);

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f4f6f8", fontFamily: "sans-serif" },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    padding: "14px 24px",
    color: "#fff",
  },
  navTitle: { margin: 0, fontSize: "18px" },
  logoutBtn: {
    padding: "8px 16px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  container: {
    maxWidth: "1100px",
    margin: "30px auto",
    padding: "0 16px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  statsBar: { display: "flex", gap: "16px", flexWrap: "wrap" },
  statBox: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "16px 24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "120px",
  },
  statNum: { fontSize: "28px", fontWeight: "700", color: "#1a1a2e" },
  statLabel: { fontSize: "12px", color: "#888", marginTop: "4px" },
  card: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  cardTitle: { margin: "0 0 20px 0", fontSize: "16px", fontWeight: "600", color: "#1a1a2e" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  tableHeader: { backgroundColor: "#1a1a2e", color: "#fff" },
  th: { padding: "10px 14px", textAlign: "left", fontWeight: "500" },
  td: { padding: "10px 14px", color: "#333" },
  trEven: { backgroundColor: "#f9f9f9" },
  trOdd: { backgroundColor: "#fff" },
  inlineInput: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "12px",
    boxSizing: "border-box",
  },
  editBtn: {
    padding: "5px 10px",
    backgroundColor: "#2980b9",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    marginRight: "6px",
  },
  deleteBtn: {
    padding: "5px 10px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  saveBtn: {
    padding: "5px 10px",
    backgroundColor: "#27ae60",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    marginRight: "6px",
  },
  cancelBtn: {
    padding: "5px 10px",
    backgroundColor: "#888",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
};

export default AdminDashboard;

import { useState } from "react";
import { sendAgentMessage } from "../api/agentApi";

const quickPrompts = [
  "Summarize today's security status",
  "Which vehicles look risky?",
  "What should the guard check next?",
  "Explain overdue vehicles",
];

export default function GuardianAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      role: "assistant",
      text: "Hi, I am Guardian Assistant. Ask me about today's entries, risky vehicles, overdue exits, or shift summary.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function askAgent(text = message) {
    if (!text.trim() || loading) return;

    const nextChat = [...chat, { role: "user", text }];
    setChat(nextChat);
    setMessage("");
    setLoading(true);

    try {
      const history = nextChat
        .slice(1, -1)
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.text }],
        }));

      const res = await sendAgentMessage(text, history);
      const reply = res.data.warning
        ? `${res.data.reply}\n\nNote: ${res.data.warning}`
        : res.data.reply;
      setChat([...nextChat, { role: "assistant", text: reply }]);
    } catch (err) {
      setChat([
        ...nextChat,
        {
          role: "assistant",
          text: err.response?.data?.message || "I could not reach the assistant right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={styles.fab}>
        Guardian
      </button>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <strong>Guardian Assistant</strong>
          <p style={styles.sub}>Dealership security AI</p>
        </div>
        <button onClick={() => setOpen(false)} style={styles.close}>x</button>
      </div>

      <div style={styles.quickGrid}>
        {quickPrompts.map((p) => (
          <button key={p} onClick={() => askAgent(p)} style={styles.quick}>
            {p}
          </button>
        ))}
      </div>

      <div style={styles.messages}>
        {chat.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(m.role === "user" ? styles.userBubble : styles.agentBubble),
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && <div style={{ ...styles.bubble, ...styles.agentBubble }}>Thinking...</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          askAgent();
        }}
        style={styles.form}
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about logs, risks, overdue vehicles..."
          style={styles.input}
        />
        <button type="submit" style={styles.send}>Send</button>
      </form>
    </div>
  );
}

const styles = {
  fab: {
    position: "fixed",
    right: 24,
    bottom: 24,
    zIndex: 2000,
    border: "none",
    borderRadius: 8,
    padding: "12px 18px",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  panel: {
    position: "fixed",
    right: 24,
    bottom: 24,
    width: 360,
    height: 520,
    zIndex: 2000,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "Inter, Segoe UI, sans-serif",
  },
  header: {
    padding: 14,
    background: "#111827",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sub: { margin: "2px 0 0", fontSize: 12, color: "#cbd5e1" },
  close: { background: "transparent", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" },
  quickGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 10 },
  quick: { padding: 8, border: "1px solid #e5e7eb", borderRadius: 6, background: "#f8fafc", cursor: "pointer", fontSize: 12 },
  messages: { flex: 1, overflowY: "auto", padding: 12, background: "#f8fafc" },
  bubble: { padding: 10, borderRadius: 8, marginBottom: 8, fontSize: 13, lineHeight: 1.4 },
  userBubble: { background: "#2563eb", color: "#fff", marginLeft: 40 },
  agentBubble: { background: "#fff", color: "#111827", border: "1px solid #e5e7eb", marginRight: 30 },
  form: { display: "flex", gap: 8, padding: 10, borderTop: "1px solid #e5e7eb" },
  input: { flex: 1, padding: 10, border: "1px solid #d1d5db", borderRadius: 6 },
  send: { padding: "0 14px", border: "none", borderRadius: 6, background: "#16a34a", color: "#fff", fontWeight: 700 },
};

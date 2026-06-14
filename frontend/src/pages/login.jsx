import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {loginUser} from "../api/authApi";
/* =====================================================================
   STEP 1 — BASIC PAGE LAYOUT
   minHeight: 100vh        → full screen height always
   display: flex           → enables flexbox
   alignItems: center      → centers card vertically
   justifyContent: center  → centers card horizontally
   position: relative      → anchor for decorative orbs & burst
   overflow: hidden        → clips orbs that go off-screen
   ===================================================================== */
const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 12%, rgba(14, 165, 233, 0.18), transparent 28%), radial-gradient(circle at 82% 80%, rgba(245, 158, 11, 0.16), transparent 30%), linear-gradient(135deg, #f8fafc 0%, #eef2f7 48%, #e2e8f0 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  padding: "24px",
  position: "relative",
  overflow: "hidden",
};

/* =====================================================================
   STEP 2 — CARD CONTAINER
   display: flex           → two columns side by side
   borderRadius: 28px      → big rounded corners = modern feel
   overflow: hidden        → illustration panel corners clip nicely
   boxShadow               → subtle lift off the background
   maxWidth: 860px         → card never gets too wide on big screens
   ===================================================================== */
const cardStyle = {
  display: "flex",
  borderRadius: "22px",
  overflow: "hidden",
  background: "rgba(255, 255, 255, 0.9)",
  width: "100%",
  maxWidth: "980px",
  minHeight: "560px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  boxShadow: "0 26px 80px rgba(15, 23, 42, 0.16)",
  backdropFilter: "blur(18px)",
};

/* =====================================================================
   STEP 3 — LEFT FORM PANEL
   flex: 1                 → takes remaining space after illustration
   padding: 52px 48px      → generous spacing inside the panel
   flexDirection: column   → stacks heading, inputs, buttons vertically
   justifyContent: center  → vertically centers the whole form
   ===================================================================== */
const formPanelStyle = {
  flex: "1",
  padding: "58px 54px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  textAlign: "left",
};

const headingStyle = {
  fontSize: "44px",
  color: "#0f172a",
  lineHeight: 1.05,
  margin: "0 0 10px",
  fontWeight: 800,
  letterSpacing: "0",
};

const subStyle = {
  fontSize: "15px",
  color: "#64748b",
  margin: "0 0 34px",
  fontWeight: 400,
};

/* =====================================================================
   STEP 4 — INPUTS
   display: flex           → icon + input field side by side
   background: #f7f7f5     → slightly off-white input background
   border: 1px solid       → subtle border, visible but not harsh
   borderRadius: 12px      → soft pill-like corners
   height: 50px            → comfortable tap/click target
   transition              → smooth border color on focus
   ===================================================================== */
const inputWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "#f8fafc",
  border: "1px solid #dbe3ef",
  borderRadius: "14px",
  padding: "0 16px",
  height: "54px",
  marginBottom: "0px",
  transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease",
};

const inputStyle = {
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "15px",
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  color: "#0f172a",
  flex: 1,
  width: "100%",
};

const iconStyle = {
  display: "none",
  fontSize: 0,
  lineHeight: 0,
  flexShrink: 0,
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "#334155",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  marginBottom: "8px",
};

/* =====================================================================
   STEP 5 — BUTTON
   background: #111        → near-black = strong CTA
   borderRadius: 12px      → matches input radius for visual harmony
   letterSpacing: 2px      → uppercase spaced text looks authoritative
   transition              → hover turns orange via CSS class (Step 10)
   ===================================================================== */
const submitBtnStyle = {
  width: "100%",
  height: "54px",
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 52%, #0f766e 100%)",
  color: "#fff",
  border: "none",
  borderRadius: "14px",
  fontSize: "13px",
  fontWeight: 800,
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  letterSpacing: "1.6px",
  textTransform: "uppercase",
  cursor: "pointer",
  marginBottom: "22px",
  boxShadow: "0 16px 32px rgba(15, 118, 110, 0.24)",
  transition: "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease",
};

/* =====================================================================
   STEP 6 — MESSAGES (success / error)
   Ternary on `type` switches between red/green backgrounds
   borderRadius: 10px      → pill-shaped message box
   border                  → thin colored border for definition
   ===================================================================== */
const messageStyle = (type) => ({
  marginTop: "0px",
  padding: "12px 14px",
  borderRadius: "14px",
  fontSize: "13px",
  fontWeight: 700,
  background: type === "error" ? "#fff1f2" : "#ecfdf5",
  color: type === "error" ? "#be123c" : "#047857",
  border: `1px solid ${type === "error" ? "#fecdd3" : "#a7f3d0"}`,
});

/* =====================================================================
   STEP 7 — RIGHT ILLUSTRATION PANEL
   background: gradient    → orange gradient = the sci-fi warm sky
   borderRadius + margin   → floats as a rounded panel inside the card
   position: relative      → needed for absolutely-placed floating orbs
   overflow: hidden        → clips orbs that drift outside panel
   ===================================================================== */
const illustrationPanelStyle = {
  width: "45%",
  background:
    "linear-gradient(160deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 41, 59, 0.96) 54%, rgba(15, 118, 110, 0.92) 100%)",
  borderRadius: "18px",
  margin: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: "18px",
  position: "relative",
  overflow: "hidden",
  color: "#fff",
};

const eggStyle = {
  width: "190px",
  height: "120px",
  background: "linear-gradient(180deg, rgba(226, 232, 240, 0.96) 0%, rgba(148, 163, 184, 0.82) 100%)",
  borderRadius: "28px 28px 16px 16px",
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 20px 40px rgba(2, 6, 23, 0.35)",
};

/* =====================================================================
   STEP 8 — DECORATIVE SHAPES
   position: fixed         → orbs stay relative to viewport
   borderRadius: 50%       → perfect circles
   pointerEvents: none     → decorations never intercept clicks
   ===================================================================== */
const orbTLStyle = {
  position: "fixed",
  top: "42px",
  left: "72px",
  width: "160px",
  height: "2px",
  borderRadius: "999px",
  background: "linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.8), transparent)",
  pointerEvents: "none",
};

const orbBRStyle = {
  position: "fixed",
  bottom: "56px",
  right: "64px",
  width: "190px",
  height: "2px",
  borderRadius: "999px",
  background: "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.82), transparent)",
  pointerEvents: "none",
};

const burstStyle = {
  position: "fixed",
  bottom: "60px",
  left: "32px",
  width: "56px",
  height: "56px",
  pointerEvents: "none",
  opacity: 0.45,
};

/* =====================================================================
   STEP 9 — RESPONSIVE DESIGN
   @media (max-width: 640px) hides illustration on small screens
   STEP 10 — ANIMATIONS
   floatOrb    → orbs bob up and down in illustration
   fadeUp      → card slides up + fades in on page load
   hover rules → button/inputs react to mouse
   ===================================================================== */
const responsiveCSS = `
  /* STEP 9 — hide illustration panel on mobile screens */
  @media (max-width: 760px) {
    .illustration-panel { display: none !important; }
    .form-panel { padding: 38px 26px !important; }
    .login-card { border-radius: 18px !important; min-height: auto !important; }
  }

  /* STEP 10 — orbs float up and down continuously */
  @keyframes floatOrb {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-12px); }
  }

  /* STEP 10 — card fades up on mount */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .login-card { animation: fadeUp 0.5s ease forwards; }

  @keyframes scanLine {
    0% { transform: translateY(-120%); opacity: 0; }
    20%, 75% { opacity: 1; }
    100% { transform: translateY(440%); opacity: 0; }
  }

  @keyframes pulseGlow {
    0%, 100% { opacity: 0.35; transform: scaleX(0.72); }
    50% { opacity: 0.9; transform: scaleX(1); }
  }

  /* STEP 10 — submit button turns orange on hover */
  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 38px rgba(15, 118, 110, 0.32) !important;
    filter: saturate(1.1);
  }

  /* STEP 10 — social buttons get orange border on hover */
  .social-btn:hover {
    border-color: #0f766e !important;
    background: #f0fdfa !important;
    transform: translateY(-1px);
  }

  /* STEP 10 — input wraps glow orange on focus */
  .input-wrap:focus-within {
    border-color: #0f766e !important;
    background: #ffffff !important;
    box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.12) !important;
    transform: translateY(-1px);
  }
`;

/* ─── SVG Starburst (Step 8) ─────────────────────────────────────────── */
const Burst = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={burstStyle}>
    {[0, 45, 90, 135].map((deg) => (
      <g key={deg} transform={`rotate(${deg} 32 32)`}>
        <line x1="32" y1="4"  x2="32" y2="20" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
        <line x1="32" y1="44" x2="32" y2="60" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

/* ─── Google icon ────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.657 14.215 17.64 11.907 17.64 9.2z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
);

/* ─── Facebook icon ──────────────────────────────────────────────────── */
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#1877F2" d="M18 9a9 9 0 1 0-10.406 8.892V11.25H5.344V9h2.25V7.013c0-2.22 1.323-3.447 3.348-3.447.97 0 1.983.173 1.983.173V5.9h-1.117c-1.1 0-1.443.683-1.443 1.383V9h2.453l-.392 2.25H10.365v6.642A9.004 9.004 0 0 0 18 9z"/>
  </svg>
);

const EmailIcon = () => (
  <svg style={{ width: "19px", height: "19px", color: "#64748b", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4.75 6.75h14.5v10.5H4.75V6.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m5.25 7.25 6.75 5.4 6.75-5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon = () => (
  <svg style={{ width: "19px", height: "19px", color: "#64748b", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7.25 10.75h9.5v7.5h-9.5v-7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 10.75V8.8a3 3 0 0 1 6 0v1.95" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 14v1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/* ─── Illustration Panel (Step 7 + Step 10 animations) ──────────────── */
const Illustration = () => {
  const rocks = [
    { w: 22, h: 40, br: "4px 8px 2px 6px"  },
    { w: 14, h: 28, br: "4px 8px 2px 6px"  },
    { w: 18, h: 50, br: "6px 2px 4px 8px"  },
    { w: 14, h: 32, br: "4px 8px 2px 6px"  },
  ];
  return (
    <div style={illustrationPanelStyle} className="illustration-panel">
      {/* Step 10 — each orb uses floatOrb animation with staggered delay */}
      {[
        { top: "22px", right: "30px", w: 92, h: 2, bg: "rgba(45, 212, 191, 0.8)", delay: "0s"   },
        { top: "68px", left: "26px",  w: 64, h: 2, bg: "rgba(251, 191, 36, 0.8)", delay: "0.4s" },
        { top: "auto", left: "44%",   w: 120, h: 2, bg: "rgba(226, 232, 240, 0.55)", delay: "0.9s" },
      ].map((o, i) => (
        <div key={i} style={{
          position: "absolute",
          top: o.top, right: o.right, left: o.left,
          width: o.w, height: o.h, bottom: o.top === "auto" ? "42px" : undefined,
          background: o.bg,
          borderRadius: "999px",
          opacity: 0.85,
          animation: `pulseGlow ${2.5 + i * 0.5}s ${o.delay} ease-in-out infinite`,
        }} />
      ))}

      {/* egg / portal shape */}
      <div style={eggStyle}>
        <div style={{
          position: "absolute",
          top: "22px",
          left: "28px",
          right: "28px",
          height: "34px",
          borderRadius: "999px 999px 12px 12px",
          background: "linear-gradient(90deg, #0f172a, #1e293b)",
          boxShadow: "inset 0 -8px 16px rgba(255,255,255,0.12)",
        }} />
        <div style={{
          position: "absolute",
          left: "30px",
          right: "30px",
          bottom: "24px",
          height: "16px",
          borderRadius: "999px",
          background: "linear-gradient(90deg, #0f766e, #14b8a6)",
        }} />
        <div style={{
          position: "absolute",
          left: "34px",
          bottom: "-14px",
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          background: "#0f172a",
          border: "7px solid #cbd5e1",
        }} />
        <div style={{
          position: "absolute",
          right: "34px",
          bottom: "-14px",
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          background: "#0f172a",
          border: "7px solid #cbd5e1",
        }} />
      </div>

      {/* astronaut */}
      <div style={{
        width: "78%",
        minHeight: "132px",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        borderRadius: "18px",
        background: "rgba(15, 23, 42, 0.48)",
        padding: "18px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        color: "transparent",
        fontSize: 0,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          height: "28%",
          background: "linear-gradient(180deg, rgba(45, 212, 191, 0.16), transparent)",
          animation: "scanLine 3.2s ease-in-out infinite",
        }} />
        <p style={{ margin: "0 0 14px", color: "#cbd5e1", fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>
          Dealer Access
        </p>
        <div style={{ display: "grid", gap: "10px" }}>
          {["Auth service online", "Role based routing", "Secure dashboard entry"].map((item, i) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#f8fafc", fontSize: "13px" }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: i === 1 ? "#fbbf24" : "#2dd4bf",
                boxShadow: `0 0 16px ${i === 1 ? "rgba(251, 191, 36, 0.55)" : "rgba(45, 212, 191, 0.55)"}`,
              }} />
              {item}
            </div>
          ))}
        </div>
        🧑‍🚀
      </div>

      {/* rocks */}
      <div style={{ display:"flex", gap:"6px", alignItems:"flex-end", marginTop:"-6px" }}>
        {rocks.map((r, i) => (
          <div key={i} style={{
            width: r.w, height: r.h,
            background: "linear-gradient(180deg,#64748b,#334155)",
            borderRadius: r.br,
          }} />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN LOGIN COMPONENT — your original logic, zero changes
   ═══════════════════════════════════════════════════════════════════════ */
const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [uiMessage, setUiMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });

    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setUiMessage({ type: ' ', text: ' ' });
    
    try {
        const response = await loginUser(formData);
        const token = response.data.token;
    //     console.log("1. Full response data:", response.data);
    // console.log("2. Token:", token);
    // console.log("3. Decoded token:", JSON.parse(atob(token.split('.')[1])));

        const { role } = JSON.parse(atob(token.split('.')[1]));
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);;
    
    setUiMessage({ type: 'success', text: 'Login sucess and entering to dashboard !!' });
    //now directing according to the role based 
        const redirectMap ={
            admin : '/admin',
            guard : '/guard',
            viewer : '/viewer'
        };

    //now wait for 1.5 sec to enter in dashboard coz let user see that if they had logged in or not
    setTimeout(() => {
        navigate(redirectMap[role]||'/login');
    },
        1500);
}
        catch (err) {
    const errMsg = err.response?.data?.message || "login failed server not responding try again later";
    setUiMessage({ type: 'error', text: errMsg });
}
    };

return (
    /* Step 1 — full-screen page wrapper */
    <div style={pageStyle}>

      {/* Step 8 — orange orb top-left */}
      <div style={orbTLStyle} />

      {/* Step 8 — orange orb bottom-right */}
      <div style={orbBRStyle} />

      {/* Step 8 — starburst SVG bottom-left */}
      <Burst />

      {/* Step 9 + 10 — responsive breakpoints & animation keyframes */}
      <style>{responsiveCSS}</style>

      {/* Step 2 — white card with two columns */}
      <div style={cardStyle} className="login-card">

        {/* Step 3 — left form panel */}
        <div style={formPanelStyle} className="form-panel">

          <h2 style={headingStyle}>Login</h2>
          <p style={subStyle}>We're glad to see you back with us</p>

          <form onSubmit={handleSubmit}>

            {/* Step 4 — email input wrapped in icon container */}
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Email</label>
              <div style={inputWrapStyle} className="input-wrap">
                <EmailIcon />
                <span style={iconStyle}>👤</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Email address"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Step 4 — password input wrapped in icon container */}
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Password</label>
              <div style={inputWrapStyle} className="input-wrap">
                <LockIcon />
                <span style={iconStyle}>🔒</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Password"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Step 5 — dark submit button, turns orange on hover (Step 10) */}
            <button
              type="submit"
              style={submitBtnStyle}
              className="submit-btn"
            >
              Login
            </button>

          </form>

          {/* Social login buttons */}
          <p style={{ fontSize:"12px", color:"#aaa", textAlign:"center", marginBottom:"12px", fontWeight:500 }}>
            Login with <span style={{ color:"#F97316" }}>Others</span>
          </p>

          <button style={{
            display:"flex", alignItems:"center", gap:"10px", width:"100%",
            height:"44px", background:"#fff", border:"1px solid #e8e8e4",
            borderRadius:"12px", padding:"0 16px", fontSize:"13px",
            fontFamily:"'DM Sans', sans-serif", color:"#444", cursor:"pointer",
            marginBottom:"10px", boxSizing:"border-box", transition:"border-color 0.15s, background 0.12s",
          }} className="social-btn">
            <GoogleIcon /> Login with Google
          </button>

          <button style={{
            display:"flex", alignItems:"center", gap:"10px", width:"100%",
            height:"44px", background:"#fff", border:"1px solid #e8e8e4",
            borderRadius:"12px", padding:"0 16px", fontSize:"13px",
            fontFamily:"'DM Sans', sans-serif", color:"#444", cursor:"pointer",
            marginBottom:"10px", boxSizing:"border-box", transition:"border-color 0.15s, background 0.12s",
          }} className="social-btn">
            <FacebookIcon /> Login with Facebook
          </button>

          {/*Now here we want that if login succes then we can see the display part uiMessage.text checks that whether it contains any text or not if contains then move to the next block and display the login */}
          {uiMessage.text && (
              <div style={{ marginTop: '20px' }}>
                  {/*here we are using the terniary operator if the message is error then  */}
                  {/* Step 6 — styled pill message: green success, red error */}
                  <p style={messageStyle(uiMessage.type)}>{uiMessage.text}</p>
              </div>
          )}

          <p style={{textAlign:'center', marginTop:'16px', fontSize:'13px'}}>
              New Here?{' '}
              <span
                  onClick ={()=> navigate("/register")}
                  style={{color:"#F97316", fontWeight : "800" , cursor : "pointer" , }}>Create an account
              </span>
          </p>

        </div>{/* end form panel */}

        {/* Step 7 — right illustration panel with astronaut + floating orbs */}
        <Illustration />

      </div>{/* end card */}
    </div>
  );
};

export default Login;

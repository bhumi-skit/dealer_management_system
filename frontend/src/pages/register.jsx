import { useState } from "react";
import {useNavigate} from "react-router-dom";
import API from "../api/axios";

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
   maxWidth: 900px         → slightly wider to fit register fields
   ===================================================================== */
const cardStyle = {
  display: "flex",
  borderRadius: "22px",
  overflow: "hidden",
  background: "rgba(255, 255, 255, 0.9)",
  width: "100%",
  maxWidth: "1040px",
  minHeight: "590px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  boxShadow: "0 26px 80px rgba(15, 23, 42, 0.16)",
  backdropFilter: "blur(18px)",
};

/* =====================================================================
   STEP 3 — LEFT FORM PANEL
   flex: 1                 → takes remaining space after illustration
   padding: 48px 44px      → generous spacing inside the panel
   flexDirection: column   → stacks heading, inputs, buttons vertically
   justifyContent: center  → vertically centers the whole form
   ===================================================================== */
const formPanelStyle = {
  flex: "1",
  padding: "48px 54px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  textAlign: "left",
};

const headingStyle = {
  fontSize: "42px",
  color: "#0f172a",
  lineHeight: 1.05,
  margin: "0 0 10px",
  fontWeight: 800,
  letterSpacing: "0",
};

const subStyle = {
  fontSize: "15px",
  color: "#64748b",
  margin: "0 0 28px",
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
  height: "52px",
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

/* select dropdown styled to match inputs */
const selectStyle = {
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "15px",
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  color: "#0f172a",
  flex: 1,
  width: "100%",
  cursor: "pointer",
  appearance: "none",
};

const iconStyle = {
  display: "none",
  fontSize: 0,
  lineHeight: 0,
  flexShrink: 0,
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
  padding: "12px 14px",
  borderRadius: "14px",
  fontSize: "13px",
  fontWeight: 700,
  margin: 0,
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
  width: "43%",
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
  width: "178px",
  height: "126px",
  background: "linear-gradient(180deg, rgba(226, 232, 240, 0.96) 0%, rgba(148, 163, 184, 0.82) 100%)",
  borderRadius: "28px",
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
   hover rules → button/inputs/select react to mouse
   ===================================================================== */
const responsiveCSS = `
  /* STEP 9 — hide illustration panel on mobile screens */
  @media (max-width: 820px) {
    .illustration-panel { display: none !important; }
    .form-panel { padding: 38px 26px !important; }
    .register-card { border-radius: 18px !important; min-height: auto !important; }
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
  .register-card { animation: fadeUp 0.5s ease forwards; }

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

  /* STEP 10 — input wraps glow orange on focus */
  .input-wrap:focus-within {
    border-color: #0f766e !important;
    background: #ffffff !important;
    box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.12) !important;
    transform: translateY(-1px);
  }

  /* STEP 10 — select wrap also glows on focus */
  .select-wrap:focus-within {
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

/* ─── Illustration Panel (Step 7 + Step 10 animations) ──────────────── */
const FieldIcon = ({ type }) => {
  const paths = {
    user: (
      <>
        <path d="M12 12.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" />
        <path d="M5.75 19.25c.7-3.05 2.85-4.65 6.25-4.65s5.55 1.6 6.25 4.65" />
      </>
    ),
    email: (
      <>
        <path d="M4.75 6.75h14.5v10.5H4.75V6.75Z" />
        <path d="m5.25 7.25 6.75 5.4 6.75-5.4" />
      </>
    ),
    lock: (
      <>
        <path d="M7.25 10.75h9.5v7.5h-9.5v-7.5Z" />
        <path d="M9 10.75V8.8a3 3 0 0 1 6 0v1.95" />
        <path d="M12 14v1.4" />
      </>
    ),
    shield: (
      <path d="M12 4.75 18.25 7v4.45c0 3.35-2.2 6.05-6.25 7.8-4.05-1.75-6.25-4.45-6.25-7.8V7L12 4.75Z" />
    ),
    key: (
      <>
        <path d="M9.75 14.25a3.5 3.5 0 1 1 2.48-5.98 3.5 3.5 0 0 1-2.48 5.98Z" />
        <path d="m12.25 11.75 6 6M16 15.5l1.25-1.25M18 17.5l1.25-1.25" />
      </>
    ),
  };

  return (
    <svg style={{ width: "19px", height: "19px", color: "#64748b", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {paths[type]}
      </g>
    </svg>
  );
};

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
        { top: "18px", right: "24px", w: 18, h: 10, bg: "#0ea5e9", delay: "0s"   },
        { top: "32px", left: "18px",  w: 12, h: 7,  bg: "#fb923c", delay: "0.4s" },
        { top: "10px", left: "48%",   w: 9,  h: 9,  bg: "#7dd3fc", delay: "0.9s" },
      ].map((o, i) => (
        <div key={i} style={{
          position: "absolute",
          top: o.top, right: o.right, left: o.left,
          width: o.w, height: o.h,
          background: o.bg,
          borderRadius: "50%",
          opacity: 0.9,
          animation: `floatOrb ${2.5 + i * 0.5}s ${o.delay} ease-in-out infinite`,
        }} />
      ))}

      {/* egg / portal shape */}
      <div style={eggStyle}>
        <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.15)", borderRadius:"inherit" }} />
      </div>

      {/* rocket emoji — register = launching something new */}
      <div style={{
        width: "78%",
        minHeight: "138px",
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
          New Access Setup
        </p>
        <div style={{ display: "grid", gap: "10px" }}>
          {["Create account", "Assign dashboard role", "Verify secret access"].map((item, i) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#f8fafc", fontSize: "13px" }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: i === 2 ? "#fbbf24" : "#2dd4bf",
                boxShadow: `0 0 16px ${i === 2 ? "rgba(251, 191, 36, 0.55)" : "rgba(45, 212, 191, 0.55)"}`,
              }} />
              {item}
            </div>
          ))}
        </div>
        🚀
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

      {/* tagline inside illustration */}
      <p style={{
        position: "absolute", bottom: "24px",
        fontSize: "12px", fontWeight: 500,
        color: "rgba(255,255,255,0.7)",
        letterSpacing: "1px", textTransform: "uppercase",
        margin: 0,
      }}>
        Join the mission
      </p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN REGISTER COMPONENT — your original logic, zero changes
   ═══════════════════════════════════════════════════════════════════════ */
const Register =()=>{
    //here we create the form for registeration of user that when user register their details get updated 
    const[formData, setFormData] = useState({
        name:'',
        email:'',
        password:'',
        role:'viewer',
        secretCode : ''
    });
    //now here we check that whether the user has successfully registered or not
    const[uiMessage,setUiMessage]= useState({type:'', text:''});        //success or fail
    const navigate = useNavigate();

    //ow here we handle the dynamic changes based on the name attribute  that when it entered name it stores name-->  the same works for email pass etc so that we dont need to make different functions for name, email etc.....
    const handleChange = (e) =>{
        setFormData({...formData,[e.target.name]:e.target.value});
    };
    //here we handle that when user fill the details and hit submit button by default the page reloads and preventing this thing we basically use preventDefault(); that without reloading the entire page it basically handle it and when if the user didnt register then the space will automatically gets clerere
    //now it works when u hit the submit button 
    const handleSubmit = async (e)=>{
        e.preventDefault(); // it stops relading the page 
        console.log("Sending data:", JSON.stringify(formData));

        console.log("Button clicked ", formData)
        setUiMessage({type:' ', text:' '}); // it clers the previous data 
        setFormData({name:'',email:'', password:'', role:'viewer', secretCode:''});

        try{
            const response = await API.post('/auth/register',formData);
            void response;
            //check whether the registration succes or not 
            setUiMessage({
                type:'success',
                text:'Account Created !! You can now log in!!'
            });
            setTimeout(()=>{
                navigate('/login');
            },2000)
            //Clear the form data after firing the submit button 
            setFormData({name:'',email:'',password:'',role:'guard'});
        }
        catch(err){
            console.log("AXIOS ERROE",err);
console.log("Backend said:", JSON.stringify(err.response?.data));            const errorMessage = err.response?.data?.message||"Server is not responding!!! Chech again later plss!!";
            void errorMessage;
            setUiMessage({type:'error', error: err.message});
        }

    };

    return(
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
        <div style={cardStyle} className="register-card">

          {/* Step 3 — left form panel */}
          <div style={formPanelStyle} className="form-panel">

            <h2 style={headingStyle}>REGISTER</h2>
            <p style={subStyle}>Create your account and join the mission</p>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

              {/*Name input  */}
              {/* Step 4 — name input wrapped in icon container */}
              <div style={inputWrapStyle} className="input-wrap">
                <span style={iconStyle}>👤</span>
                <FieldIcon type="user" />
                <input
                  name="name"
                  placeholder="Full Name"
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              {/*Email input  */}
              {/* Step 4 — email input wrapped in icon container */}
              <div style={inputWrapStyle} className="input-wrap">
                <span style={iconStyle}>✉️</span>
                <FieldIcon type="email" />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              {/*Password input  */}
              {/* Step 4 — password input wrapped in icon container */}
              <div style={inputWrapStyle} className="input-wrap">
                <span style={iconStyle}>🔒</span>
                <FieldIcon type="lock" />
                <input
                  name="password"
                  type="password"
                  placeholder="Password must be of 6 characters"
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              {/*Role input  guard or admin*/}
              {/*Dropdown {means everything is written in js } */}
              {/* Step 4 — select styled to match other inputs */}
              <div style={inputWrapStyle} className="select-wrap">
                <span style={iconStyle}>🛡️</span>
                <FieldIcon type="shield" />
                <select
                  name="role"
                  onChange={handleChange}
                  value={formData.role}
                  style={selectStyle}
                >
                  <option value="guard">Guard</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              {(formData.role == 'admin' || formData.role === 'guard')&&(
                /* Step 4 — secret code input, only shown for admin/guard roles */
                <div style={inputWrapStyle} className="input-wrap">
                  <span style={iconStyle}>🔑</span>
                  <FieldIcon type="key" />
                  <input
                    name='secretCode'
                    type='password'
                    placeholder={`Enter ${formData.role} secretCode`}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Step 5 — dark submit button, turns orange on hover (Step 10) */}
              <button
                type="submit"
                style={submitBtnStyle}
                className="submit-btn"
              >
                Create Account
              </button>

            </form>

            {/* Feedback Message */}
            {uiMessage.text && (
              <div style={{ marginTop: '20px' }}>
                {/* 2. This is the main message (Success or Error) */}
                {/* Step 6 — styled pill message: green success, red error */}
                <p style={messageStyle(uiMessage.type)}>
                  {uiMessage.text}
                </p>

                {/* 3. Optional: A small "Status" line below it */}
                <span style={{ color: '#aaa', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                  Status: {uiMessage.type}
                </span>
              </div>
            )}

            <p style={{textAlign:"center", marginTop:'16px', fontSize:"13px"}}> Already have an account?{" "}
                <span onClick={()=> navigate("/")}
                    style={{color:"#F97316", fontWeight:"600", cursor:"pointer", textDecoration:"underline"}}
                    >Login here</span>
            </p>

          </div>{/* end form panel */}

          {/* Step 7 — right illustration panel with rocket + floating orbs */}
          <Illustration />

        </div>{/* end card */}
      </div>
    );

};
export default Register;

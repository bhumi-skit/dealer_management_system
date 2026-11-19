import { getAllLogs,createLogs,exitvisitor } from "../api/entryLog";

//all imports and phone number validations 
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { isValidPhoneNumber } from "libphonenumber-js";
import { FaCar, FaTools, FaComment, FaBox, FaUser, FaMotorcycle, FaTruck } from "react-icons/fa";
import { MdElectricRickshaw } from "react-icons/md";
import GuardianAssistant from "../components/GuardAssistant";
//Constraints 
const Country_Codes = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
];

const PURPOSE_OPTIONS = [
  { value: "TEST_DRIVE", label: "Test Drive", icon: FaCar },
  { value: "SERVICE", label: "Car Service", icon: FaTools },
  { value: "ENQUIRY", label: "Enquiry", icon: FaComment },
  { value: "DELIVERY", label: "Delivery", icon: FaBox },
  { value: "VISIT", label: "Genral Visit", icon: FaUser }
];

const VEHICLE_TYPES = [
  { id: 'TWO_WHEELER', 
    label: "Two Wheeler",
     icon: FaMotorcycle, 
     examples: "Bike , Scooter, Moped", 
     requiredFields: ["helmetWorn", "rcBookNo", "insuranceValidTill"], 
     optionalField: ["pillionRider", "pillionHelmet"] },

  { id: 'THREE_WHEELER',
     label: "Three Wheeler",
      icon: MdElectricRickshaw, 
      examples: "Auto Rickshaw,E-Rickshaw,Tempo", 
      requiredFields: ["rcBookNo", "permitNumber", "passengerCount"],
       optionalField: ["insuranceValidTill"] },

  {
    id: "FOUR_WHEELER",
    label: "Four Wheeler",
    icon: FaCar,
    examples: "Car, Jeep",
    requiredFields: ["passengerCount", "rcBookNo", "insuranceValidTill"],
    optionalField: ["vehicleColor"]
  },

  {
    id: "HEAVY_VEHICLE",
    label: "Heavy Vehicle",
    icon: FaTruck,
    examples: "Truck, Bus, Tractor, Tanker",
    requiredFields: ["rcBookNo", "loadType", "loadWeight", "vendorNumber", "driverLicenceNumber"],
    optionalField: ["challanNumber", "insuranceValidTill"]
  },
];

const EXPECTED_DURATION ={
  TEST_DRIVE :60,
  SERVICE : 480,
  DELIVERY : 120,
  ENQUIRY :60,
  VISIT : 120
};

//in indian std time 
const getLocalDateTime =() =>{
  return new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
};

//now here we need to create two base form one for visitors entry and second for purpose visit 
const initialBaseForm ={
  visitorName : "",
  idCardNumber :"",
  vehicleNumber :"",
  vehicleType : "TWO_WHEELER",
  vehicleModel :"",
  vehicleColor :"",
  email:"",
  enteredAt :getLocalDateTime(),
  purpose :"",
  recordedBy :"",
  countryCode :"+91",
  phoneNumber :"",
  driverLicenceNumber:"",

  //TWO WHEELER 
  helmetWorn :"",
  pillionRider :"",
  pillionHelmet:"",

  //THREE WHEELER 
  permitNumber :"",

  //Common Field 
  rcBookNo:"",
  insuranceValidTill:"",
  passengerCount:"",

  //Heavy Vehicle 
  loadType:"",
  loadWeight:"",
  challanNumber:"",
  vendorNumber:"",
};

const initialPurposeForm ={
  purpose:"",
  //testDrive
  driverName :"",
  customerName :"",

  //service 
  complaint:"",
  serviceType :"",
  estimatedTime :"",
  serviceAdvisor :"",

  //delivery
  itemDescription:"",
  recipientName:"",

  //visit
  personToMeet:"",
  department:"",
};

//now here comes the helper functions which tells that whether the vehicle is on arrival time or not 
const getElapsedMinutes =(existedAt)=>{
  if(!existedAt){
    return 0;
  }
  else{
    return Math.floor((Date.now()-new Date(existedAt).getTime())/60000);
  }
}
//now here i want that whether the is the duration exited or how much duration is completed -->using ratio
const getTimerColor = (elapsed , expected )=>{
const ratio = elapsed / expected ;
if(ratio >= 1){
return {bg: "#fdecea", text: "#c0392b", label: "OVERDUE"};//time is exceeded
}
//80% of the expected duration is completed
if(ratio >=0.8){
return {bg: "#fff8e1", text: "#f39c12", label: "WARNING"};
}
return { bg: "#e8f5e9", text: "#27ae60", label: "ON TIME" };
}

//now here we want to create status batches
const StatusBadge = ({status})=>{
//now creating a map instead of using if else coz we just need to match key value pair instead and doesnt need for any logic
const map ={
INSIDE : {bg: "#e8f5e9", color: "#27ae60", label: "Inside" },
EXITED : {bg: "#f1f2f6", color: "#7f8c8d", label: "Exited"}, // it is a default case
TEST_DRIVE : { bg: "#fff8e1", color: "#f39c12", label: "Test Drive"},
SERVICE : {bg: "#e3f2fd", color: "#1a6fb5", label: "Service"},
PERMANENT : {bg: "#fdecea", color: "#c0392b", label: "Permanent Exit"}

};
const s = map[status] || map.EXITED;
return (
<span style={{
padding: "3px 10px", borderRadius: "12px", fontSize: "11px",
fontWeight: "600", backgroundColor: s.bg, color: s.color,
}}>
{s.label}
</span>
);
} ;

const FlagBadge = ({severity = "low"}) => {
const map = {
low: { bg: "#fff8e1", color: "#8a5e00", label: "Flagged" },
medium: { bg: "#fff3cd", color: "#9a6700", label: "Flagged" },
high: { bg: "#fdecea", color: "#c0392b", label: "High Risk" },
};
const s = map[severity] || map.low;
return (
<span style={{
padding: "3px 10px", borderRadius: "12px", fontSize: "11px",
fontWeight: "700", backgroundColor: s.bg, color: s.color,
}}>
{s.label}
</span>
);
};

const PhotoCapture = ({ label, fieldName, currentPhoto, entryId, onUploaded }) => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  };

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch (err) {
      console.error("Camera access failed", err);
      setError("Camera access failed. Check browser permission or use file upload.");
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Max size is 5MB.");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG, WEBP files allowed.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("fieldName", fieldName);

      const response = await API.put(`/entrylogs/${entryId}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onUploaded(response.data.entry);
    } catch (err) {
      console.error("Photo upload failed", err);
      setError(err.response?.data?.message || "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) {
      setError("Camera is not ready yet.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError("Could not capture photo.");
        return;
      }

      const file = new File([blob], `${fieldName}.jpg`, { type: "image/jpeg" });
      await uploadFile(file);
      stopCamera();
    }, "image/jpeg", 0.9);
  };

  const handleFileChange = async (e) => {
    await uploadFile(e.target.files?.[0]);
    e.target.value = "";
  };

  useEffect(() => stopCamera, []);

  return (
    <div style={styles.photoBox}>
      <div style={styles.photoHeader}>
        <strong>{label}</strong>
        {currentPhoto?.url && (
          <a href={currentPhoto.url} target="_blank" rel="noreferrer" style={styles.photoLink}>
            View
          </a>
        )}
      </div>

      {currentPhoto?.url ? (
        <img src={currentPhoto.url} alt={label} style={styles.photoPreview} />
      ) : (
        <div style={styles.photoPlaceholder}>No photo</div>
      )}

      <video
        ref={videoRef}
        muted
        playsInline
        style={{ ...styles.cameraPreview, display: streaming ? "block" : "none" }}
      />

      {error && <p style={styles.photoError}>{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div style={styles.photoActions}>
        {!streaming ? (
          <button type="button" onClick={startCamera} disabled={uploading} style={styles.smallBtn}>
            Camera
          </button>
        ) : (
          <>
            <button type="button" onClick={captureFromCamera} disabled={uploading} style={styles.smallBtn}>
              Capture
            </button>
            <button type="button" onClick={stopCamera} disabled={uploading} style={styles.smallMutedBtn}>
              Stop
            </button>
          </>
        )}
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={styles.smallMutedBtn}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
};

//Main Component

const GuardDashboard = () => {

const navigate = useNavigate();

//Side Bar--> search table
const [entries , setEntries ] = useState([]);
const [searchQuery , setSearchQuery] = useState(""); //for vehicle number
const [filterTab , setFilterTab] = useState("ALL");
const [selectedEntry , setSelectedEntry] = useState(null);

//Form steps : base --> purpose --> review
const[formStep , setFormStep] = useState("base");
const [baseForm , setBaseForm] = useState(initialBaseForm);
const [purposeForm , setPurposeForm ] = useState(initialPurposeForm);

//UI State
const [uiMessage , setUiMessage] = useState({type : "" , text:""});
const [loading, setLoading ] = useState(false);
//Exit Modal
const[exitModal , setExitModal] = useState(null);
const[exitType , setExitType ] = useState("REGULAR");
const[exitReason, setExitReason] = useState("");

//Overdue Alerts
const[overdueAlerts, setOverAlerts] = useState([]); //in this we have to set that when time exceeds
const timeRef = useRef(null);


const [phoneError, setPhoneError] = useState("");
// const [form, setForm] = useState(initialForm);
// const [entries, setEntries] = useState([]);
// const [uiMessage, setUiMessage] = useState({ type: "", text: "" });
// const [loading, setLoading] = useState(false);
// const navigate = useNavigate();
// const [activeTestDriverId, setActiveTestDriverId] = useState(null); //  null, not ""
// const [driverName, setDriverName] = useState("");
// const [customerName, setCustomerName] = useState("");

//Fetch
useEffect(() => {
fetchEntries();
const refreshId = setInterval(fetchEntries, 30000);
return () => clearInterval(refreshId);
}, []);

useEffect(()=>{
  const checkOverdue = () =>{
    const overDue = entries.filter((e)=>{
      if(e.status==='INSIDE'|| e.status ==='EXITED' || e.status ==='PERMANENT') return false ;
      const expected = EXPECTED_DURATION[e.exitType] ||60;
      const elapsed = getElapsedMinutes(e.exitedAt);
      return elapsed > expected;
    });
    setOverAlerts(overDue);
  }

  checkOverdue();
  timeRef.current = setInterval(checkOverdue,60000);
  return ()=>clearInterval(timeRef.current);
},[entries]);


async function fetchEntries() {
try {
const response = await getAllLogs();
const data = Array.isArray(response.data) ? response.data : [];
setEntries(data);
} catch (err) {
console.error("Failed to fetch entries", err);
}
}

//Sidebar filter
const filteredEntries = entries.filter((e)=>{
const q = searchQuery.toLowerCase();
const matchSearch =
e.visitorName?.toLowerCase().includes(q)||
e.vehicleNumber?.toLowerCase().includes(q)||
e.phoneNumber?.includes(q);

const matchTab =
filterTab==="ALL" ? true :
filterTab==="INSIDE" ? e.status === "INSIDE":
filterTab==="OUTSIDE" ?["TEST_DRIVE","SERVICE","DELIVERY"].includes(e.status):
filterTab ==="EXITED" ?e.status==="EXITED"||e.status==="PERMANENT" : true;

return matchSearch&& matchTab;
});

//Base form handler
const handleBaseChange = (e)=>{
setBaseForm({...baseForm, [e.target.name] : e.target.value});
setUiMessage({type:"",text:""});
}
const handlePhoneChange = (e) => {
const { name, value } = e.target;
const updatedForm = { ...baseForm, [name]: value };
setBaseForm(updatedForm);

const fullNumber = `${updatedForm.countryCode}${updatedForm.phoneNumber}`;
if (updatedForm.phoneNumber) {
if (!isValidPhoneNumber(fullNumber)) {
setPhoneError("Invalid phone number");
} else {
setPhoneError("");
}
} else {
setPhoneError("");
}
};

const handleBaseNext =(e)=>{
e.preventDefault();
const full = baseForm.phoneNumber.startsWith("+")?baseForm.phoneNumber:
`${baseForm.countryCode}${baseForm.phoneNumber}`;
if(!isValidPhoneNumber(full.trim())){
setPhoneError("purpose");
return;
}
setFormStep("purpose");
setUiMessage({type:"", text:""});
};

//purpose from handlers
const handlePurposeChange =(e) =>{
setPurposeForm({...purposeForm,[e.target.name] : e.target.value});
};

const handleFinalSubmit = async (e) => {
e.preventDefault();
setLoading(true);
setUiMessage({ type: "", text: "" });

const cleanPhoneNumber = baseForm.phoneNumber.trim();
const fullNumber = cleanPhoneNumber.startsWith("+")
? cleanPhoneNumber
: `${baseForm.countryCode}${cleanPhoneNumber}`;

if (!isValidPhoneNumber(fullNumber)) {
setPhoneError("Invalid phone number or country code");
setLoading(false);
return;
}

try {
await createLogs("/entrylogs", {
...baseForm,
...purposeForm,
visitorName: baseForm.visitorName.trim(),
idCardNumber: baseForm.idCardNumber.trim(),
vehicleNumber: baseForm.vehicleNumber.trim(),
recordedBy: baseForm.recordedBy.trim(),
phoneNumber: cleanPhoneNumber,
});

setUiMessage({ type: "success", text: "Visitor entry recorded successfully!" });
//this already provides u with -ve sign
setBaseForm({ ...initialBaseForm, enteredAt: getLocalDateTime()});
setPurposeForm(initialPurposeForm);
setFormStep("base");

await fetchEntries();
} catch (err) {
console.error("Create entry failed:", err.response?.data || err.message);
const errMsg = err.response?.data?.message || "Failed to record entry. Try again.";
setUiMessage({ type: "error", text: errMsg });
} finally {
setLoading(false);
}
};

//Exit Model
const handleMarkExit = (entry) => {
setExitModal({entry});
setExitType("REGULAR");
setExitReason("");
setUiMessage({type:"",text:""});
};

// const handleChange = (e) => {
// setForm({ ...form, [e.target.name]: e.target.value });
// setUiMessage({ type: "", text: "" });
// };


const handleConfirmExit = async (e) => {
e.preventDefault();
const {entry} = exitModal;
try {
const response = await exitvisitor(entry._id, {
exitType,
exitReason,
expectedReturnAt: exitType!=="REGULAR" && exitType !== "PERMANENT"? new Date (Date.now() + (EXPECTED_DURATION[exitType]||60)*60000).toISOString():null,
});
if (response.status === 200) {
setUiMessage({ type: "success", text: "Vehicle successfully dispatched for Test Drive!" });
// setActiveTestDriverId(null);
// setDriverName("");
// setCustomerName("");
setExitModal(null);
await fetchEntries();
}
} catch (err) {
console.error("Failed to dispatch", err);
setUiMessage({ type: "error", text: err.response?.data?.message || "Server error" });
}
};

const handleLogout = () => {
localStorage.removeItem("token");
navigate("/login");
};

const handlePhotoUploaded = (updatedEntry) => {
setSelectedEntry(updatedEntry);
setEntries((currentEntries) =>
currentEntries.map((entry) => entry._id === updatedEntry._id ? updatedEntry : entry)
);
setUiMessage({ type: "success", text: "Photo uploaded successfully." });
};

//feature of adding todays entries , check flagged vehicle and overdue one 

const today = new Date().toDateString();

const stats = {
  //todays entry 
  totalEntryToday : entries.filter(e=>
    new Date (e.enteredAt).toDateString() === today
  ).length,
//currentlt inside 
currentlyInside : entries.filter(e => 
  e.status === "INSIDE"
).length,

//flagged 
flagged : entries.filter(e=> 
  e.isFlagged === true 
).length,

overdue : overdueAlerts.length
};

//Render
return (
<div style={styles.page}>
<style>{`
@keyframes dashboardFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes softPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.28); }
  50% { box-shadow: 0 0 0 7px rgba(231, 76, 60, 0); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
button, input, select, textarea {
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, background-color 160ms ease;
}
button:hover {
  transform: translateY(-1px);
}
button:active {
  transform: translateY(0);
}
input:focus, select:focus, textarea:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
`}</style>

{/* Navbar */}
<div style={styles.navbar}>
<h2 style={styles.navTitle}>Guard Dashboard</h2>
<div style={{ display: "flex", alignItems: "center", gap: "16px"}}>
{overdueAlerts.length > 0 && (
<span style={styles.overdueChip}>
{overdueAlerts.length} vehicle{overdueAlerts.length > 1 ? "s" : ""} overdue
</span>
)}
<button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
</div>
</div>

{/* ── Overdue Banner ── */}
{overdueAlerts.length > 0 && (
<div style={styles.overdueBanner}>
<strong>⚠️ Overdue Vehicles:</strong>{" "}
{overdueAlerts.map((e) => (
<span key={e._id} style={styles.overdueTag}>
{e.vehicleNumber} ({getElapsedMinutes(e.exitedAt)}m elapsed)
</span>
))}
</div>
)}

<div style ={styles.statsBar}>
  {[
    {label : "Total Today" , value : stats.totalEntryToday,color:"#1a1a2e",bg:"#f0f4ff"},
    {label : "Currently Inside" , value : stats.currentlyInside,color:"#27ae60",bg:"#e8f5e9"},
    {label : "Flagged" , value : stats.flagged,color:"#e67e22",bg:"#fff8e1"},
    {label : "Overdue" , value : stats.overdue,color:"#e74c3c",bg:"#fdecea"},
  ].map((item,index)=>(
    <div 
    key={item.label}
    style={{
      ...styles.statCard,
      backgroundColor:item.bg,
      animationDelay: `${index * 70}ms`,
    }}>
   <p
   style={{
    ...styles.statValue,
    color:item.color,
   }}>
    {item.value}
   </p>
   <p
   style={styles.statLabel}>
    {item.label}
   </p>

    </div>
  ))}
</div>
{/* ── 3-column layout ── */}
<div style={styles.layout}>

{/* ════ SIDEBAR ════ */}
<div style={styles.sidebar}>
<div style={styles.searchBox}>
<input
type="text"
placeholder="🔍 Search vehicle, name, phone..."
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
style={styles.searchInput}
/>
</div>

{/* Filter tabs */}
<div style={styles.filterTabs}>
{["ALL", "INSIDE", "OUTSIDE", "EXITED"].map((tab) => (
<button
key={tab}
onClick={() => setFilterTab(tab)}
style={{
...styles.filterTab,
...(filterTab === tab ? styles.filterTabActive : {}),
}}
>
{tab}
</button>
))}
</div>

{/* Entry list */}
<div style={styles.entryList}>
{filteredEntries.length === 0 ? (
<p style={{ color: "#999", fontSize: "13px", padding: "16px" }}>No entries found.</p>
) : (
filteredEntries.map((entry) => {
const elapsed = getElapsedMinutes(entry.exitedAt);
const expected = EXPECTED_DURATION[entry.exitType] || 60;
const timer = entry.exitedAt && entry.status !== "INSIDE" && entry.status !== "EXITED" && entry.status !== "PERMANENT"
? getTimerColor(elapsed, expected)
: null;

return (
<div
key={entry._id}
onClick={() => setSelectedEntry(entry)}
style={{
...styles.entryCard,
...(entry.isFlagged ? styles.entryCardFlagged : {}),
...(selectedEntry?._id === entry._id ? styles.entryCardActive : {}),
}}
>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
<div>
<p style={styles.entryVehicle}>{entry.vehicleNumber}</p>
<p style={styles.entryName}>{entry.visitorName}</p>
<p style={styles.entryTime}>
{new Date(entry.enteredAt).toLocaleString("en-IN", {
day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
})}
</p>
</div>
<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
<StatusBadge status={entry.status} />
{entry.isFlagged && <FlagBadge severity={entry.flagSeverity} />}
{timer && (
<span style={{
fontSize: "10px", fontWeight: "700", padding: "2px 6px",
borderRadius: "8px", backgroundColor: timer.bg, color: timer.text,
}}>
{timer.label} · {elapsed}m
</span>
)}
</div>
</div>
</div>
);
})
)}
</div>
</div>

{/* ════ MAIN PANEL ════ */}
<div style={styles.mainPanel}>

{/* ── uiMessage banner ── */}
{uiMessage.text && (
<div style={{
...styles.msgBanner,
backgroundColor: uiMessage.type === "error" ? "#fdecea" : "#e8f5e9",
color: uiMessage.type === "error" ? "#c0392b" : "#27ae60",
borderLeft: `4px solid ${uiMessage.type === "error" ? "#e74c3c" : "#2ecc71"}`,
}}>
{uiMessage.text}
</div>
)}

{/* ════ STEP 1 — BASE FORM ════ */}
{formStep === "base" && (
<div style={styles.card}>
<h3 style={styles.cardTitle}>
<span style={styles.stepBadge}>1</span> Vehicle & Visitor Details
</h3>

{/* Vehicle type toggle */}
<div style={styles.fieldGroup}>
<label style={styles.label}>Vehicle Type</label>
<div style={{ display: "flex", gap: "10px" }}>
{VEHICLE_TYPES.map((v) => (
<button
key={v.id}
type="button"
onClick={() => setBaseForm({ ...baseForm, vehicleType: v.id })}
style={{
flex: 1, padding: "12px 8px",
border: baseForm.vehicleType === v.id ? "2px solid #1a1a2e" : "1px solid #ddd",
borderRadius: "8px",
backgroundColor: baseForm.vehicleType === v.id ? "#1a1a2e" : "#fff",
color: baseForm.vehicleType === v.id ? "#fff" : "#333",
cursor: "pointer", fontSize: "14px", fontWeight: "500",
transition: "all 0.15s",
}}
>
{v.icon} {v.label}
</button>
))}
</div>
</div>

<form onSubmit={handleBaseNext}>

{/* ── Common fields ── */}
<div style={styles.row2}>
<div style={styles.fieldGroup}>
<label style={styles.label}>Visitor / Driver Name *</label>
<input
type="text" name="visitorName" value={baseForm.visitorName}
onChange={handleBaseChange} placeholder="e.g. Rahul Sharma"
required style={styles.input}
/>
</div>
<div style={styles.fieldGroup}>
<label style={styles.label}>ID Card Number *</label>
<input
type="text" name="idCardNumber" value={baseForm.idCardNumber}
onChange={handleBaseChange} placeholder="Aadhaar / Licence / Passport"
required style={styles.input}
/>
</div>
</div>

<div style={styles.row2}>
<div style={styles.fieldGroup}>
<label style={styles.label}>Vehicle Number *</label>
<input
type="text" name="vehicleNumber" value={baseForm.vehicleNumber}
onChange={handleBaseChange} placeholder="e.g. RJ14 BS 0001"
required style={styles.input}
/>
</div>
<div style={styles.fieldGroup}>
<label style={styles.label}>Model & Colour</label>
<input
type="text" name="vehicleModel" value={baseForm.vehicleModel}
onChange={handleBaseChange} placeholder="e.g. Swift Dzire, White"
style={styles.input}
/>
</div>
</div>


{/* Two Wheeler Specific */}
{baseForm.vehicleType==="TWO_WHEELER"&&(
  <>
  <div style={styles.row2}>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>RC BOOK NUMBER *</label>
      <input
      type="text" name ="rcBookNo" value={baseForm.rcBookNo}
      onChange={handleBaseChange} placeholder="Registration Number"
      required style={styles.input}
      />
      <p style={styles.hint}>Registration Certificate issued by RTO - mandatory</p>
    </div>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Insurance Valid Till *</label>
      <input
      type="date" name="insuranceValidTill" value={baseForm.insuranceValidTill} placeholder="Insurance Validity"
      onChange={handleBaseChange} required style={styles.input}
      />
      <p style={styles.hint}>Third Party Insurance mandatory under MV act</p>
    </div>
  </div>
  
  <div style={styles.row2}>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Helemt Worn? *</label>
      <select
        name="helmetWorn" value ={baseForm.helmetWorn}
        onChange = {handleBaseChange} required style ={styles.input}
        >
          <option value ="" >Select</option>
          <option value ="yes" >Yes</option>
          <option value ="no" >No</option>
      </select>
    </div>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Pillion Rider</label>
      <input
      type="text" name="pillionRider" value={baseForm.pillionRider}
      onChange={handleBaseChange} placeholder="If carrying pillion"
      style={styles.input}
      />
    </div>
  </div>
  {/* here if pillion driver exist then check whther he is wearing helmet or not */}
  {baseForm.pillionRider && (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Pillion Helmet</label>
      <select
      name="pillionHelmet" value={baseForm.pillionHelmet}
      onChange={handleBaseChange} style={styles.input}
      >
        <option value ="">Select</option>
        <option value ="yes">Yes</option>
        <option value ="no">No</option>
      </select>
    </div>
  )}
  </>
)}

{/* Three Wheeler  */}

{baseForm.vehicleType==="THREE_WHEELER"&&(
  <>
  <div style={styles.row2}>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>RC BOOK NUMBER *</label>
      <input
      type="text" name ="rcBookNo" value={baseForm.rcBookNo}
      onChange={handleBaseChange} placeholder="Registration Number"
      required style={styles.input}
      />
      <p style={styles.hint}>Registration Certificate issued by RTO - mandatory</p>
    </div>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Permit Number *</label>
      <input
      type="text" name="permitNumber" value={baseForm.permitNumber} placeholder="RTO permit Number"
      onChange={handleBaseChange} required style={styles.input}
      />
      <p style={styles.hint}>Commercial permit required for tempo/auto</p>
    </div>
  </div>
  
  <div style={styles.row2}>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Passenger Count</label>
      <input 
      type="number" name="passengerCount" value={baseForm.passengerCount}
      onChange={handleBaseChange} placeholder="e.g. 3"
      required min ="1" style={styles.input}
      />
    </div>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Insurance Valid Till </label>
      <input
      type="date" name="insuranceValidTill" value={baseForm.insuranceValidTill}
      onChange={handleBaseChange} placeholder="Insurance Validity"
      style={styles.input}
      />
     <p style={styles.hint}>Optional but Recommende</p>
    </div>
  </div>
 
  </>
)}

{/* Four Wheeler  */}

{baseForm.vehicleType==="FOUR_WHEELER"&&(
  <>
  <div style={styles.row2}>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>RC BOOK NUMBER *</label>
      <input
      type="text" name ="rcBookNo" value={baseForm.rcBookNo}
      onChange={handleBaseChange} placeholder="Registration Number"
      required style={styles.input}
      />
      <p style={styles.hint}>Registration Certificate issued by RTO - mandatory</p>
    </div>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Insurance Valid Till *</label>
      <input
      type="date" name="insuranceValidTill" value={baseForm.insuranceValidTill} 
      onChange={handleBaseChange} required style={styles.input}
      />
      <p style={styles.hint}>Third Party Insurance under MV act</p>
    </div>
  </div>
  
  <div style={styles.row2}>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Passenger Count</label>
      <input 
      type="number" name="passengerCount" value={baseForm.passengerCount}
      onChange={handleBaseChange} placeholder="e.g. 3"
      required min ="1" style={styles.input}
      />
    </div>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Vehicle Color </label>
      <input
      type="text" name="vehicleColor" value={baseForm.vehicleColor}
      onChange={handleBaseChange} placeholder="Vehicle Color"
      style={styles.input}
      />
     <p style={styles.hint}>Optional but Recommende</p>
    </div>
  </div>
 
  </>
)}
{/* Heavy Vehicle  */}

{baseForm.vehicleType==="HEAVY_VEHICLE"&&(
  <>
  <div style={styles.row2}>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>RC BOOK NUMBER *</label>
      <input
      type="text" name ="rcBookNo" value={baseForm.rcBookNo}
      onChange={handleBaseChange} placeholder="Registration Number"
      required style={styles.input}
      />
    </div>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Driver Licence *</label>
      <input
      type="text" name="driverLicenceNumber" value={baseForm.driverLicenceNumber} 
      onChange={handleBaseChange} placeholder="e.g. RJ1420110012345"
      required style={styles.input}
      />
      <p style={styles.hint}>Heavy vehicle licence is mandatory under MV act</p>
    </div>
  </div>
  
  <div style={styles.row2}>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Load Type</label>
      <select
      name="loadType" value={baseForm.loadType}
      onChange={handleBaseChange} required style={styles.input}
      >
        <option value="">Select load Types</option>
        <option value="GOODS">Goods</option>
        <option value="RAW_MATERIAL">Raw Material</option>
        <option value="EMPTY">Empty</option>
      </select>
    </div>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Load Weight</label>
      <input
      type="number" name="loadWeight" value={baseForm.loadWeight}
      onChange={handleBaseChange} placeholder="e.g. 5000"
      required style={styles.input}
      />
    </div>
      </div>
  
 
 <div style={styles.row2}>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Vendor/Company Number</label>
      <input
      type="text" name="vendorNumber" value={baseForm.vendorNumber}
      onChange={handleBaseChange} placeholder="Vendor contact or company Id "
       style={styles.input}
      />
    </div>
    <div style={styles.fieldGroup}>
      <label style={styles.label}>Challan/Invoice Number</label>
      <input
      type="text" name="challanNumber" value={baseForm.challanNumber}
      onChange={handleBaseChange} placeholder="Optional"
       style={styles.input}
      />
    </div>
    </div>
<div style={styles.fieldGroup}>
      <label style={styles.label}>Insurance Valid Till</label>
      <input
      type="date" name="insuranceValidTill" value={baseForm.insuranceValidTill}
      onChange={handleBaseChange} 
       style={styles.input}
      />
      <p style={styles.hint}>Optional But Recommended </p>
    </div>

  </>
)}



{/* ── Entry time + Guard ── */}
<div style={styles.row2}>
<div style={styles.fieldGroup}>
<label style={styles.label}>Entry Date & Time *</label>
<input
type="datetime-local" name="enteredAt" value={baseForm.enteredAt}
onChange={handleBaseChange} required style={styles.input}
/>
</div>
<div style={styles.fieldGroup}>
<label style={styles.label}>Recorded By *</label>
<input
type="text" name="recordedBy" value={baseForm.recordedBy}
onChange={handleBaseChange} placeholder="Guard name"
required style={styles.input}
/>
</div>
</div>

{/* ── Phone ── */}
<div style={styles.fieldGroup}>
<label style={styles.label}>Phone Number *</label>
<div style={{ display: "flex", gap: "10px" }}>
<select
name="countryCode" value={baseForm.countryCode}
onChange={handlePhoneChange}
style={{ ...styles.input, width: "150px", cursor: "pointer", flexShrink: 0 }}
>
{Country_Codes.map((c) => (
<option key={c.code} value={c.code}>
{c.flag} {c.code} {c.name}
</option>
))}
</select>
<input
type="tel" name="phoneNumber" value={baseForm.phoneNumber}
onChange={handlePhoneChange} placeholder="e.g. 9876543210"
required style={styles.input}
/>
</div>
{phoneError && (
<p style={{ color: "#e74c3c", fontSize: "12px", marginTop: "6px" }}>{phoneError}</p>
)}
</div>

<button type="submit" style={styles.nextBtn}>
Next: Select Purpose →
</button>
</form>
</div>
)}

{/* ════ STEP 2 — PURPOSE FORM ════ */}
{formStep === "purpose" && (
<div style={styles.card}>
<div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
<button
onClick={() => setFormStep("base")}
style={styles.backBtn}
>
← Back
</button>
<h3 style={{ ...styles.cardTitle, margin: 0 }}>
<span style={styles.stepBadge}>2</span> Purpose of Visit
</h3>
</div>

{/* Vehicle summary chip */}
<div style={styles.summaryChip}>
{VEHICLE_TYPES.find(v => v.id === baseForm.vehicleType)?.icon}{" "}
<strong>{baseForm.vehicleNumber}</strong> · {baseForm.visitorName}
</div>

{/* Purpose tiles */}
<div style={styles.fieldGroup}>
<label style={styles.label}>Select Purpose *</label>
<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
{PURPOSE_OPTIONS.map((p) => (
<button
key={p.value}
type="button"
onClick={() => setPurposeForm({ ...purposeForm, purpose: p.value })}
style={{
padding: "14px 8px",
border: purposeForm.purpose === p.value ? "2px solid #1a1a2e" : "1px solid #ddd",
borderRadius: "8px",
backgroundColor: purposeForm.purpose === p.value ? "#1a1a2e" : "#fff",
color: purposeForm.purpose === p.value ? "#fff" : "#333",
cursor: "pointer", fontSize: "13px", fontWeight: "500",
transition: "all 0.15s",
display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
}}
>
<span style={{ fontSize: "22px" }}>{p.icon}</span>
{p.label}
</button>
))}
</div>
</div>

{/* ── Purpose-specific fields ── */}
{purposeForm.purpose && (
<form onSubmit={handleFinalSubmit}>

{/* TEST DRIVE */}
{purposeForm.purpose === "TEST_DRIVE" && (
<>
<div style={styles.purposeSection}>
<p style={styles.purposeSectionTitle}>🚗 Test Drive Details</p>
<p style={styles.purposeHint}>Expected duration: 60 minutes</p>
</div>
<div style={styles.row2}>
<div style={styles.fieldGroup}>
<label style={styles.label}>Assigned Driver / Consultant *</label>
<input
type="text" name="driverName" value={purposeForm.driverName}
onChange={handlePurposeChange} placeholder="Driver name"
required style={styles.input}
/>
</div>
<div style={styles.fieldGroup}>
<label style={styles.label}>Prospect Customer Name *</label>
<input
type="text" name="customerName" value={purposeForm.customerName}
onChange={handlePurposeChange} placeholder="Customer name"
required style={styles.input}
/>
</div>
</div>
</>
)}

{/* SERVICE */}
{purposeForm.purpose === "SERVICE" && (
<>
<div style={styles.purposeSection}>
<p style={styles.purposeSectionTitle}>🔧 Service / Repair Details</p>
<p style={styles.purposeHint}>Expected duration: up to 8 hours</p>
</div>
<div style={styles.fieldGroup}>
<label style={styles.label}>Customer Complaint *</label>
<textarea
name="customerComplaint" value={purposeForm.customerComplaint}
onChange={handlePurposeChange}
placeholder="Describe the issue in detail e.g. Engine noise, AC not cooling..."
required
rows={3}
style={{ ...styles.input, resize: "vertical" }}
/>
</div>
<div style={styles.row2}>
<div style={styles.fieldGroup}>
<label style={styles.label}>Service Type *</label>
<select
name="serviceType" value={purposeForm.serviceType}
onChange={handlePurposeChange} required style={styles.input}
>
<option value="">Select type</option>
<option value="PERIODIC">Periodic Service</option>
<option value="REPAIR">Repair</option>
<option value="BODY_WORK">Body Work / Denting</option>
<option value="ELECTRICAL">Electrical</option>
<option value="AC">AC Service</option>
<option value="TYRES">Tyres / Wheels</option>
<option value="WARRANTY">Warranty Claim</option>
<option value="OTHER">Other</option>
</select>
</div>
<div style={styles.fieldGroup}>
<label style={styles.label}>Estimated Hours *</label>
<input
type="number" name="estimatedTime" value={purposeForm.estimatedTime}
onChange={handlePurposeChange} placeholder="e.g. 4"
required min="1" max="48" style={styles.input}
/>
</div>
</div>
<div style={styles.fieldGroup}>
<label style={styles.label}>Service Advisor Name *</label>
<input
type="text" name="serviceAdvisor" value={purposeForm.serviceAdvisor}
onChange={handlePurposeChange} placeholder="Advisor name"
required style={styles.input}
/>
</div>
</>
)}

{/* DELIVERY */}
{purposeForm.purpose === "DELIVERY" && (
<>
<div style={styles.purposeSection}>
<p style={styles.purposeSectionTitle}>📦 Delivery Details</p>
<p style={styles.purposeHint}>Expected duration: 2 hours</p>
</div>
<div style={styles.row2}>
<div style={styles.fieldGroup}>
<label style={styles.label}>Item Description *</label>
<input
type="text" name="itemDescription" value={purposeForm.itemDescription}
onChange={handlePurposeChange} placeholder="e.g. Spare parts, Documents"
required style={styles.input}
/>
</div>
<div style={styles.fieldGroup}>
<label style={styles.label}>Recipient Name *</label>
<input
type="text" name="recipientName" value={purposeForm.recipientName}
onChange={handlePurposeChange} placeholder="Who receives this"
required style={styles.input}
/>
</div>
</div>
</>
)}

{/* ENQUIRY or VISIT */}
{(purposeForm.purpose === "ENQUIRY" || purposeForm.purpose === "VISIT") && (
<>
<div style={styles.purposeSection}>
<p style={styles.purposeSectionTitle}>
{purposeForm.purpose === "ENQUIRY" ? "💬 Enquiry Details" : "👤 Visit Details"}
</p>
<p style={styles.purposeHint}>Expected duration: 1 hour</p>
</div>
<div style={styles.row2}>
<div style={styles.fieldGroup}>
<label style={styles.label}>Person to Meet *</label>
<input
type="text" name="personToMeet" value={purposeForm.personToMeet}
onChange={handlePurposeChange} placeholder="Name of the person"
required style={styles.input}
/>
</div>
<div style={styles.fieldGroup}>
<label style={styles.label}>Department</label>
<input
type="text" name="department" value={purposeForm.department}
onChange={handlePurposeChange} placeholder="e.g. Sales, HR, Accounts"
style={styles.input}
/>
</div>
</div>
</>
)}

{uiMessage.text && (
<div style={{
...styles.msgBanner,
backgroundColor: uiMessage.type === "error" ? "#fdecea" : "#e8f5e9",
color: uiMessage.type === "error" ? "#c0392b" : "#27ae60",
borderLeft: `4px solid ${uiMessage.type === "error" ? "#e74c3c" : "#2ecc71"}`,
}}>
{uiMessage.text}
</div>
)}

<button type="submit" disabled={loading} style={styles.submitBtn}>
{loading ? "Recording..." : "✅ Confirm & Record Entry"}
</button>
</form>
)}
</div>
)}

{/* ════ SELECTED ENTRY DETAIL ════ */}
{selectedEntry && (
<div style={{ ...styles.card, marginTop: "20px" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
<h3 style={{ ...styles.cardTitle, margin: 0 }}>
📋 Entry Detail — {selectedEntry.vehicleNumber}
</h3>
<button
onClick={() => setSelectedEntry(null)}
style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#999" }}
>
✕
</button>
</div>

<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", fontSize: "13px" }}>
{[
["Visitor", selectedEntry.visitorName],
["Vehicle No.", selectedEntry.vehicleNumber],
["Vehicle Type", selectedEntry.vehicleType || "—"],
["Phone", selectedEntry.status === "INSIDE" ? `${selectedEntry.countryCode}${selectedEntry.phoneNumber}` : "***"],
["ID Card", selectedEntry.idCardNumber],
["Purpose", selectedEntry.purpose || "—"],
["Entered At", new Date(selectedEntry.enteredAt).toLocaleString()],
["Recorded By", selectedEntry.recordedBy],
["Status", <StatusBadge key="s" status={selectedEntry.status} />],
selectedEntry.isFlagged && ["Risk", <FlagBadge key="f" severity={selectedEntry.flagSeverity} />],
selectedEntry.isFlagged && ["Flag Reason", selectedEntry.flagReason || "Suspicious activity detected"],
selectedEntry.isFlagged && selectedEntry.flaggedAt && ["Flagged At", new Date(selectedEntry.flaggedAt).toLocaleString()],
selectedEntry.exitedAt && ["Exited At", new Date(selectedEntry.exitedAt).toLocaleString()],
selectedEntry.serviceDetails?.complaint && ["Complaint", selectedEntry.serviceDetails.complaint],
selectedEntry.serviceDetails?.serviceAdvisor && ["Advisor", selectedEntry.serviceDetails.serviceAdvisor],
].filter(Boolean).map(([k, v]) => (
<div key={k}>
<span style={{ color: "#888", display: "block" }}>{k}</span>
<span style={{ fontWeight: "500", color: "#1a1a2e" }}>{v}</span>
</div>
))}
</div>

<div style={styles.photoGrid}>
<PhotoCapture
label="Visitor Photo"
fieldName="visitorPhoto"
currentPhoto={selectedEntry.visitorPhoto}
entryId={selectedEntry._id}
onUploaded={handlePhotoUploaded}
/>
<PhotoCapture
label="ID Card Photo"
fieldName="idCardPhoto"
currentPhoto={selectedEntry.idCardPhoto}
entryId={selectedEntry._id}
onUploaded={handlePhotoUploaded}
/>
<PhotoCapture
label="Vehicle Photo"
fieldName="vehiclePhoto"
currentPhoto={selectedEntry.vehiclePhoto}
entryId={selectedEntry._id}
onUploaded={handlePhotoUploaded}
/>
</div>

{/* Exit button only if INSIDE */}
{selectedEntry.status === "INSIDE" && (
<button
onClick={() => handleMarkExit(selectedEntry)}
style={{ ...styles.submitBtn, marginTop: "20px", backgroundColor: "#e74c3c" }}
>
Mark Exit for this Vehicle
</button>
)}
</div>
)}

</div>
</div>

{/* EXIT MODAL */}
{exitModal && (
<div style={styles.modalOverlay}>
<div style={styles.modalContent}>
<h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#1a1a2e" }}>
Mark Exit — {exitModal.entry.vehicleNumber}
</h3>
<p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#888" }}>
{exitModal.entry.visitorName}
</p>

<form onSubmit={handleConfirmExit}>

{/* Exit type */}
<div style={styles.fieldGroup}>
<label style={styles.label}>Exit Type *</label>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
{[
{ val: "REGULAR", label: "Regular Exit", icon: "✅", hint: "Left the premises" },
{ val: "TEST_DRIVE", label: "Test Drive", icon: "🚗", hint: "Returns in ~1 hr" },
{ val: "SERVICE", label: "Service Out", icon: "🔧", hint: "Returns in ~8 hrs" },
{ val: "PERMANENT", label: "Permanent Exit", icon: "🚫", hint: "Will not return" },
].map((opt) => (
<button
key={opt.val}
type="button"
onClick={() => setExitType(opt.val)}
style={{
padding: "10px",
border: exitType === opt.val ? "2px solid #1a1a2e" : "1px solid #ddd",
borderRadius: "8px",
backgroundColor: exitType === opt.val ? "#1a1a2e" : "#fff",
color: exitType === opt.val ? "#fff" : "#333",
cursor: "pointer", fontSize: "12px", textAlign: "left",
}}
>
<span style={{ display: "block", fontSize: "18px", marginBottom: "2px" }}>{opt.icon}</span>
<strong>{opt.label}</strong>
<span style={{ display: "block", opacity: 0.7, fontSize: "11px" }}>{opt.hint}</span>
</button>
))}
</div>
</div>

{/* Permanent exit reason */}
{exitType === "PERMANENT" && (
<div style={styles.fieldGroup}>
<label style={styles.label}>Reason for Permanent Exit *</label>
<select
value={exitReason} onChange={(e) => setExitReason(e.target.value)}
required style={styles.input}
>
<option value="">Select reason</option>
<option value="SOLD">Vehicle Sold</option>
<option value="TRANSFERRED">Transferred</option>
<option value="TOWED">Towed Away</option>
<option value="OTHER">Other</option>
</select>
</div>
)}

{/* Duration info */}
{(exitType === "TEST_DRIVE" || exitType === "SERVICE") && (
<div style={{
padding: "10px 14px", borderRadius: "8px",
backgroundColor: "#fff8e1", color: "#8a5e00",
fontSize: "13px", marginBottom: "16px",
}}>
⏱ Expected return:{" "}
<strong>
{new Date(Date.now() + (EXPECTED_DURATION[exitType] || 60) * 60000)
.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
</strong>
{" "}· Alert if overdue
</div>
)}

<div style={{ display: "flex", gap: "10px" }}>
<button type="submit" style={styles.submitBtn}>Confirm Exit</button>
<button
type="button"
onClick={() => setExitModal(null)}
style={{ ...styles.submitBtn, backgroundColor: "#95a5a6" }}
>
Cancel
</button>
</div>
</form>
</div>
</div>
)}
<GuardianAssistant />
</div>
);
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
page: {
minHeight: "100vh",
backgroundColor: "#f6f8fb",
color: "#172033",
fontFamily: "'Inter', 'Segoe UI', sans-serif",
},
navbar: {
display: "flex", justifyContent: "space-between", alignItems: "center",
backgroundColor: "#111827", padding: "14px 24px", color: "#fff",
position: "sticky", top: 0, zIndex: 100,
boxShadow: "0 10px 28px rgba(17,24,39,0.14)",
},
navTitle: { margin: 0, fontSize: "18px", fontWeight: "700", letterSpacing: "0" },
logoutBtn: {
padding: "9px 16px", backgroundColor: "#dc2626", color: "#fff",
border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px",
fontWeight: "700", boxShadow: "0 8px 18px rgba(220,38,38,0.22)",
},
overdueChip: {
padding: "6px 12px", backgroundColor: "#dc2626", color: "#fff",
borderRadius: "20px", fontSize: "12px", fontWeight: "600",
animation: "softPulse 1.8s infinite",
},
overdueBanner: {
backgroundColor: "#fff1f2", borderLeft: "4px solid #dc2626",
padding: "10px 24px", fontSize: "13px", color: "#c0392b",
display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center",
},
overdueTag: {
backgroundColor: "#dc2626", color: "#fff",
padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600",
},

// Layout
layout: {
display: "grid",
gridTemplateColumns: "300px minmax(0, 1fr)",
gap: "0",
minHeight: "calc(100vh - 52px)",
},

// Sidebar
sidebar: {
backgroundColor: "#fff",
borderRight: "1px solid #e5e7eb",
display: "flex", flexDirection: "column",
overflowY: "auto",
boxShadow: "8px 0 24px rgba(15,23,42,0.03)",
},
searchBox: { padding: "18px 14px 10px 14px" },
searchInput: {
width: "100%", padding: "11px 13px", border: "1px solid #d8dee8",
borderRadius: "8px", fontSize: "13px", boxSizing: "border-box", outline: "none",
backgroundColor: "#f8fafc",
},
filterTabs: {
display: "flex", borderBottom: "1px solid #eef1f5", padding: "0 10px",
},
filterTab: {
flex: 1, padding: "10px 4px", border: "none", background: "none",
cursor: "pointer", fontSize: "11px", fontWeight: "700", color: "#8a94a6",
borderBottom: "2px solid transparent",
},
filterTabActive: {
color: "#111827", borderBottom: "2px solid #2563eb",
},
entryList: { flex: 1, overflowY: "auto" },
entryCard: {
padding: "13px 14px", borderBottom: "1px solid #f0f3f7",
cursor: "pointer", transition: "background 0.16s ease, border-color 0.16s ease, transform 0.16s ease",
borderLeft: "3px solid transparent",
animation: "slideInLeft 260ms ease both",
},
entryCardFlagged: { borderLeft: "3px solid #dc2626", backgroundColor: "#fff7f7" },
entryCardActive: { backgroundColor: "#eef4ff", borderLeft: "3px solid #2563eb" },
entryVehicle: { margin: "0 0 3px 0", fontWeight: "700", fontSize: "13px", color: "#111827" },
entryName: { margin: "0 0 3px 0", fontSize: "12px", color: "#4b5563" },
entryTime: { margin: 0, fontSize: "11px", color: "#94a3b8" },

// Main panel
mainPanel: { padding: "24px", overflowY: "auto", animation: "dashboardFadeIn 320ms ease both" },
card: {
backgroundColor: "#fff", borderRadius: "10px",
padding: "24px", boxShadow: "0 12px 30px rgba(15,23,42,0.07)",
border: "1px solid #edf1f6",
animation: "dashboardFadeIn 280ms ease both",
},
cardTitle: {
margin: "0 0 20px 0", fontSize: "16px", fontWeight: "600",
color: "#111827", display: "flex", alignItems: "center", gap: "10px",
},
stepBadge: {
width: "26px", height: "26px", borderRadius: "8px",
backgroundColor: "#2563eb", color: "#fff",
display: "inline-flex", alignItems: "center", justifyContent: "center",
fontSize: "13px", fontWeight: "700", flexShrink: 0,
},

// Form
row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
fieldGroup: { marginBottom: "16px" },
label: {
display: "block", marginBottom: "6px",
fontSize: "12px", fontWeight: "700", color: "#5b6472",
textTransform: "uppercase", letterSpacing: "0.02em",
},
input: {
width: "100%", padding: "11px 12px", border: "1px solid #d8dee8",
borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none",
backgroundColor: "#fbfcfe", color: "#172033",
},
nextBtn: {
width: "100%", padding: "13px", backgroundColor: "#111827",
color: "#fff", border: "none", borderRadius: "8px",
fontSize: "15px", cursor: "pointer", fontWeight: "600", marginTop: "8px",
boxShadow: "0 10px 22px rgba(17,24,39,0.18)",
},
backBtn: {
padding: "8px 14px", backgroundColor: "#eef2f7",
color: "#374151", border: "1px solid #d9e1ec", borderRadius: "8px",
cursor: "pointer", fontSize: "13px", fontWeight: "500",
},
submitBtn: {
width: "100%", padding: "13px", backgroundColor: "#16a34a",
color: "#fff", border: "none", borderRadius: "8px",
fontSize: "15px", cursor: "pointer", fontWeight: "600",
boxShadow: "0 10px 22px rgba(22,163,74,0.2)",
},

// Purpose
summaryChip: {
display: "inline-block", padding: "8px 16px",
backgroundColor: "#eef4ff", borderRadius: "18px",
fontSize: "13px", color: "#172033", marginBottom: "20px",
border: "1px solid #dbe7ff",
},
purposeSection: {
padding: "12px 16px", backgroundColor: "#f8fafc",
borderRadius: "8px", marginBottom: "16px",
borderLeft: "4px solid #2563eb",
},
purposeSectionTitle: { margin: "0 0 4px 0", fontWeight: "700", fontSize: "14px", color: "#111827" },
purposeHint: { margin: 0, fontSize: "12px", color: "#64748b" },

// Message
msgBanner: {
padding: "12px 16px", borderRadius: "8px", fontSize: "13px",
marginBottom: "16px", fontWeight: "600",
boxShadow: "0 8px 18px rgba(15,23,42,0.06)",
},

// Photos
photoGrid: {
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
gap: "12px",
marginTop: "18px",
},
photoBox: {
border: "1px solid #e2e8f0",
borderRadius: "8px",
padding: "12px",
backgroundColor: "#fbfcfe",
},
photoHeader: {
display: "flex",
justifyContent: "space-between",
alignItems: "center",
fontSize: "12px",
color: "#1a1a2e",
marginBottom: "8px",
},
photoLink: {
fontSize: "12px",
color: "#2563eb",
textDecoration: "none",
fontWeight: "700",
},
photoPreview: {
width: "100%",
height: "120px",
objectFit: "cover",
borderRadius: "6px",
backgroundColor: "#eef2f7",
display: "block",
},
photoPlaceholder: {
height: "120px",
borderRadius: "6px",
backgroundColor: "#eef2f7",
color: "#94a3b8",
display: "flex",
alignItems: "center",
justifyContent: "center",
fontSize: "12px",
},
cameraPreview: {
width: "100%",
height: "120px",
objectFit: "cover",
borderRadius: "6px",
backgroundColor: "#111",
marginTop: "8px",
},
photoActions: {
display: "flex",
gap: "8px",
marginTop: "8px",
},
smallBtn: {
flex: 1,
padding: "8px 10px",
backgroundColor: "#111827",
color: "#fff",
border: "none",
borderRadius: "6px",
fontSize: "12px",
fontWeight: "600",
cursor: "pointer",
},
smallMutedBtn: {
flex: 1,
padding: "8px 10px",
backgroundColor: "#eef2f7",
color: "#374151",
border: "1px solid #d9e1ec",
borderRadius: "6px",
fontSize: "12px",
fontWeight: "600",
cursor: "pointer",
},
photoError: {
margin: "8px 0 0 0",
fontSize: "12px",
color: "#c0392b",
},

// Modal
modalOverlay: {
position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
backgroundColor: "rgba(0,0,0,0.55)",
display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
},
modalContent: {
backgroundColor: "#fff", borderRadius: "10px", padding: "28px",
width: "100%", maxWidth: "480px",
boxShadow: "0 24px 60px rgba(15,23,42,0.24)", maxHeight: "90vh", overflowY: "auto",
border: "1px solid #edf1f6",
animation: "dashboardFadeIn 220ms ease both",
},
exitBtn: {
padding: "6px 12px", backgroundColor: "#e74c3c", color: "#fff",
border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px",
},
statsBar: {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "12px",
  padding: "18px 24px",
  backgroundColor: "#f6f8fb",
},
statCard: {
  borderRadius: "10px",
  padding: "16px 20px",
  textAlign: "center",
  boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
  border: "1px solid rgba(226,232,240,0.9)",
  animation: "dashboardFadeIn 280ms ease both",
},
statValue: {
  margin: "0 0 4px 0",
  fontSize: "28px",
  fontWeight: "800",
},
statLabel: {
  margin: 0,
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
},
};

export default GuardDashboard;

//all imports and phone number validations 
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { isValidPhoneNumber } from "libphonenumber-js";
import { FaCar, FaTools, FaComment, FaBox, FaUser, FaMotorcycle, FaTruck } from "react-icons/fa";
import { MdElectricRickshaw } from "react-icons/md";

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
      requiredFields: ["rcBookNo", "permitNo", "passengerCount"],
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
    requiredFields: ["rcBookNo", "loadType", "loadWeight", "vendorNumber", "driverLicenceNo"],
    optionalField: ["challanNo", "insuranceValidTill"]
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
const response = await API.get("/entrylogs");
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
await API.post("/entrylogs", {
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
const response = await API.put(`/entrylogs/${entry._id}/exit`, {
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

//Render
return (
<div style={styles.page}>

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
name="complaint" value={purposeForm.complaint}
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

</div>
);
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
page: {
minHeight: "100vh",
backgroundColor: "#f0f2f5",
fontFamily: "'Segoe UI', sans-serif",
},
navbar: {
display: "flex", justifyContent: "space-between", alignItems: "center",
backgroundColor: "#1a1a2e", padding: "14px 24px", color: "#fff",
position: "sticky", top: 0, zIndex: 100,
},
navTitle: { margin: 0, fontSize: "18px", fontWeight: "600" },
logoutBtn: {
padding: "8px 16px", backgroundColor: "#e74c3c", color: "#fff",
border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px",
},
overdueChip: {
padding: "6px 12px", backgroundColor: "#e74c3c", color: "#fff",
borderRadius: "20px", fontSize: "12px", fontWeight: "600",
animation: "pulse 1.5s infinite",
},
overdueBanner: {
backgroundColor: "#fdecea", borderLeft: "4px solid #e74c3c",
padding: "10px 24px", fontSize: "13px", color: "#c0392b",
display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center",
},
overdueTag: {
backgroundColor: "#e74c3c", color: "#fff",
padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600",
},

// Layout
layout: {
display: "grid",
gridTemplateColumns: "280px 1fr",
gap: "0",
minHeight: "calc(100vh - 52px)",
},

// Sidebar
sidebar: {
backgroundColor: "#fff",
borderRight: "1px solid #e8eaed",
display: "flex", flexDirection: "column",
overflowY: "auto",
},
searchBox: { padding: "16px 12px 8px 12px" },
searchInput: {
width: "100%", padding: "9px 12px", border: "1px solid #ddd",
borderRadius: "8px", fontSize: "13px", boxSizing: "border-box", outline: "none",
},
filterTabs: {
display: "flex", borderBottom: "1px solid #eee", padding: "0 8px",
},
filterTab: {
flex: 1, padding: "8px 4px", border: "none", background: "none",
cursor: "pointer", fontSize: "11px", fontWeight: "600", color: "#999",
borderBottom: "2px solid transparent",
},
filterTabActive: {
color: "#1a1a2e", borderBottom: "2px solid #1a1a2e",
},
entryList: { flex: 1, overflowY: "auto" },
entryCard: {
padding: "12px 14px", borderBottom: "1px solid #f0f0f0",
cursor: "pointer", transition: "background 0.1s",
},
entryCardActive: { backgroundColor: "#f0f4ff" },
entryVehicle: { margin: "0 0 2px 0", fontWeight: "600", fontSize: "13px", color: "#1a1a2e" },
entryName: { margin: "0 0 2px 0", fontSize: "12px", color: "#555" },
entryTime: { margin: 0, fontSize: "11px", color: "#999" },

// Main panel
mainPanel: { padding: "24px", overflowY: "auto" },
card: {
backgroundColor: "#fff", borderRadius: "12px",
padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
},
cardTitle: {
margin: "0 0 20px 0", fontSize: "16px", fontWeight: "600",
color: "#1a1a2e", display: "flex", alignItems: "center", gap: "10px",
},
stepBadge: {
width: "26px", height: "26px", borderRadius: "50%",
backgroundColor: "#1a1a2e", color: "#fff",
display: "inline-flex", alignItems: "center", justifyContent: "center",
fontSize: "13px", fontWeight: "700", flexShrink: 0,
},

// Form
row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
fieldGroup: { marginBottom: "16px" },
label: {
display: "block", marginBottom: "6px",
fontSize: "12px", fontWeight: "600", color: "#555",
textTransform: "uppercase", letterSpacing: "0.04em",
},
input: {
width: "100%", padding: "10px 12px", border: "1px solid #ddd",
borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none",
backgroundColor: "#fff",
},
nextBtn: {
width: "100%", padding: "13px", backgroundColor: "#1a1a2e",
color: "#fff", border: "none", borderRadius: "8px",
fontSize: "15px", cursor: "pointer", fontWeight: "600", marginTop: "8px",
},
backBtn: {
padding: "8px 14px", backgroundColor: "#f0f2f5",
color: "#555", border: "none", borderRadius: "6px",
cursor: "pointer", fontSize: "13px", fontWeight: "500",
},
submitBtn: {
width: "100%", padding: "13px", backgroundColor: "#27ae60",
color: "#fff", border: "none", borderRadius: "8px",
fontSize: "15px", cursor: "pointer", fontWeight: "600",
},

// Purpose
summaryChip: {
display: "inline-block", padding: "8px 16px",
backgroundColor: "#f0f4ff", borderRadius: "20px",
fontSize: "13px", color: "#1a1a2e", marginBottom: "20px",
},
purposeSection: {
padding: "12px 16px", backgroundColor: "#f8f9fa",
borderRadius: "8px", marginBottom: "16px",
borderLeft: "4px solid #1a1a2e",
},
purposeSectionTitle: { margin: "0 0 4px 0", fontWeight: "600", fontSize: "14px", color: "#1a1a2e" },
purposeHint: { margin: 0, fontSize: "12px", color: "#888" },

// Message
msgBanner: {
padding: "12px 16px", borderRadius: "8px", fontSize: "13px",
marginBottom: "16px", fontWeight: "500",
},

// Photos
photoGrid: {
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
gap: "12px",
marginTop: "18px",
},
photoBox: {
border: "1px solid #e5e7eb",
borderRadius: "8px",
padding: "10px",
backgroundColor: "#fafafa",
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
color: "#2980b9",
textDecoration: "none",
},
photoPreview: {
width: "100%",
height: "120px",
objectFit: "cover",
borderRadius: "6px",
backgroundColor: "#eee",
display: "block",
},
photoPlaceholder: {
height: "120px",
borderRadius: "6px",
backgroundColor: "#eef0f3",
color: "#888",
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
backgroundColor: "#1a1a2e",
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
backgroundColor: "#e8eaed",
color: "#333",
border: "none",
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
backgroundColor: "#fff", borderRadius: "12px", padding: "28px",
width: "100%", maxWidth: "480px",
boxShadow: "0 8px 32px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto",
},
exitBtn: {
padding: "6px 12px", backgroundColor: "#e74c3c", color: "#fff",
border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px",
},
};

export default GuardDashboard;

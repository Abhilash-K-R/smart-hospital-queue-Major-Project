// Hospital & Project Metadata
export const PROJECT_INFO = {
  title: "AI-Based Smart Hospital Queue Prediction & Patient Arrival Time Optimization System",
  shortTitle: "MediFlow AI",
  department: "Department of Computer Science & Engineering",
  guide: "Dr. S. K. Mahadevan (HOD & Professor)",
  team: [
    { name: "Laxuman G", role: "Team Lead & ML Architect", usn: "1VT21CS089" },
    { name: "Ananya Sharma", role: "Frontend UI/UX Developer", usn: "1VT21CS024" },
    { name: "Rohan V. Kulkarni", role: "Backend & Cloud Engineer", usn: "1VT21CS112" },
    { name: "Priyanka Naik", role: "Data Scientist & QA", usn: "1VT21CS098" }
  ],
  accuracy: "96.4%",
  datasetSize: "45,000+ Historical Consultations",
  algorithm: "Random Forest Regressor + XGBoost Hybrid"
};

// Demo Mode Default Data
export const DEMO_PATIENT = {
  id: "P-10928",
  name: "Laxuman G",
  age: 23,
  gender: "Male",
  phone: "+91 98765 43210",
  email: "laxuman.patient@mediflow.ai",
  bloodGroup: "O+",
  tokenNumber: "GEN-018",
  numericToken: 18,
  currentToken: 12,
  patientsAhead: 6,
  estimatedWaitMinutes: 24,
  doctor: "Dr. Rajeswari N.",
  doctorId: "doc-1",
  department: "General Medicine",
  roomNo: "O.P.D Block B - Room 204",
  appointmentTime: "10:30 AM",
  appointmentDate: "Today, Aug 04, 2026",
  symptoms: "Persistent fever, seasonal chills & mild fatigue",
  trafficDurationMinutes: 12,
  leaveAfterMinutes: 10,
  distanceKm: 6.8,
  hospitalAddress: "Apollo MediFlow Super Speciality Hospital, MG Road, Tech Hub, Bengaluru - 560001",
  emergencyInsertedCount: 1,
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
};

export const DEPARTMENTS = [
  { id: "gen", name: "General Medicine", icon: "Stethoscope", color: "from-blue-500 to-indigo-600", activeDoctors: 6, avgWait: 18 },
  { id: "cardio", name: "Cardiology", icon: "HeartPulse", color: "from-rose-500 to-red-600", activeDoctors: 4, avgWait: 32 },
  { id: "ortho", name: "Orthopedics", icon: "Activity", color: "from-amber-500 to-orange-600", activeDoctors: 5, avgWait: 25 },
  { id: "peds", name: "Pediatrics", icon: "Baby", color: "from-emerald-500 to-teal-600", activeDoctors: 3, avgWait: 15 },
  { id: "neuro", name: "Neurology", icon: "Brain", color: "from-purple-500 to-violet-600", activeDoctors: 3, avgWait: 40 },
  { id: "derma", name: "Dermatology", icon: "Sparkles", color: "from-cyan-500 to-blue-600", activeDoctors: 4, avgWait: 20 },
  { id: "ent", name: "ENT & Head Surgery", icon: "Ear", color: "from-pink-500 to-rose-600", activeDoctors: 3, avgWait: 22 },
  { id: "emer", name: "Emergency & Trauma", icon: "Siren", color: "from-red-600 to-rose-700", activeDoctors: 8, avgWait: 0 }
];

export const DOCTORS = [
  {
    id: "doc-1",
    name: "Dr. Rajeswari N.",
    qualification: "MBBS, MD (General Medicine)",
    department: "General Medicine",
    experience: "14 Years Exp.",
    rating: 4.9,
    reviews: 420,
    roomNo: "Room 204",
    availability: "Available Today",
    avatar: "https://images.unsplash.com/photo-1594824813566-78a9c39e248b?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 8,
    avgConsultTimeMinutes: 4.5,
    status: "Active",
    nextAvailableSlot: "11:15 AM"
  },
  {
    id: "doc-2",
    name: "Dr. Vikram K. Rao",
    qualification: "MBBS, MS, MCh (Cardiology)",
    department: "Cardiology",
    experience: "19 Years Exp.",
    rating: 4.95,
    reviews: 680,
    roomNo: "Room 302",
    availability: "Available Today",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 12,
    avgConsultTimeMinutes: 8.0,
    status: "Active",
    nextAvailableSlot: "11:45 AM"
  },
  {
    id: "doc-3",
    name: "Dr. Ananya Hedge",
    qualification: "MBBS, DNB (Pediatrics)",
    department: "Pediatrics",
    experience: "10 Years Exp.",
    rating: 4.85,
    reviews: 310,
    roomNo: "Room 105",
    availability: "In Consultation",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 5,
    avgConsultTimeMinutes: 5.0,
    status: "Active",
    nextAvailableSlot: "10:50 AM"
  },
  {
    id: "doc-4",
    name: "Dr. Suresh Reddy",
    qualification: "MBBS, MS (Orthopedics), FRCS",
    department: "Orthopedics",
    experience: "16 Years Exp.",
    rating: 4.88,
    reviews: 512,
    roomNo: "Room 210",
    availability: "Available Today",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 9,
    avgConsultTimeMinutes: 6.2,
    status: "Active",
    nextAvailableSlot: "12:00 PM"
  }
];

export const RECENT_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "leave_now",
    title: "🚨 AI Smart Departure Alert",
    message: "Leave home in 10 minutes to reach OPD Room 204 at 10:30 AM without waiting in the lounge!",
    time: "2 mins ago",
    read: false,
    priority: "high"
  },
  {
    id: "notif-2",
    type: "emergency",
    title: "⚠️ Emergency Priority Inserted",
    message: "A critical trauma case was admitted into General Medicine OPD. Waiting time adjusted +4 mins.",
    time: "15 mins ago",
    read: false,
    priority: "warning"
  },
  {
    id: "notif-3",
    type: "queue_update",
    title: "🎟️ Token Moved Ahead",
    message: "Token GEN-011 completed consultation. You are now 6th in line.",
    time: "28 mins ago",
    read: true,
    priority: "info"
  },
  {
    id: "notif-4",
    type: "confirmation",
    title: "✅ Appointment Booked",
    message: "Appointment confirmed with Dr. Rajeswari N. Token #18 generated.",
    time: "1 hour ago",
    read: true,
    priority: "success"
  }
];

export const HOSPITAL_STATS = [
  { label: "Patients Served Today", value: "482", icon: "Users", change: "+14% vs yesterday" },
  { label: "Average Waiting Saved", value: "38 Mins", icon: "Clock", change: "AI Optimization active" },
  { label: "AI Model Accuracy", value: "96.4%", icon: "BrainCircuit", change: "Random Forest model" },
  { label: "Emergency Cases Processed", value: "14", icon: "ShieldAlert", change: "Zero delay handling" }
];

export const KANNADA_TRANSLATIONS = {
  welcome: "ಸ್ವಾಗತ (Welcome)",
  token: "ಟೋಕನ್ ಸಂಖ್ಯೆ (Token No.)",
  patientsAhead: "ನಿಮಗಿಂತ ಮುಂದಿರುವ ರೋಗಿಗಳು (Patients Ahead)",
  estimatedWait: "ಅಂದಾಜು ಕಾಯುವ ಸಮಯ (Est. Waiting Time)",
  leaveNow: "ಈಗ ಹೊರಡಿ (Leave Now)",
  currentQueue: "ಪ್ರಸ್ತುತ ಸರತಿ ಸಾಲು (Current Queue)",
  doctor: "ವೈದ್ಯರು (Doctor)",
  department: "ವಿಭಾಗ (Department)",
  bookAppointment: "ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ (Book Appointment)",
  emergencyAlert: "ತುರ್ತು ಎಚ್ಚರಿಕೆ (Emergency Alert)"
};

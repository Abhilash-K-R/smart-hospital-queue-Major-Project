// Hospital & Project Metadata
export const PROJECT_INFO = {
  title: "AI-Based Smart Hospital Queue Prediction & Patient Arrival Time Optimization System",
  shortTitle: "Shridevi MediFlow AI",
  department: "Department of Computer Science & Engineering",
  institution: "Shridevi Institute of Engineering & Technology (SIET), Tumakuru",
  guide: "Dr. Rajeswari R (Dept. of CSE)",
  team: [
    { name: "Abhilash K R", role: "Team Lead & ML/Backend Architect" },
    { name: "Laxuman Ghotale", role: "Frontend UI/UX Architect" },
    { name: "Anjanadri T N", role: "System & Cloud Engineer" },
    { name: "Naveen L", role: "Data Engineer & QA" }
  ],
  accuracy: "96.4%",
  datasetSize: "45,000+ Historical Consultations",
  algorithm: "Random Forest Regressor + Google Distance Matrix"
};

// Default uninitialized patient location (No hardcoded coordinates)
export const DEFAULT_PATIENT_LOCATION = {
  lat: null,
  lng: null,
  name: null,
  status: 'uninitialized'
};

// Demo Mode Default Data
export const DEMO_PATIENT = {
  id: "P-10928",
  name: "Laxuman Ghotale",
  age: 23,
  gender: "Male",
  phone: "+91 98765 43210",
  email: "laxuman.patient@shridevimediflow.ai",
  bloodGroup: "O+",
  tokenNumber: null,
  numericToken: null,
  currentToken: null,
  patientsAhead: 0,
  estimatedWaitMinutes: 0,
  doctor: null,
  doctorId: null,
  department: null,
  roomNo: null,
  appointmentTime: null,
  appointmentDate: null,
  symptoms: null,
  trafficDurationMinutes: 0,
  leaveAfterMinutes: 0,
  distanceKm: 0,
  hospitalAddress: "Shridevi Hospital & Research Hospital, Sira Road, Tumakuru - 572106",
  emergencyInsertedCount: 0,
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
};

export const DEPARTMENTS = [
  { id: "gen", name: "General Medicine", icon: "Stethoscope", color: "from-blue-500 to-indigo-600", activeDoctors: 2, avgWait: 10 },
  { id: "cardio", name: "Cardiology", icon: "HeartPulse", color: "from-rose-500 to-red-600", activeDoctors: 1, avgWait: 15 },
  { id: "ortho", name: "Orthopedics", icon: "Activity", color: "from-amber-500 to-orange-600", activeDoctors: 1, avgWait: 12 },
  { id: "peds", name: "Pediatrics", icon: "Baby", color: "from-emerald-500 to-teal-600", activeDoctors: 1, avgWait: 10 },
  { id: "neuro", name: "Neurology", icon: "Brain", color: "from-purple-500 to-violet-600", activeDoctors: 1, avgWait: 15 },
  { id: "derma", name: "Dermatology", icon: "Sparkles", color: "from-cyan-500 to-blue-600", activeDoctors: 1, avgWait: 10 },
  { id: "pulmo", name: "Pulmonology", icon: "Wind", color: "from-teal-500 to-emerald-600", activeDoctors: 1, avgWait: 12 }
];

export const DOCTORS = [
  {
    id: "doc-3",
    doctorId: 3,
    name: "Dr. Rajeswari R.",
    qualification: "MBBS, MD - General Medicine",
    department: "General Medicine",
    experience: "14 Years Exp.",
    rating: 4.95,
    reviews: 520,
    roomNo: "Room 204",
    availability: "Available Today",
    avatar: "https://images.unsplash.com/photo-1594824813566-78a9c39e248b?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 4,
    avgConsultTimeMinutes: 10.0,
    status: "Active",
    nextAvailableSlot: "10:30 AM"
  },
  {
    id: "doc-2",
    doctorId: 2,
    name: "Dr. Arjun Rao",
    qualification: "MBBS, DNB - Family Medicine",
    department: "General Medicine",
    experience: "9 Years Exp.",
    rating: 4.88,
    reviews: 310,
    roomNo: "Room 205",
    availability: "Available Today",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 3,
    avgConsultTimeMinutes: 10.0,
    status: "Active",
    nextAvailableSlot: "10:45 AM"
  },
  {
    id: "doc-1",
    doctorId: 1,
    name: "Dr. Priya Sharma",
    qualification: "MBBS, MD, DM - Cardiology",
    department: "Cardiology",
    experience: "16 Years Exp.",
    rating: 4.98,
    reviews: 680,
    roomNo: "Room 302",
    availability: "Available Today",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 5,
    avgConsultTimeMinutes: 15.0,
    status: "Active",
    nextAvailableSlot: "11:00 AM"
  },
  {
    id: "doc-4",
    doctorId: 4,
    name: "Dr. Vikram K. Rao",
    qualification: "MBBS, MS - Orthopedics",
    department: "Orthopedics",
    experience: "12 Years Exp.",
    rating: 4.90,
    reviews: 450,
    roomNo: "Room 108",
    availability: "Available Today",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 3,
    avgConsultTimeMinutes: 12.0,
    status: "Active",
    nextAvailableSlot: "11:15 AM"
  },
  {
    id: "doc-5",
    doctorId: 5,
    name: "Dr. Ananya Hegde",
    qualification: "MBBS, MD - Pediatrics",
    department: "Pediatrics",
    experience: "10 Years Exp.",
    rating: 4.92,
    reviews: 380,
    roomNo: "Room 105",
    availability: "Available Today",
    avatar: "https://images.unsplash.com/photo-1594824813566-78a9c39e248b?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 2,
    avgConsultTimeMinutes: 10.0,
    status: "Active",
    nextAvailableSlot: "10:50 AM"
  },
  {
    id: "doc-6",
    doctorId: 6,
    name: "Dr. Rajeshwar B.",
    qualification: "MBBS, MD, DM - Neurology",
    department: "Neurology",
    experience: "18 Years Exp.",
    rating: 4.96,
    reviews: 590,
    roomNo: "Room 401",
    availability: "Available Today",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 4,
    avgConsultTimeMinutes: 15.0,
    status: "Active",
    nextAvailableSlot: "11:30 AM"
  },
  {
    id: "doc-7",
    doctorId: 7,
    name: "Dr. Sneha Patil",
    qualification: "MBBS, MD - Dermatology",
    department: "Dermatology",
    experience: "8 Years Exp.",
    rating: 4.89,
    reviews: 320,
    roomNo: "Room 210",
    availability: "Available Today",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 2,
    avgConsultTimeMinutes: 10.0,
    status: "Active",
    nextAvailableSlot: "10:40 AM"
  },
  {
    id: "doc-8",
    doctorId: 8,
    name: "Dr. Manoj Kumar",
    qualification: "MBBS, DTCD, DNB - Pulmonology",
    department: "Pulmonology",
    experience: "11 Years Exp.",
    rating: 4.91,
    reviews: 410,
    roomNo: "Room 305",
    availability: "Available Today",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250",
    patientsInQueue: 3,
    avgConsultTimeMinutes: 12.0,
    status: "Active",
    nextAvailableSlot: "11:20 AM"
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
    message: "Token OPD-011 completed consultation. You are now 6th in line.",
    time: "28 mins ago",
    read: true,
    priority: "info"
  },
  {
    id: "notif-4",
    type: "confirmation",
    title: "✅ Appointment Booked",
    message: "Appointment confirmed with Dr. Rajeswari R. Token #18 generated.",
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

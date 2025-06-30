// Sample patient data for nurse dashboard
export const nursePatientsData = [
  {
    id: "P002",
    name: "Bob Williams",
    age: 42,
    gender: "Male",
    avatarColor: "bg-blue-500",
    initials: "BW",
    appointmentTime: "09:30 AM",
    status: "waiting",
    vitalsRecorded: false,
    notes: "Patient reports severe headache and nausea. History of migraines.",
    urgency: "Priority",
    medicalHistory: "Chronic migraines, hypertension",
    allergies: "Penicillin",
    medications: "Sumatriptan as needed"
  },
  {
    id: "P006",
    name: "Frank Green",
    age: 35,
    gender: "Male",
    avatarColor: "bg-emerald-500",
    initials: "FG",
    appointmentTime: "11:30 AM",
    status: "delayed",
    delayReason: "Doctor running 15 mins late",
    vitalsRecorded: true,
    vitals: {
      bp: "125/85",
      temp: "98.6",
      weight: "72",
      heartRate: "78"
    },
    notes: "Follow-up for chronic condition.",
    urgency: "Normal"
  },
  {
    id: "P007", 
    name: "Sarah Martinez",
    age: 38,
    gender: "Female",
    avatarColor: "bg-purple-500",
    initials: "SM",
    appointmentTime: "10:45 AM",
    status: "waiting",
    vitalsRecorded: true,
    vitals: {
      bp: "118/76",
      temp: "98.4",
      weight: "62",
      heartRate: "70"
    },
    notes: "Regular check-up appointment. Patient feels well.",
    urgency: "Normal",
    medicalHistory: "No significant medical history",
    allergies: "None known",
    medications: "Multivitamin daily"
  },
  {
    id: "PAT-003",
    name: "Alice Johnson", 
    age: 29,
    gender: "Female",
    avatarColor: "bg-amber-500",
    initials: "AJ",
    appointmentTime: "09:00 AM",
    status: "ready",
    vitalsRecorded: true,
    vitals: {
      bp: "118/75",
      temp: "98.2",
      weight: "65",
      heartRate: "72"
    }
  },
  {
    id: "PAT-004",
    name: "Unnamed Patient",
    avatarColor: "bg-purple-500",
    initials: "PQRS",
    appointmentTime: "11:00 AM",
    status: "waiting",
    vitalsRecorded: false
  },
  {
    id: "PAT-005",
    name: "Maria Rodriguez", 
    age: 62,
    gender: "Female",
    avatarColor: "bg-pink-500",
    initials: "MR",
    appointmentTime: "10:15 AM",
    status: "seeing_doctor",
    vitalsRecorded: true,
    vitals: {
      bp: "140/90",
      temp: "99.1",
      weight: "68",
      heartRate: "78"
    },
    notes: "History of hypertension."
  },
  {
    id: "PAT-006",
    name: "David Smith",
    age: 55,
    gender: "Male", 
    avatarColor: "bg-indigo-500",
    initials: "DS",
    appointmentTime: "12:00 PM",
    status: "waiting",
    vitalsRecorded: false
  },
  // Additional patients for EMR search functionality
  {
    id: "P008",
    name: "Jennifer Lee",
    age: 31,
    gender: "Female",
    avatarColor: "bg-pink-500",
    initials: "JL",
    appointmentTime: "01:15 PM",
    status: "waiting",
    vitalsRecorded: false,
    notes: "Routine pregnancy check-up, second trimester.",
    urgency: "Normal",
    medicalHistory: "Pregnancy (22 weeks), no complications",
    allergies: "None known",
    medications: "Prenatal vitamins, Folic acid"
  },
  {
    id: "P009",
    name: "Robert Chen",
    age: 68,
    gender: "Male",
    avatarColor: "bg-gray-500",
    initials: "RC",
    appointmentTime: "02:30 PM",
    status: "delayed",
    delayReason: "Blood work results pending",
    vitalsRecorded: true,
    vitals: {
      bp: "150/95",
      temp: "98.8",
      weight: "78",
      heartRate: "85"
    },
    notes: "Follow-up for diabetes management. Patient reports increased thirst.",
    urgency: "Priority",
    medicalHistory: "Type 2 diabetes, hypertension, history of heart disease",
    allergies: "Sulfa drugs",
    medications: "Metformin 500mg twice daily, Lisinopril 10mg daily"
  },
  {
    id: "P010",
    name: "Emily Davis",
    age: 24,
    gender: "Female",
    avatarColor: "bg-cyan-500",
    initials: "ED",
    appointmentTime: "03:45 PM",
    status: "ready",
    vitalsRecorded: true,
    vitals: {
      bp: "110/70",
      temp: "98.1",
      weight: "58",
      heartRate: "68"
    },
    notes: "Annual physical exam, student health requirements.",
    urgency: "Normal",
    medicalHistory: "No significant medical history",
    allergies: "Seasonal allergies (pollen)",
    medications: "Claritin as needed for allergies"
  },
  {
    id: "P011",
    name: "Michael Torres",
    age: 47,
    gender: "Male",
    avatarColor: "bg-orange-500",
    initials: "MT",
    appointmentTime: "04:00 PM",
    status: "seeing_doctor",
    vitalsRecorded: true,
    vitals: {
      bp: "135/88",
      temp: "99.2",
      weight: "85",
      heartRate: "82"
    },
    notes: "Persistent cough for 3 weeks, mild fever last night.",
    urgency: "Priority",
    medicalHistory: "Former smoker (quit 5 years ago), mild COPD",
    allergies: "Penicillin, shellfish",
    medications: "Albuterol inhaler as needed"
  },
  {
    id: "P012",
    name: "Lisa Wang",
    age: 39,
    gender: "Female",
    avatarColor: "bg-teal-500",
    initials: "LW",
    appointmentTime: "08:30 AM",
    status: "waiting",
    vitalsRecorded: false,
    notes: "Severe migraine, photophobia, requesting pain management.",
    urgency: "High",
    medicalHistory: "Chronic migraines, anxiety disorder",
    allergies: "Codeine",
    medications: "Sumatriptan, Sertraline 50mg daily"
  }
];

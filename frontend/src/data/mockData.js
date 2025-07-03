/**
 * Centralized mock data for development
 * This file will be removed when backend is integrated
 */

// Employee data
export const employees = [
  {
    id: 1,
    email: "dr.smith@clinic.com",
    fullName: "Dr. John Smith",
    role: "Doctor",
    department: "General Medicine",
    phone: "+1-555-0101",
    isActive: true,
    dateJoined: "2023-01-15",
    lastLogin: "2024-06-28"
  },
  {
    id: 2,
    email: "nurse.johnson@clinic.com", 
    fullName: "Sarah Johnson",
    role: "Nurse",
    department: "Emergency",
    phone: "+1-555-0102",
    isActive: true,
    dateJoined: "2023-03-20",
    lastLogin: "2024-06-29"
  },
  {
    id: 3,
    email: "receptionist.brown@clinic.com",
    fullName: "Emily Brown",
    role: "Receptionist", 
    department: "Front Desk",
    phone: "+1-555-0103",
    isActive: true,
    dateJoined: "2023-02-10",
    lastLogin: "2024-06-30"
  }
];

// Available roles
export const roles = ["Admin", "Doctor", "Nurse", "Receptionist"];

// Doctor data
export const doctors = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialization: "General Medicine",
    experience: "8 years",
    availability: "Mon-Fri, 9AM-5PM",
    image: "/avatars/doctor-1.png",
    rating: 4.8,
    patients: 1200,
    status: "available"
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    specialization: "Pediatrics",
    experience: "12 years",
    availability: "Mon-Sat, 10AM-6PM",
    image: "/avatars/doctor-2.png",
    rating: 4.9,
    patients: 1500,
    status: "available"
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    specialization: "Cardiology",
    experience: "15 years",
    availability: "Tue-Sat, 8AM-4PM",
    image: "/avatars/doctor-3.png",
    rating: 4.7,
    patients: 900,
    status: "unavailable"
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    specialization: "Orthopedics",
    experience: "10 years",
    availability: "Mon-Fri, 11AM-7PM",
    image: "/avatars/doctor-4.png",
    rating: 4.6,
    patients: 800,
    status: "available"
  }
];

// Doctor's patient data
export const doctorPatients = [
  {
    id: "P001",
    name: "Alice Thompson",
    age: 35,
    gender: "Female",
    avatarColor: "bg-purple-500",
    initials: "AT",
    appointmentTime: "09:00 AM",
    status: "ready",
    vitalsRecorded: true,
    symptoms: "Persistent headache, mild fever",
    urgency: "Normal",
    nurseNotes: "BP 120/80, Temperature 37.8°C",
    waitingTime: "10 mins"
  },
  {
    id: "P002",
    name: "Bob Williams",
    age: 42,
    gender: "Male",
    avatarColor: "bg-blue-500",
    initials: "BW",
    appointmentTime: "09:30 AM",
    status: "seeing_doctor",
    vitalsRecorded: true,
    symptoms: "Joint pain in knees",
    urgency: "Priority",
    nurseNotes: "BP 130/85, Previous knee surgery",
    waitingTime: "5 mins"
  },
  {
    id: "P003",
    name: "Carol Davis",
    age: 28,
    gender: "Female",
    avatarColor: "bg-pink-500",
    initials: "CD",
    appointmentTime: "10:00 AM",
    status: "completed",
    vitalsRecorded: true,
    symptoms: "Follow-up for medication",
    urgency: "Normal",
    nurseNotes: "All vitals normal",
    diagnosis: "Hypertension",
    prescription: "Lisinopril 10mg",
    nextAppointment: "In 3 months"
  },
  {
    id: "P004",
    name: "David Wilson",
    age: 55,
    gender: "Male",
    avatarColor: "bg-green-500",
    initials: "DW",
    appointmentTime: "10:30 AM",
    status: "delayed",
    vitalsRecorded: true,
    symptoms: "Chronic back pain",
    urgency: "Priority",
    nurseNotes: "Patient reports increased pain",
    waitingTime: "15 mins"
  }
];

// Nurse patient data
export const nursePatients = [
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
    allergies: ["Penicillin", "Dust Mites"],
    medications: "Sumatriptan as needed",
    diagnosisHistory: [
      { date: "2023-11-10", diagnosis: "Seasonal Allergies" },
      { date: "2022-05-20", diagnosis: "Mild Hypertension" },
      { date: "2021-08-15", diagnosis: "Acute Bronchitis" }
    ],
    currentMedications: [
      {
        name: "Sumatriptan",
        dosage: "50mg",
        frequency: "As needed",
        prescribedBy: "Dr. Johnson"
      },
      {
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Daily",
        prescribedBy: "Dr. Smith"
      }
    ]
  }
];

// Appointments data
export const appointments = [
  {
    id: "APT001",
    patientId: "P001",
    doctorId: 1,
    date: new Date().toISOString(),
    time: "09:00 AM",
    type: "Follow-up",
    status: "scheduled"
  },
  {
    id: "APT002",
    patientId: "P002",
    doctorId: 2,
    date: new Date().toISOString(),
    time: "09:30 AM",
    type: "New Patient",
    status: "in-progress"
  }
];

// All patients data
export const patients = [
  {
    id: "P001",
    name: "Alice Thompson",
    age: 35,
    gender: "Female",
    contact: "+1-555-0201",
    email: "alice.t@email.com",
    address: "123 Oak St, Springfield",
    bloodGroup: "A+",
    registrationDate: "2024-01-15"
  },
  {
    id: "P002",
    name: "Bob Williams",
    age: 42,
    gender: "Male",
    contact: "+1-555-0202",
    email: "bob.w@email.com",
    address: "456 Maple Ave, Springfield",
    bloodGroup: "O+",
    registrationDate: "2024-02-20"
  }
];

export const dummyPatients = [
  {
    id: "P001",
    name: "John Anderson",
    photo: "/avatars/patient1.png",
    dateOfBirth: "1985-06-15",
    idNumber: "ID85061501",
    contact: "+1-555-0121",
    email: "john.a@email.com",
    address: "123 Main St, City",
    lastVisit: "2025-06-25",
    medicalHistory: ["Hypertension", "Diabetes Type 2"]
  },
  {
    id: "P002",
    name: "Sarah Williams",
    photo: "/avatars/patient2.png",
    dateOfBirth: "1990-03-22",
    idNumber: "ID90032202",
    contact: "+1-555-0122",
    email: "sarah.w@email.com",
    address: "456 Oak Ave, City",
    lastVisit: "2025-06-28",
    medicalHistory: ["Asthma"]
  },
  {
    id: "P003",
    name: "Robert Chen",
    photo: "/avatars/patient3.png",
    dateOfBirth: "1978-11-30",
    idNumber: "ID78113003",
    contact: "+1-555-0123",
    email: "robert.c@email.com",
    address: "789 Pine Rd, City",
    lastVisit: "2025-06-27",
    medicalHistory: ["Arthritis"]
  }
];

export const doctorSchedules = [
  {
    id: "D001",
    name: "Dr. John Smith",
    specialty: "General Medicine",
    photo: "/avatars/doctor1.png",
    schedule: {
      monday: { start: "09:00", end: "17:00", breakTime: "12:00-13:00" },
      tuesday: { start: "09:00", end: "17:00", breakTime: "12:00-13:00" },
      wednesday: { start: "09:00", end: "17:00", breakTime: "12:00-13:00" },
      thursday: { start: "09:00", end: "17:00", breakTime: "12:00-13:00" },
      friday: { start: "09:00", end: "15:00", breakTime: "12:00-13:00" }
    },
    averageAppointmentDuration: 30, // in minutes
    isAvailable: true
  },
  {
    id: "D002",
    name: "Dr. Sarah Johnson",
    specialty: "Pediatrics",
    photo: "/avatars/doctor2.png",
    schedule: {
      monday: { start: "10:00", end: "18:00", breakTime: "13:00-14:00" },
      tuesday: { start: "10:00", end: "18:00", breakTime: "13:00-14:00" },
      wednesday: { start: "10:00", end: "18:00", breakTime: "13:00-14:00" },
      thursday: { start: "10:00", end: "18:00", breakTime: "13:00-14:00" },
      friday: { start: "10:00", end: "16:00", breakTime: "13:00-14:00" }
    },
    averageAppointmentDuration: 45,
    isAvailable: true
  },
  {
    id: "D003",
    name: "Dr. Michael Wilson",
    specialty: "Cardiology",
    photo: "/avatars/doctor3.png",
    schedule: {
      monday: { start: "08:00", end: "16:00", breakTime: "12:00-13:00" },
      tuesday: { start: "08:00", end: "16:00", breakTime: "12:00-13:00" },
      wednesday: { start: "08:00", end: "16:00", breakTime: "12:00-13:00" },
      thursday: { start: "08:00", end: "16:00", breakTime: "12:00-13:00" },
      friday: { start: "08:00", end: "14:00", breakTime: "12:00-13:00" }
    },
    averageAppointmentDuration: 60,
    isAvailable: false
  }
];

export const appointments = [
  {
    id: "A001",
    patientId: "P001",
    doctorId: "D001",
    date: "2025-06-29",
    time: "10:00",
    status: "Scheduled",
    type: "Regular Checkup",
    notes: "Follow-up on blood pressure"
  },
  {
    id: "A002",
    patientId: "P002",
    doctorId: "D002",
    date: "2025-06-29",
    time: "14:30",
    status: "In Progress",
    type: "New Patient",
    notes: "Initial consultation"
  }
];

export const getAvailableDoctors = () => {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                     now.getMinutes().toString().padStart(2, '0');

  return doctorSchedules.filter(doctor => {
    if (!doctor.isAvailable) return false;
    
    const schedule = doctor.schedule[currentDay];
    if (!schedule) return false; // Doctor doesn't work on this day

    const [breakStart, breakEnd] = schedule.breakTime.split('-');
    
    // Check if current time is within working hours and not during break
    return currentTime >= schedule.start && 
           currentTime <= schedule.end && 
           !(currentTime >= breakStart && currentTime <= breakEnd);
  });
};

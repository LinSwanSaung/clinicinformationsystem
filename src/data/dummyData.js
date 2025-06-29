export const dummyEmployees = [
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
    lastLogin: "2024-06-29"
  },
  {
    id: 4,
    email: "dr.wilson@clinic.com",
    fullName: "Dr. Michael Wilson",
    role: "Doctor",
    department: "Pediatrics",
    phone: "+1-555-0104",
    isActive: true,
    dateJoined: "2022-11-05",
    lastLogin: "2024-06-28"
  },
  {
    id: 5,
    email: "nurse.davis@clinic.com",
    fullName: "Lisa Davis",
    role: "Nurse",
    department: "ICU",
    phone: "+1-555-0105",
    isActive: false,
    dateJoined: "2023-05-12",
    lastLogin: "2024-06-25"
  },
  {
    id: 6,
    email: "dr.martinez@clinic.com",
    fullName: "Dr. Ana Martinez",
    role: "Doctor",
    department: "Obstetrics",
    phone: "+1-555-0106",
    isActive: true,
    dateJoined: "2023-07-01",
    lastLogin: "2024-06-29"
  }
];

export const roles = [
  { value: "Doctor", label: "Doctor" },
  { value: "Nurse", label: "Nurse" },
  { value: "Receptionist", label: "Receptionist" }
];

export const departments = [
  { value: "General Medicine", label: "General Medicine" },
  { value: "Emergency", label: "Emergency" },
  { value: "ICU", label: "ICU" },
  { value: "Pediatrics", label: "Pediatrics" },
  { value: "Obstetrics", label: "Obstetrics" },
  { value: "Front Desk", label: "Front Desk" }
];

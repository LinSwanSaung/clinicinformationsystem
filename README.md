# ThriveCare - Clinic Information System

A modern, full-stack Clinic Information System designed for low-resource healthcare settings. Built with React, Node.js, and Supabase.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.x-61dafb)

## 🏥 Overview

ThriveCare is a comprehensive clinic management solution that streamlines healthcare operations from patient registration to billing. It supports multiple user roles with role-based access control, real-time queue management, electronic medical records, and integrated billing.

## ✨ Features

### Core Modules
- **Patient Management** - Registration, medical history, allergies, diagnoses
- **Appointment Scheduling** - Calendar-based booking with doctor availability
- **Queue Management** - Real-time token-based queue with priority support
- **Electronic Medical Records** - Vitals, prescriptions, doctor notes, documents
- **Billing & Payments** - Invoicing, partial payments, outstanding balance tracking
- **Notifications** - Real-time in-app and browser notifications

### User Roles
| Role | Capabilities |
|------|-------------|
| **Admin** | Full system access, employee management, clinic settings, analytics |
| **Receptionist** | Patient registration, appointments, queue token issuance |
| **Nurse** | Vitals recording, patient preparation, queue management |
| **Doctor** | Consultations, prescriptions, diagnoses, medical notes |
| **Cashier/Pharmacist** | Billing, payments, prescription dispensing |

### Additional Features
- 🌍 **Multilingual** - English and Myanmar language support
- 🌙 **Dark/Light Mode** - Theme switching for comfortable viewing
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔔 **Browser Notifications** - Real-time alerts for queue updates
- 📊 **Analytics Dashboard** - Revenue, patient, and appointment statistics

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TailwindCSS, shadcn/ui |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Supabase) |
| **Authentication** | JWT with bcrypt |
| **State Management** | TanStack Query (React Query) |
| **Internationalization** | react-i18next |
| **Icons** | Lucide React |

## 📋 Prerequisites

- Node.js v18 or higher
- npm or yarn
- Supabase account (for database)
- Git

## 🛠️ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/LinSwanSaung/clinicinformationsystem.git
cd clinicinformationsystem
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Configure Environment Variables

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000/api
```

**Backend** (`backend/.env`):
```env
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Optional: AI Features
GITHUB_TOKEN=your_github_token
AI_MODEL=gpt-4o-mini
```

### 4. Set Up Database

1. Create a new Supabase project
2. Run the schema in Supabase SQL Editor:
   ```sql
   -- Copy and run the contents of:
   backend/database/schema.sql
   ```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

Open http://localhost:5173 in your browser.

## 🔐 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@clinic.com | admin123 |
| Receptionist | lin@gmail.com | Lin260702 |
| Nurse | chue@gmail.com | Lin260702 |
| Doctor | zawoo@gmail.com | Lin260702 |
| Cashier/Pharmacist | cashier1@gmail.com | cashier123 |

## 📁 Project Structure

```
clinicinformationsystem/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── app/             # App configuration, routes, providers
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Theme, Feedback)
│   │   ├── features/        # Feature-based modules
│   │   │   ├── admin/       # Admin management
│   │   │   ├── appointments/# Appointment scheduling
│   │   │   ├── auth/        # Authentication
│   │   │   ├── billing/     # Invoicing & payments
│   │   │   ├── medical/     # Medical records, vitals, prescriptions
│   │   │   ├── patients/    # Patient management
│   │   │   ├── queue/       # Queue management
│   │   │   ├── services/    # Service catalog
│   │   │   └── visits/      # Visit management
│   │   ├── hooks/           # Custom React hooks
│   │   ├── i18n/            # Internationalization
│   │   ├── pages/           # Role-specific dashboards
│   │   ├── services/        # API service layer
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
│
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── config/          # Database, logger configuration
│   │   ├── constants/       # Constants and enums
│   │   ├── errors/          # Custom error classes
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic
│   │   │   └── repositories/# Data access layer
│   │   ├── utils/           # Utility functions
│   │   └── validators/      # Input validation
│   ├── database/
│   │   └── schema.sql       # Database schema
│   └── docs/                # Backend documentation
│
├── docs/                     # Project documentation
└── api/                      # Vercel serverless functions
```

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed installation instructions
- [API Documentation](docs/API.md) - REST API endpoints
- [Database Schema](docs/DATABASE.md) - Tables and relationships
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [User Guide](docs/USER_GUIDE.md) - How to use each role

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

### Backend (Railway/Render)
See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Lin Swan Saung**
- GitHub: [@LinSwanSaung](https://github.com/LinSwanSaung)

---

**ThriveCare** - Empowering healthcare in low-resource settings through modern technology.

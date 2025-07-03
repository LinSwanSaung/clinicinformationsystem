# RealCIS - Clinic Information System (Updated Structure)

A modern, full-stack clinic management system with clean frontend/backend separation.

## 🏗️ New Project Structure

```
clinicinformationsystem/
├── frontend/              # React + Vite Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── contexts/      # React contexts
│   │   ├── data/          # Dummy data (development)
│   │   ├── lib/           # Utility functions
│   │   └── styles/        # CSS styles
│   ├── public/            # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── backend/               # Node.js + Express Backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Helper functions
│   ├── database/
│   │   ├── migrations/    # Database migrations
│   │   └── seeds/         # Database seed data
│   ├── package.json
│   └── app.js
│
└── README_NEW.md          # This updated file
```

## 🚀 Getting Started

### Frontend Development

1. Navigate to frontend:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Backend Development

1. Navigate to backend:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## 🔧 Changes Made

### 1. **Clean Separation**
- Frontend code moved to `/frontend` directory
- Backend code moved to `/backend` directory
- Dummy data moved to backend seeds

### 2. **API Services Created**
- `frontend/src/services/api.js` - Base API service
- `frontend/src/services/authService.js` - Authentication
- `frontend/src/services/patientService.js` - Patient operations

### 3. **Development Mode**
- Frontend uses dummy data in development
- Seamless transition to real API when backend is ready
- Environment variable configuration

## 👥 Development Credentials

- **Admin**: admin@clinic.com / admin123
- **Nurse**: nurse@clinic.com / nurse123
- **Doctor**: doctor@clinic.com / doctor123
- **Receptionist**: receptionist@clinic.com / receptionist123

## 🔄 Migration Notes

The project structure has been reorganized for better maintainability and scalability. Frontend and backend are now completely separate, making it easier to:

- Deploy independently
- Scale components separately
- Maintain cleaner code boundaries
- Enable team specialization

All existing functionality remains intact while providing a foundation for future backend integration.

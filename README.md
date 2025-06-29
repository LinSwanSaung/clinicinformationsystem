# RealCIS - Clinic Information System

A modern, responsive Clinic Information System designed for low-resource healthcare settings. Built with React, TailwindCSS, and shadcn/ui components.

## 🏥 Features

- **Multi-role Authentication**: Admin, Receptionist, Nurse, and Doctor roles
- **Employee Management**: Complete CRUD operations for staff management
- **Modern UI**: Clean, responsive design following Supabase design patterns
- **Role-based Access Control**: Secure access based on user roles
- **Mobile-first Design**: Optimized for all device sizes

## 🚀 Tech Stack

- **Frontend**: Vite + React + TailwindCSS + shadcn/ui
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Backend**: Node.js + Supabase (PostgreSQL) - *Coming Soon*
- **Authentication**: Supabase Auth - *Coming Soon*

## 📋 Current Implementation

### ✅ Completed Features
- Project setup with Vite, React, TailwindCSS
- Admin login page with dummy authentication
- Admin dashboard with stats and quick actions
- Employee management with full CRUD operations
- Responsive design following modern UI patterns

### 🔄 In Development
- Backend integration with Supabase
- Real authentication system
- Other role interfaces (Receptionist, Nurse, Doctor)
- Advanced reporting and analytics

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realcis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔐 Demo Credentials

**Admin Access:**
- Email: `admin@clinic.com`
- Password: `admin123`

**Receptionist Access:**
- Email: `receptionist.brown@clinic.com`
- Password: `clinic123`

## 📱 Usage

1. **Login**: Use the demo credentials to access the admin panel
2. **Dashboard**: View clinic statistics and quick action cards
3. **Employee Management**: 
   - Click on "Employee Management" card from dashboard
   - Add new employees with role assignments
   - Edit existing employee information
   - Activate/deactivate employee accounts
   - Delete employee records

## 🎨 Design Philosophy

This application follows the Supabase design system for:
- Clean, modern aesthetics
- Consistent color palette
- Intuitive user interactions
- Mobile-responsive layouts
- Accessible components

## 📁 Project Structure

```
src/
├── components/
│   └── ui/               # shadcn/ui components
├── pages/
│   ├── admin/           # Admin-specific pages
│   └── AdminLogin.jsx   # Login page
├── data/
│   └── dummyData.js     # Mock data for development
├── lib/
│   └── utils.js         # Utility functions
└── hooks/               # Custom React hooks
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌟 Future Enhancements

- **Backend Integration**: Supabase PostgreSQL database
- **Real Authentication**: Secure login with Supabase Auth
- **Multi-role Dashboards**: Specialized interfaces for each role
- **Patient Management**: Complete patient records system
- **Appointment Scheduling**: Calendar-based appointment system
- **Medical Records**: Digital health records management
- **Reporting & Analytics**: Comprehensive clinic analytics
- **Mobile App**: React Native companion app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or support, please contact the development team or create an issue in the repository.

---

**RealCIS** - Empowering healthcare in low-resource settings through modern technology.

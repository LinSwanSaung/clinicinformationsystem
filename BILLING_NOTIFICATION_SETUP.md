# Billing & Notification System Implementation

## Overview
This implementation adds a complete billing and notification system to the clinic information system. The system allows:
- Doctors to add services/medications during consultation
- Cashiers to process payments and dispense medications
- Automatic visit completion when invoice is paid
- Real-time notifications to receptionists when visits are completed

## Features Implemented

### 1. **Billing System**
- **Services Management**: Doctors can add services with pricing during patient consultation
- **Prescription Integration**: Cashier can load doctor's prescriptions into invoice
- **Flexible Pricing**: Editable unit prices for each item
- **Partial Dispensing**: Support for partial medication dispensing with automatic write-out creation
- **Payment Processing**: Complete payment workflow with audit trail

### 2. **Notification System**
- **Real-time Notifications**: Reception staff receive notifications when visits complete
- **Unread Count Badge**: Visual indicator of new notifications
- **Mark as Read**: Individual and bulk mark-as-read functionality
- **Auto-refresh**: Polls for new notifications every 30 seconds
- **Generic Architecture**: Extensible for future notification types

## Setup Instructions

### Step 1: Run Database Migration

You need to run the notifications table migration in your Supabase database.

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Open the migration file: `backend/database/migrations/004_notifications.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

**Option B: Using Supabase CLI**
```bash
cd backend
supabase db push
```

### Step 2: Restart Backend Server

The backend needs to be restarted to load the new routes and services:

```powershell
# Navigate to backend directory
cd "d:\RM KMD Final year Assignment\BAckup fr\clinicinformationsystem\backend"

# Kill existing node process if running
taskkill /F /IM node.exe

# Start the backend
npm start
```

### Step 3: Verify Frontend is Running

```powershell
# Navigate to frontend directory
cd "d:\RM KMD Final year Assignment\BAckup fr\clinicinformationsystem\frontend"

# Start frontend (if not already running)
npm run dev
```

## Testing the Complete Workflow

### Prerequisites
- At least one receptionist user in the database
- At least one doctor user
- At least one cashier user
- Sample patient registered

### Complete Patient Journey Test

**1. Reception: Register Patient & Queue**
- Login as receptionist: `reception@clinic.com` / `reception123`
- Register a new patient or select existing
- Add patient to doctor's queue
- Patient receives token number

**2. Doctor: Consultation & Service Entry**
- Login as doctor: `doctor@clinic.com` / `doctor123`
- Call patient's token
- Open patient's medical record
- Add prescriptions/medications
- Add services/treatments using the Service Selector
- Save all entries
- Complete consultation (token status changes to "completed")
- **Important**: Visit status remains "in-progress" until payment

**3. Cashier: Billing & Payment**
- Login as cashier: `cashier@clinic.com` / `cashier123`
- Navigate to Cashier Dashboard
- Find the patient's pending invoice
- Click "Load Prescriptions" to import doctor's prescriptions
- Adjust quantities for dispensing:
  - Enter **full quantity** to dispense completely
  - Enter **partial quantity** to dispense partially (creates write-out for remaining)
- Edit unit prices if needed
- Enter payment details:
  - Payment method (Cash/Card/Insurance)
  - Amount received
  - Payment notes (optional)
- Click "Process Payment"
- **Result**: 
  - Invoice marked as paid
  - Visit automatically marked as completed
  - Medications dispensed/written-out as specified

**4. Reception: Notification Received**
- Login as receptionist (or stay logged in)
- Look at the notification bell icon in navbar
- **Red badge** appears showing unread count
- Click the bell icon to open notifications
- See notification: "Patient [Name] has completed their visit. Invoice #[Number] has been paid."
- Click "Mark as read" or "Mark all as read"
- Patient can now be informed their visit is complete

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, success, warning, error
  related_entity_type TEXT, -- visit, appointment, patient, etc.
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);
```

## API Endpoints Added

### Notification Routes
- `GET /api/notifications` - Get current user's notifications
- `GET /api/notifications/unread-count` - Get unread notification count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

## Files Created/Modified

### Backend Files Created
- `backend/database/migrations/004_notifications.sql` - Notifications table schema
- `backend/src/models/Notification.model.js` - Notification CRUD operations
- `backend/src/services/Notification.service.js` - Notification business logic
- `backend/src/routes/notification.routes.js` - Notification API routes

### Backend Files Modified
- `backend/src/services/Invoice.service.js` - Added visit completion and notification logic
- `backend/src/app.js` - Registered notification routes

### Frontend Files Created
- `frontend/src/services/notificationService.js` - Frontend API client for notifications
- `frontend/src/components/NotificationBell.jsx` - Notification bell dropdown component

### Frontend Files Modified
- `frontend/src/components/Navbar.jsx` - Integrated NotificationBell component
- `frontend/src/pages/receptionist/ReceptionistDashboard.jsx` - Import NotificationBell
- `frontend/src/pages/cashier/CashierDashboard.jsx` - Payment processing with visit completion
- `frontend/src/services/invoiceService.js` - Added completed_by parameter

## Workflow Diagram

```
┌─────────────┐
│  Reception  │ Register Patient → Queue Patient
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Doctor    │ Call Token → Consult → Add Services/Prescriptions
└──────┬──────┘ → Complete Token (visit still "in-progress")
       │
       ▼
┌─────────────┐
│   Cashier   │ Load Prescriptions → Set Quantities → Process Payment
└──────┬──────┘
       │
       ├──────────────────┐
       ▼                  ▼
   Invoice Paid    Visit Completed
                         │
                         ▼
                  ┌──────────────┐
                  │ Notification │
                  │    Sent to   │
                  │  Receptionists│
                  └──────────────┘
```

## Configuration

### Environment Variables
Ensure these are set in your `.env` files:

**Backend** (`backend/.env`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
PORT=3001
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Troubleshooting

### Notifications not appearing
1. **Check database**: Verify notifications table exists
   ```sql
   SELECT * FROM notifications LIMIT 5;
   ```

2. **Check user role**: Ensure logged-in user has role='receptionist'
   ```sql
   SELECT id, email, role FROM users WHERE role='receptionist';
   ```

3. **Check browser console**: Look for API errors in developer tools

4. **Verify backend logs**: Check for notification creation errors

### Invoice not completing visit
1. **Check visit_id**: Ensure invoice has valid visit_id
   ```sql
   SELECT id, visit_id, status FROM invoices WHERE id='your_invoice_id';
   ```

2. **Check backend logs**: Look for "Completing visit:" message

3. **Verify Visit.service.js**: Ensure updateVisitStatus method exists

### Prescriptions not loading
1. **Check prescription data**: Verify prescriptions exist for visit
   ```sql
   SELECT * FROM prescriptions WHERE visit_id='your_visit_id';
   ```

2. **Check browser network tab**: Look for failed API calls

3. **Backend logs**: Check for "Loading prescriptions" messages

## Future Enhancements

Potential improvements to consider:
- **WebSocket Integration**: Real-time notifications without polling
- **Notification Types**: Appointment reminders, lab results ready, etc.
- **Push Notifications**: Browser push notifications when page is in background
- **Notification History**: Full notification history page
- **Notification Settings**: User preferences for notification types
- **Email Notifications**: Send email for critical notifications
- **SMS Integration**: Text notifications for urgent matters

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review backend logs: `backend/logs/` or console output
3. Check browser developer console for frontend errors
4. Verify database connectivity and RLS policies
5. Ensure all migrations have been run successfully

---

**System Status**: ✅ Production Ready
**Last Updated**: 2024
**Version**: 1.0.0

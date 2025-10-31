# Audit Logging Summary

## 🎯 What Gets Logged (Critical Actions Only):

### ✅ **Authentication Events:**
- `LOGIN_SUCCESS` - Successful login
- `LOGIN_FAILURE` - Failed login attempt
- `LOGOUT` - User logout
- **Location**: `auth.routes.js`

### ✅ **Walk-in Patient Flow:**

**1. Walk-in Registration** 🚶‍♂️
- **Action**: Receptionist creates walk-in
- **Log**: `CREATE visits` (source: walk_in_registration)
- **Location**: `Queue.service.js`

**2. Nurse Records Vitals** 🩺
- **Action**: Nurse enters patient vitals
- **Log**: `CREATE vitals`
- **Location**: `Vitals.service.js`

**3. Doctor Starts Consultation** 👨‍⚕️
- **Action**: Doctor clicks "Start Consultation"
- **Log**: `UPDATE visits` (action_type: consultation_started)
- **Location**: `Queue.service.js`

**4. Doctor Completes Visit** ✅
- **Action**: Doctor clicks "Complete Visit"
- **Log**: `UPDATE visits`
- **Location**: `visit.routes.js`

### ✅ **Data Modifications:**
- `CREATE` / `UPDATE` / `DELETE` appointments - `appointment.routes.js`
- `CREATE` / `UPDATE` / `DELETE` diagnoses - `patientDiagnosis.routes.js`
- `CREATE` / `UPDATE` / `DELETE` prescriptions - `prescription.routes.js`
- `CREATE` / `UPDATE` / `DELETE` / `ACTIVATE` / `DEACTIVATE` users - `user.routes.js`

### ✅ **Document Management:**
- `UPLOAD` documents - `document.routes.js`
- `DOWNLOAD` documents - `document.routes.js`

---

## ❌ What is NOT Logged (To Avoid Noise):

- ❌ **Viewing/Reading** data (patients, visits, appointments, etc.)
- ❌ **Searching/Filtering** operations
- ❌ **Dashboard views**
- ❌ **List retrievals**

**Reason**: These actions don't modify data and would generate excessive log entries, filling up the database and making it hard to find critical events.

---

## 🔄 To Activate:

1. **Run the updated migration** (if not already done):
   ```sql
   -- Migration 006 (removes VIEW from allowed actions)
   ```

2. **Restart backend server** to load updated code:
   ```powershell
   cd backend
   npm start
   ```

3. **Test the flow:**
   - Login → Check audit log
   - Create walk-in → Check audit log
   - Record vitals → Check audit log
   - Start consultation → Check audit log
   - Complete visit → Check audit log

4. **View logs** at: `/admin/audit-logs` page

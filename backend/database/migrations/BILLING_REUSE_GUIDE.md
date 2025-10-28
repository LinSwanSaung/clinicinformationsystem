# Billing System - Reusing Existing Services

## ✅ Migration Updated
- **Removed**: `medicine_inventory` table (no inventory tracking)
- **Kept**: 4 core tables (services, invoices, invoice_items, payment_transactions)
- **Medicine Prices**: Cashier enters manually per transaction

## 🔄 Existing Services to Reuse

### 1. **Visit.service.js** ✅
**What we can reuse:**
- `getVisitById()` - Get visit details for invoice creation
- `updateVisit()` - Update visit status when invoice is completed
- `completeVisit()` - Mark visit as completed when invoice is paid

**Integration points:**
```javascript
// When creating invoice
const visit = await VisitService.getVisitById(visitId);
const invoice = await InvoiceService.createInvoice({
  visit_id: visit.id,
  patient_id: visit.patient_id
});
```

### 2. **Prescription.service.js** ✅
**What we can reuse:**
- `getPrescriptionsByVisit()` - Get medicines prescribed during visit
- Prescription data for adding medicines to invoice items

**Integration points:**
```javascript
// When building invoice, get prescribed medicines
const prescriptions = await PrescriptionService.getPrescriptionsByVisit(visitId);
prescriptions.forEach(rx => {
  invoiceItems.push({
    item_type: 'medicine',
    item_id: rx.id,
    item_name: rx.medication_name,
    quantity: rx.quantity
    // Price entered by cashier
  });
});
```

### 3. **Patient.service.js** ✅
**What we can reuse:**
- `getPatientById()` - Get patient details for invoice header
- Patient information for billing records

**Integration points:**
```javascript
// Get patient info for invoice
const patient = await PatientService.getPatientById(patientId);
const invoice = {
  patient_id: patient.id,
  patient_name: patient.full_name // for display
};
```

### 4. **Auth.service.js** ✅
**What we can reuse:**
- User authentication for cashier/doctor roles
- `getUserById()` - Track who created/completed invoices

**Integration points:**
```javascript
// Track cashier actions
const invoice = await InvoiceService.createInvoice({
  created_by: req.user.id,  // from Auth middleware
  completed_by: cashierId
});
```

## 🆕 New Services Needed

### 1. **Service.service.js** (NEW)
**Purpose**: Manage billable services catalog
```javascript
class ServiceService {
  async getActiveServices() // Get all active services for selection
  async getServiceById(id)
  async createService(data) // Admin adds new service
  async updateServicePrice(id, price) // Update default price
  async searchServices(query) // Search by name/code
}
```

### 2. **Invoice.service.js** (NEW)
**Purpose**: Manage invoices
```javascript
class InvoiceService {
  async createInvoice(visitId, patientId, createdBy)
  async getInvoiceByVisit(visitId)
  async updateInvoice(id, updates) // Cashier edits
  async addInvoiceItem(invoiceId, item) // Add service/medicine
  async removeInvoiceItem(itemId)
  async calculateTotal(invoiceId) // Recalculate totals
  async completeInvoice(invoiceId, paymentData, cashierId)
  async getPendingInvoices() // For cashier dashboard
  async cancelInvoice(invoiceId, reason, userId)
}
```

### 3. **Payment.service.js** (NEW)
**Purpose**: Handle payments
```javascript
class PaymentService {
  async recordPayment(invoiceId, paymentData, cashierId)
  async getPaymentsByInvoice(invoiceId)
  async getPaymentReport(startDate, endDate) // Financial reports
}
```

## 📋 Implementation Plan

### Phase 1: Backend Foundation (Do First)
1. ✅ Run migration: `003_billing_system.sql`
2. Create Models:
   - `Service.model.js` (using BaseModel pattern)
   - `Invoice.model.js`
   - `InvoiceItem.model.js`
   - `PaymentTransaction.model.js`
3. Create Services:
   - `Service.service.js`
   - `Invoice.service.js`
   - `Payment.service.js`
4. Create Routes:
   - `service.routes.js`
   - `invoice.routes.js`
   - `payment.routes.js`
5. Register routes in `app.js`

### Phase 2: Frontend Integration
1. Create Frontend Services:
   - `serviceService.js` (frontend/src/services/)
   - `invoiceService.js`
   - `paymentService.js`
2. Create Components:
   - `ServiceSelector.jsx` (for doctor to select services)
   - `InvoiceForm.jsx` (cashier edits invoice)
   - `PaymentForm.jsx` (process payment)
3. Create Pages:
   - `CashierDashboard.jsx` (pending invoices list)
   - `InvoicePage.jsx` (view/edit invoice)

### Phase 3: Workflow Integration
1. **Doctor adds services during consultation:**
   - Add ServiceSelector to PatientMedicalRecord
   - Create draft invoice items when doctor selects services
2. **Cashier completes billing:**
   - View pending invoices from visits
   - Edit prices, add medicines manually
   - Process payment and complete invoice
3. **Automatic invoice creation:**
   - Auto-create invoice when visit starts
   - Link prescriptions to invoice items
   - Mark visit as completed when invoice paid

## 🔗 Data Flow

```
DOCTOR WORKFLOW:
1. Start Consultation (Queue.service → Visit.service)
2. Add Clinical Notes (DoctorNote.service)
3. Add Prescriptions (Prescription.service)
4. Select Services (NEW: Invoice.service.addInvoiceItem)
   → Auto-creates draft invoice

CASHIER WORKFLOW:
1. View Pending Invoices (NEW: Invoice.service.getPendingInvoices)
2. Open Invoice (gets data from Invoice + Visit + Patient services)
3. Edit Prices (Invoice.service.updateInvoiceItem)
4. Add Medicines from Prescriptions (Prescription.service + Invoice.service)
5. Add Manual Medicine Entries (Invoice.service.addInvoiceItem)
6. Process Payment (Payment.service.recordPayment)
7. Complete Invoice (Invoice.service.completeInvoice)
   → Updates invoice status
   → Completes visit (Visit.service.completeVisit)
```

## 💡 Key Integration Points

### Invoice Auto-Creation
```javascript
// In Queue.service.js - when starting consultation
async startConsultation(tokenId, doctorId) {
  // ... existing visit creation code ...
  
  // NEW: Auto-create invoice
  await InvoiceService.createInvoice({
    visit_id: visit.id,
    patient_id: visit.patient_id,
    created_by: doctorId
  });
}
```

### Prescription to Invoice Items
```javascript
// In Invoice.service.js
async addPrescriptionsToInvoice(invoiceId, visitId) {
  const prescriptions = await PrescriptionService.getPrescriptionsByVisit(visitId);
  
  for (const rx of prescriptions) {
    await this.addInvoiceItem(invoiceId, {
      item_type: 'medicine',
      item_id: rx.id,
      item_name: `${rx.medication_name} ${rx.dosage}`,
      quantity: rx.quantity || 1,
      unit_price: 0, // Cashier enters price
      notes: rx.instructions
    });
  }
}
```

### Complete Payment → Complete Visit
```javascript
// In Invoice.service.js
async completeInvoice(invoiceId, paymentData, cashierId) {
  // Record payment
  await PaymentService.recordPayment(invoiceId, paymentData, cashierId);
  
  // Update invoice
  const invoice = await this.updateInvoice(invoiceId, {
    status: 'paid',
    completed_by: cashierId,
    completed_at: new Date()
  });
  
  // Complete associated visit
  await VisitService.completeVisit(invoice.visit_id, {
    completed_by: cashierId
  });
}
```

## ✅ Next Steps

1. **Run the migration** in Supabase SQL Editor
2. **Create backend models** following BaseModel pattern
3. **Implement services** reusing existing service patterns
4. **Test backend** with Postman/REST client
5. **Build frontend** components and pages
6. **Integrate** into existing workflows

Would you like me to start implementing the backend models and services?

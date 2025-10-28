# Billing System Implementation Guide

## Overview
Complete purchasing/billing system for clinic with the following workflow:
1. **Doctor**: Adds services during consultation
2. **Cashier**: Edits prices, dispenses medicine, completes invoice
3. **Patient**: Receives detailed invoice and makes payment

## Database Schema

### New Tables Created

#### 1. **services** - Available billable services
- Stores all services (consultations, procedures, lab tests, imaging)
- Has default prices that can be overridden per invoice
- Categorized for easy filtering

#### 2. **invoices** - Main bill for each visit
- One invoice per visit
- Tracks total, paid amount, balance
- Status: pending → partial → paid → cancelled
- Auto-generates invoice numbers (INV-YYYYMMDD-0001)

#### 3. **invoice_items** - Line items on invoice
- Services performed
- Medicines dispensed
- Quantity, unit price, total
- Can be added by doctor or cashier

#### 4. **payment_transactions** - Payment records
- Multiple payments possible per invoice
- Tracks payment method, amount, who received
- Links to invoice

#### 5. **medicine_inventory** - Medicine stock (optional)
- Track medicine prices and stock levels
- Integration with prescriptions

## Workflow

### 1. Doctor Adds Services (During Consultation)
```
PatientMedicalRecord.jsx (Doctor Dashboard)
↓
When doctor completes consultation:
- Select services from list (consultation, procedures, tests)
- Services auto-create invoice_items
- Invoice created in "pending" status
```

### 2. Cashier Processes Payment
```
CashierDashboard.jsx or BillingPage.jsx
↓
Cashier can:
- View pending invoices
- Edit prices/quantities
- Add medicine costs from prescriptions
- Apply discounts
- Record payments
- Print invoice receipt
- Mark invoice as "paid"
```

## Implementation Plan

### Phase 1: Backend API (Priority)

#### Models to Create:
1. `Service.model.js` - CRUD for services
2. `Invoice.model.js` - Invoice operations
3. `InvoiceItem.model.js` - Line item operations
4. `PaymentTransaction.model.js` - Payment tracking
5. `MedicineInventory.model.js` - Medicine pricing

#### Services to Create:
1. `Service.service.js` - Business logic
2. `Invoice.service.js` - Calculate totals, validate
3. `Payment.service.js` - Process payments

#### Routes to Create:
1. `service.routes.js`
   - GET /api/services (list all active)
   - POST /api/services (create - admin only)
   - PATCH /api/services/:id (update price)

2. `invoice.routes.js`
   - POST /api/invoices (create from visit)
   - GET /api/invoices/visit/:visitId
   - GET /api/invoices/patient/:patientId
   - GET /api/invoices?status=pending (for cashier)
   - PATCH /api/invoices/:id (update totals)
   - POST /api/invoices/:id/complete

3. `invoiceItem.routes.js`
   - POST /api/invoice-items (add item)
   - PATCH /api/invoice-items/:id (edit price/qty)
   - DELETE /api/invoice-items/:id

4. `payment.routes.js`
   - POST /api/payments (record payment)
   - GET /api/payments/invoice/:invoiceId

### Phase 2: Frontend Components

#### Doctor Components:
1. **ServiceSelector.jsx**
   - Modal/section in consultation form
   - Checkboxes for common services
   - Auto-calculates estimated bill

2. **Update PatientMedicalRecord.jsx**
   - Add "Services" tab or section
   - Doctor selects services during consultation
   - Services saved when completing visit

#### Cashier Components:
1. **CashierDashboard.jsx**
   - List pending invoices
   - Quick access to process payments

2. **BillingPage.jsx** (Main billing interface)
   - Invoice details display
   - Edit line items (price, quantity)
   - Add medicines from prescriptions
   - Apply discounts
   - Payment form
   - Print invoice

3. **InvoiceReceipt.jsx**
   - Printable invoice template
   - Clinic header, patient info
   - Itemized list
   - Payment summary

4. **MedicineDispenseForm.jsx**
   - Select from prescribed medications
   - Add to invoice with prices
   - Update inventory (if tracking)

### Phase 3: Integration Points

#### Visit Completion Flow:
```javascript
// In PatientMedicalRecord.jsx - when doctor completes visit
async handleCompleteVisit() {
  // 1. Save diagnosis, allergies, prescriptions (existing)
  // 2. Create invoice with selected services
  const invoiceData = {
    visit_id: activeVisitId,
    patient_id: patientId,
    items: selectedServices.map(s => ({
      item_type: 'service',
      item_id: s.id,
      item_name: s.service_name,
      quantity: 1,
      unit_price: s.default_price,
      total_price: s.default_price
    }))
  };
  await invoiceService.createInvoice(invoiceData);
  // 3. Mark visit as completed
  await visitService.completeVisit(visitId);
}
```

#### Cashier Payment Flow:
```javascript
// In BillingPage.jsx
async handleProcessPayment() {
  // 1. Validate all items have prices
  // 2. Calculate totals
  // 3. Record payment
  await paymentService.createPayment({
    invoice_id: invoiceId,
    amount: paymentAmount,
    payment_method: selectedMethod,
    received_by: cashierId
  });
  // 4. Update invoice status
  // 5. Print receipt
}
```

## Installation Steps

### Step 1: Run Database Migration
```sql
-- In Supabase SQL Editor, run:
-- File: backend/database/migrations/003_billing_system.sql
```

### Step 2: Create Backend Files
```bash
# Models
backend/src/models/Service.model.js
backend/src/models/Invoice.model.js
backend/src/models/InvoiceItem.model.js
backend/src/models/PaymentTransaction.model.js
backend/src/models/MedicineInventory.model.js

# Services
backend/src/services/Service.service.js
backend/src/services/Invoice.service.js
backend/src/services/Payment.service.js

# Routes
backend/src/routes/service.routes.js
backend/src/routes/invoice.routes.js
backend/src/routes/payment.routes.js

# Register in app.js
import serviceRoutes from './routes/service.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import paymentRoutes from './routes/payment.routes.js';

app.use('/api/services', serviceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
```

### Step 3: Create Frontend Files
```bash
# Services
frontend/src/services/serviceService.js
frontend/src/services/invoiceService.js
frontend/src/services/paymentService.js

# Components
frontend/src/components/billing/ServiceSelector.jsx
frontend/src/components/billing/InvoiceItemList.jsx
frontend/src/components/billing/PaymentForm.jsx
frontend/src/components/billing/InvoiceReceipt.jsx

# Pages
frontend/src/pages/cashier/CashierDashboard.jsx
frontend/src/pages/cashier/BillingPage.jsx
```

## Next Steps

Would you like me to:
1. ✅ Create the backend models and routes?
2. ✅ Create the frontend services?
3. ✅ Create the cashier dashboard component?
4. ✅ Create the billing page component?
5. ✅ Update the doctor's consultation to include service selection?

Let me know which part you'd like me to implement first!

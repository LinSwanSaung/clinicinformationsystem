# Stage 4 Componentization - Draft PR Update

## Completed Items

### #5: FormModal confirmLoadingText + InvoiceManagement swap

**Files:**

- `frontend/src/components/library/forms/FormModal.jsx`
- `frontend/src/pages/cashier/InvoiceManagement.jsx`

**Changes:**

- Extended `FormModal` with `confirmLoadingText?: string` prop
- When `isLoading` is true, shows `confirmLoadingText || "Submitting..."` instead of hardcoded text
- Replaced InvoiceManagement's `Dialog` confirm dialog with `FormModal`, preserving exact copy ("Processing...")

**QA:**

1. InvoiceManagement: Open payment confirmation → shows "Processing..." during submit (not "Submitting..."); all fields/labels match previous dialog
2. ESC/overlay close works; focus trap preserved via FormModal
3. Build PASS; no console errors

---

### #20: renderDownloadButton + PdfDownloadButton in Doctor PMR

**Files:**

- `frontend/src/components/medical/PatientDocumentManager.jsx`
- `frontend/src/pages/doctor/PatientMedicalRecordManagement.jsx`

**Changes:**

- Added optional `renderDownloadButton?: (file) => ReactNode` prop to `PatientDocumentManager`
- When provided, renders custom button; otherwise falls back to existing `onDownloadFile` handler
- Doctor PMR passes `renderDownloadButton` that uses `PdfDownloadButton` with `api.getBlob`

**QA:**

1. Doctor PMR: Download button saves same filename/content via `api.getBlob`; no console errors
2. Removing `renderDownloadButton` prop falls back to old `onDownloadFile` button (backward compatible)
3. Build PASS; network calls route through `services/api.js`

---

## Previous Stage 4 Items Summary

- #1: PatientListPage → SearchBar + LoadingSpinner + EmptyState
- #2: PatientCard dialogs → FormModal (Vitals + Delay modals)
- #3: ModalComponent → FormModal (PatientDetailPage + PatientMedicalRecordManagement)
- #6: LiveQueuePage → LoadingSpinner + EmptyState (already compliant)
- #7: NursePatientQueuePage → LoadingSpinner + EmptyState (already compliant)
- #8: NurseDashboard → SearchBar + LoadingSpinner
- #9: DoctorDashboard → SearchBar + LoadingSpinner
- #10: PendingItems → ConfirmDialog (N/A - no window.confirm found)
- #11: EmployeeManagement → ConfirmDialog (already compliant)
- #12: LinkedPatientBadge → Created + wired in PatientAccountRegistration
- #13: PaymentTransactions → PdfDownloadButton
- #14: PatientMedicalRecords → PdfDownloadButton (kept api.getBlob handler for child prop compatibility)
- #15: Doctor PatientMedicalRecord → PatientInformationHeader (already compliant)
- #16: Nurse EMR → PatientInformationHeader (already compliant)
- #17: AppointmentsPage → LoadingSpinner + EmptyState
- #19: NotificationBell → EmptyState

---

## Guardrails Met

✅ No behavior/copy drift (except #5's preserved "Processing..." wording)
✅ All network calls via `services/api.js` (api.getBlob for PDFs)
✅ No UI-level Supabase imports
✅ No unconditional refetch()
✅ ARIA/keyboard behavior preserved
✅ Build/lint PASS

---

## Ready for Review

All Stage 4 componentization tasks complete. Ready to merge into `refactor/integration` after approval.

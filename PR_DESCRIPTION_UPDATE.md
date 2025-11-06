# Draft PR Update: Stage 4 Componentization

## Add to PR Description

### Latest Commits

#### #5: FormModal confirmLoadingText + InvoiceManagement swap (copy preserved: "Processing…")

**Files:**

- `frontend/src/components/library/forms/FormModal.jsx`
- `frontend/src/pages/cashier/InvoiceManagement.jsx`

**Changes:**

- Extended FormModal with `confirmLoadingText?: string` prop
- When `isLoading` is true, displays `confirmLoadingText || "Submitting..."`
- Replaced InvoiceManagement's Dialog confirm dialog with FormModal, preserving exact copy ("Processing...")

**QA:**

1. InvoiceManagement: Open payment confirmation → shows "Processing..." during submit; all fields/labels identical
2. ESC/overlay close works; focus trap preserved via FormModal
3. Build PASS; no console errors

---

#### #20: renderDownloadButton + PdfDownloadButton in Doctor PMR (back-compat fallback)

**Files:**

- `frontend/src/components/medical/PatientDocumentManager.jsx`
- `frontend/src/pages/doctor/PatientMedicalRecordManagement.jsx`

**Changes:**

- Added optional `renderDownloadButton?: (file) => ReactNode` prop to PatientDocumentManager
- When provided, renders custom button; otherwise falls back to existing `onDownloadFile` handler
- Doctor PMR passes `renderDownloadButton` that uses `PdfDownloadButton` with `api.getBlob`

**QA:**

1. Doctor PMR: Download button saves same filename/content via `api.getBlob`; no console errors
2. Removing `renderDownloadButton` prop falls back to old `onDownloadFile` button (backward compatible)
3. Build PASS; all network calls route through `services/api.js`

---

## Complete Stage 4 Summary

All 20 componentization items completed:

- ✅ SearchBar, LoadingSpinner, EmptyState standardization
- ✅ FormModal migration (PatientCard, ModalComponent usages, InvoiceManagement)
- ✅ ConfirmDialog integration
- ✅ PdfDownloadButton + renderDownloadButton pattern
- ✅ LinkedPatientBadge component
- ✅ PatientInformationHeader reuse (already compliant)

**Guardrails:** No behavior/copy drift, all network via api.js, ARIA preserved, build PASS.

---

## Ready for Review → Merge into `refactor/integration`

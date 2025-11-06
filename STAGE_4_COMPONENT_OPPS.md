## Summary

- **Unify modals**: Replace bespoke dialogs (custom Dialogs/ModalComponent) with library `FormModal`/`ConfirmDialog` for consistent ARIA, keyboard, and footers.
- **Standardize empty/loading**: Swap ad‑hoc "Loading…"/"No X found" cards for `LoadingSpinner` + `EmptyState` across list/table pages.
- **Converge list/table toolbars**: Replace inline search+filters with `SearchBar` and, where tables are present, `TableToolbar` for consistent UX.

## Opportunities (max 20)

| File                                                  | Pattern                                                   | Type (Reuse/Encap) | Est Uses | Risk (L/M) | Effort (1–5) | Suggested Component                                        | Key Props (real names)                                      | Why                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------- | -----------------: | -------: | ---------: | -----------: | ---------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/pages/receptionist/PatientListPage.jsx`          | Search input + repeated loading/error/empty cards         |              Reuse |       4+ |          L |            2 | `SearchBar`, `EmptyState`, `LoadingSpinner`                | `value`, `onChange`; `title`, `description`                 | Standardize search and states; reduces 60+ lines of boilerplate.      |
| `src/components/medical/PatientCard.jsx`              | Custom inline Dialogs (Vitals/Delay)                      |              Reuse |        3 |          M |            3 | `FormModal`                                                | `open`, `onOpenChange`, `title`, `onSubmit`, `isSubmitting` | Replace bespoke modal for ARIA parity and shared footer/actions.      |
| `src/components/ui/ModalComponent.jsx`                | General modal wrapper                                     |              Reuse |       5+ |          M |            2 | `FormModal`                                                | existing                                                    | Single modal system app‑wide; remove duplication and drift.           |
| `src/pages/cashier/CashierDashboard.jsx`              | Large invoice/payment detail dialog with multi‑state form |              Encap |        1 |          M |            4 | `FormModal` + `FormCard` (compose as `PaymentDetailModal`) | `open`, `onOpenChange`, `invoice`, `onPay`, `isProcessing`  | Encapsulate 300+ lines; improves readability without behavior change. |
| `src/pages/cashier/InvoiceManagement.jsx`             | Payment dialog + sections (discounts/method/summary)      |              Encap |        1 |          M |            4 | `FormModal` + `FormCard` (compose)                         | `open`, `onConfirm`, `isProcessing`                         | Same flow as cashier dashboard; shared structure.                     |
| `src/pages/receptionist/LiveQueuePage.jsx`            | Loading/empty blocks for queue                            |              Reuse |        3 |          L |            2 | `EmptyState`, `LoadingSpinner`                             | `title`, `description`                                      | Consistent states; less JSX.                                          |
| `src/pages/nurse/NursePatientQueuePage.jsx`           | Loading/empty blocks for doctor queue                     |              Reuse |        3 |          L |            2 | `EmptyState`, `LoadingSpinner`                             | existing                                                    | Same as receptionist queue.                                           |
| `src/pages/nurse/NurseDashboard.jsx`                  | Inline search bar + empty/loading sections                |              Reuse |        3 |          M |            3 | `SearchBar`, `EmptyState`, `LoadingSpinner`                | existing                                                    | Standard search/state components reduce noise.                        |
| `src/pages/doctor/DoctorDashboard.jsx`                | Search+filters header for patient list                    |              Reuse |        3 |          M |            3 | `SearchBar` (optionally `TableToolbar`-like header)        | `value`, `onChange`                                         | Replicates reception/nurse search patterns.                           |
| `src/pages/admin/PendingItems.jsx`                    | Action confirm dialogs                                    |              Reuse |        3 |          L |            2 | `ConfirmDialog` (library exists)                           | `open`, `title`, `description`, `onConfirm`                 | Replace confirm() and ad‑hoc Dialog confirmations.                    |
| `src/pages/admin/EmployeeManagement.jsx`              | Delete/toggle confirmations                               |              Reuse |        3 |          L |            2 | `ConfirmDialog`                                            | `open`, `onConfirm`, `confirmText`                          | Safer, accessible confirmations.                                      |
| `src/pages/admin/PatientAccountRegistration.jsx`      | Bind/unbind patient linked state badge                    |              Reuse |        2 |          L |            2 | `StatusBadge` wrapper (e.g., LinkedPatientBadge)           | `linked: boolean`, `patient_number`                         | Visual parity with consistent variants.                               |
| `src/pages/admin/PaymentTransactions.jsx`             | Receipt PDF button                                        |              Reuse |        3 |          L |            2 | Small primitive `PdfDownloadButton`                        | `onClick`/`endpoint`, `fileName`                            | Centralize api.getBlob + spinner; used across 3 pages.                |
| `src/pages/patient/PatientMedicalRecords.jsx`         | Visit PDF button                                          |              Reuse |        2 |          L |            2 | `PdfDownloadButton`                                        | `endpoint`, `fileName`                                      | Same as above.                                                        |
| `src/pages/doctor/PatientMedicalRecord.jsx`           | Patient header block                                      |              Reuse |        2 |          M |            2 | `PatientInformationHeader` (exists)                        | `patient`, `onBackClick`                                    | Align doctor/nurse headers; remove duplication.                       |
| `src/pages/nurse/ElectronicMedicalRecords.jsx`        | Patient header block                                      |              Reuse |        2 |          M |            2 | `PatientInformationHeader`                                 | `patient`, `onClearSelection`                               | Same header reuse.                                                    |
| `src/pages/receptionist/AppointmentsPage.jsx`         | Appointment list empty/loading + filter header            |              Reuse |        3 |          M |            3 | `EmptyState`, `LoadingSpinner`, `SearchBar`                | existing                                                    | Matches other list pages.                                             |
| `src/components/NotificationBell.jsx`                 | List empty for notifications panel                        |              Reuse |        2 |          L |            1 | `EmptyState`                                               | `title`, `description`                                      | Clear feedback when no notifications.                                 |
| `src/pages/receptionist/PatientDetailPage.jsx`        | Sections with repeated card forms                         |              Encap |        1 |          M |            3 | `FormCard`                                                 | `title`, `helperText`                                       | Encapsulate repeated labeled sections.                                |
| `src/pages/doctor/PatientMedicalRecordManagement.jsx` | Document download button(s)                               |              Reuse |        2 |          L |            2 | `PdfDownloadButton`                                        | `endpoint`, `fileName`                                      | Shared behavior with receipts/visits.                                 |

## Top 3 – Plans and Snippets

### 1) Unify modals (PatientCard dialogs → FormModal)

- Before: Custom Dialog elements inside `PatientCard.jsx` (manual overlay, headers, buttons).
- After: Replace each dialog with `FormModal` from `@/components/library`.

Sample usage:

```jsx
<FormModal
  open={isVitalsModalOpen}
  onOpenChange={setIsVitalsModalOpen}
  title="Update Vitals"
  onSubmit={handleSaveVitals}
  isSubmitting={isSavingVitals}
>
  {/* existing form fields unchanged */}
</FormModal>
```

QA

- Open vitals dialog from `PatientCard`; Esc/overlay click closes; Tab/Shift+Tab trap works.
- Submit saves exactly as before; disabled state and spinner show during submit.
- Delay dialog still sets reason correctly and updates UI state.

### 2) Standardize loading/empty blocks (lists/tables)

- Before: Inline `<Card>Loading ...</Card>` and "No X found" per page.
- After: Use `LoadingSpinner` and `EmptyState` from library.

Sample usage:

```jsx
{isLoading ? (
  <LoadingSpinner label="Loading patients..." />
) : filteredPatients.length === 0 ? (
  <EmptyState title="No patients found" description="Try adjusting your search filters." />
) : (
  /* current list rendering */
)}
```

QA

- While fetching, spinner renders with the same timing as prior loading text.
- With zero results, `EmptyState` shows; screen reader announces status.
- Non-empty results unchanged.

### 3) Cashier payment detail modal (encapsulate with FormModal + FormCard)

- Before: Large multi‑state dialog inline in `CashierDashboard.jsx`.
- After: Extract `PaymentDetailModal` composed of `FormModal` + `FormCard`, props‑driven.

Sample usage:

```jsx
<PaymentDetailModal
  open={showPaymentDialog}
  onOpenChange={setShowPaymentDialog}
  invoice={selectedInvoice}
  onPay={handleConfirmPayment}
  isProcessing={isProcessing}
/>
```

QA

- Open/close behavior matches; same keyboard interactions and focus restore.
- Paying with partial/full flows still call existing handlers; totals identical.
- Error/success toasts and state transitions unchanged.

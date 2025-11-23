import { FormModal } from '@/components/library';

/**
 * PaymentDetailModal
 * Shell modal for cashier payment processing, preserving existing behavior.
 * Uses FormModal for accessible dialog shell. Content is provided via children.
 *
 * Props:
 * - open: boolean
 * - onOpenChange: (open:boolean) => void
 * - invoice: object (existing shape)
 * - onPay: (invoiceId, payload) => Promise<void>
 * - isProcessing: boolean
 * - onDownloadReceipt?: (invoiceId) => Promise<void>
 * - children: ReactNode (existing content from page)
 */
export function PaymentDetailModal({
  open,
  onOpenChange,
  invoice,
  onPay,
  isProcessing,
  onDownloadReceipt: _onDownloadReceipt, // reserved for future use; behavior unchanged today
  children,
}) {
  // Prevent form auto-submission when invoice updates (e.g., after adding a service)
  // Only call onPay when explicitly triggered by button click, not on form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only call onPay if this is an explicit button click (not auto-submit from form changes)
    // Check if the event was triggered by a button click
    const isButtonClick =
      e.nativeEvent?.submitter?.type === 'submit' ||
      e.target?.querySelector('button[type="submit"]:focus');

    if (isButtonClick && typeof onPay === 'function' && invoice?.id) {
      // This is an explicit button click - safe to call onPay
      onPay();
    }
    // Otherwise, do nothing (prevents auto-submit when invoice updates)
  };

  return (
    <FormModal
      isOpen={open}
      onOpenChange={onOpenChange}
      title={`Process Invoice - ${invoice?.invoice_number || invoice?.id || ''}`}
      onSubmit={handleSubmit}
      isLoading={!!isProcessing}
      size="xl"
      className="flex h-full max-h-[95vh] w-full max-w-[95vw] flex-col"
      submitDisabled={true} // Disable submit button - payment handled by button in children
      submitText="" // Hide submit button text
    >
      <div className="flex-1 overflow-y-auto">{children}</div>
    </FormModal>
  );
}

export default PaymentDetailModal;

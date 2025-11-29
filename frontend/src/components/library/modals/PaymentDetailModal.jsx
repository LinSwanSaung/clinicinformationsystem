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
  // Only call onPay when explicitly triggered by the "Process Payment" button, not on form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only call onPay if this is an explicit submit button click
    // Check if the event was triggered by a submit button (not just any button)
    const submitter = e.nativeEvent?.submitter;
    const isSubmitButton =
      submitter?.type === 'submit' || submitter?.getAttribute('data-submit') === 'true';

    if (isSubmitButton && typeof onPay === 'function' && invoice?.id) {
      onPay();
    }
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

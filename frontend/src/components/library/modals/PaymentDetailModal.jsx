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
  onDownloadReceipt, // reserved for future use; behavior unchanged today
  children,
}) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Don't auto-submit - let the parent component handle the confirmation dialog
    // The parent should open a confirmation dialog before calling onPay
    if (typeof onPay === 'function' && invoice?.id) {
      // Call onPay which should open the confirmation dialog, not process directly
      onPay();
    }
  };

  return (
    <FormModal
      isOpen={open}
      onOpenChange={onOpenChange}
      title={`Process Invoice - ${invoice?.id ?? ''}`}
      onSubmit={handleSubmit}
      isLoading={!!isProcessing}
      size="xl"
      className="max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col"
    >
      <div className="overflow-y-auto flex-1">
        {children}
      </div>
    </FormModal>
  );
}

export default PaymentDetailModal;



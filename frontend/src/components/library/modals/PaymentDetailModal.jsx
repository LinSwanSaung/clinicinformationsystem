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
  const handleSubmit = async () => {
    if (typeof onPay === 'function' && invoice?.id) {
      await onPay(invoice.id);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Process Invoice - ${invoice?.id ?? ''}`}
      onSubmit={handleSubmit}
      isSubmitting={!!isProcessing}
    >
      {children}
    </FormModal>
  );
}

export default PaymentDetailModal;



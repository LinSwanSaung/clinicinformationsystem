import { StatusBadge } from '@/components/library';

/**
 * LinkedPatientBadge
 * Small wrapper around StatusBadge to display linked/unlinked patient state.
 * Props:
 * - linked: boolean
 * - patientNumber?: string
 * - className?: string
 */
export function LinkedPatientBadge({ linked, patientNumber, className }) {
  if (linked) {
    return (
      <StatusBadge status="linked" variant="secondary" className={className}>
        Linked{patientNumber ? ` • ${patientNumber}` : ''}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge status="unlinked" variant="outline" className={className}>
      Unlinked
    </StatusBadge>
  );
}

export default LinkedPatientBadge;

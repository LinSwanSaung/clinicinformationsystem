import LoadingState from '@components/library/feedback/LoadingSpinner';
import EmptyState from '@components/library/feedback/EmptyState';
import ErrorState from '@components/library/feedback/ErrorState';

export default function DataList({
  data,
  isLoading = false,
  error = null,
  emptyMessage = 'No data found',
  loadingMessage = 'Loading...',
  onRetry,
  renderItem,
  className = '',
  children,
}) {
  // Error state
  if (error) {
    return (
      <ErrorState
        message="Failed to load data"
        description={error.message || error}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingState message={loadingMessage} className={className} />;
  }

  // Empty state
  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} className={className} />;
  }

  // Data rendering
  return (
    <div className={`grid gap-6 ${className}`}>
      {data.map((item, index) => (
        <div key={item.id || index}>
          {renderItem ? renderItem(item, index) : children?.(item, index)}
        </div>
      ))}
    </div>
  );
}

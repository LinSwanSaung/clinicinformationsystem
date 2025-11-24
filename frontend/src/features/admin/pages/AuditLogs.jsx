import { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Eye, X } from 'lucide-react';
import { auditLogService } from '@/features/admin';
import { DataTable, StatusBadge } from '@/components/library';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import logger from '@/utils/logger';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    start_date: '',
    end_date: '',
    limit: 50,
    offset: 0,
  });
  const [filterOptions, setFilterOptions] = useState({ actions: [], entities: [] });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      const options = await auditLogService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      logger.error('Failed to load filter options:', error);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.action) {
        params.action = filters.action;
      }
      if (filters.entity) {
        params.entity = filters.entity;
      }
      if (filters.start_date) {
        params.start_date = filters.start_date;
      }
      if (filters.end_date) {
        params.end_date = filters.end_date;
      }
      params.limit = filters.limit;
      params.offset = filters.offset;

      const response = await auditLogService.getAuditLogs(params);
      setLogs(response?.data || []);
      setTotal(response?.total || 0);
    } catch (error) {
      logger.error('Failed to load audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleApplyFilters = () => {
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({ action: '', entity: '', start_date: '', end_date: '', limit: 50, offset: 0 });
    setTimeout(() => loadLogs(), 100);
  };

  const handlePageChange = (newPage) => {
    const newOffset = (newPage - 1) * filters.limit;
    setFilters((prev) => ({ ...prev, offset: newOffset }));
    setTimeout(() => loadLogs(), 100);
  };

  // Helper function to format changes for display
  const formatChanges = (oldValues, newValues) => {
    if (!oldValues && !newValues) {
      return null;
    }

    const changes = [];
    const allKeys = new Set([
      ...(oldValues ? Object.keys(oldValues) : []),
      ...(newValues ? Object.keys(newValues) : []),
    ]);

    allKeys.forEach((key) => {
      const oldVal = oldValues?.[key];
      const newVal = newValues?.[key];

      // Skip if values are the same
      if (JSON.stringify(oldVal) === JSON.stringify(newVal)) {
        return;
      }

      changes.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal,
      });
    });

    return changes.length > 0 ? changes : null;
  };

  // Helper function to format value for display
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="italic text-muted-foreground">null</span>;
    }
    if (typeof value === 'object') {
      return <code className="text-xs">{JSON.stringify(value, null, 2)}</code>;
    }
    if (typeof value === 'boolean') {
      return <span className="font-mono">{value.toString()}</span>;
    }
    return <span>{String(value)}</span>;
  };

  // Helper to get change summary text
  const getChangeSummary = (row) => {
    const changes = formatChanges(row.old_values, row.new_values);
    if (!changes) {
      if (row.action === 'CREATE') {
        return 'Record created';
      }
      if (row.action === 'DELETE') {
        return 'Record deleted';
      }
      if (row.action === 'LOGIN_SUCCESS' || row.action === 'LOGIN_FAILURE') {
        return 'Authentication event';
      }
      return 'No field changes';
    }
    if (changes.length === 1) {
      return `1 field changed: ${changes[0].field}`;
    }
    return `${changes.length} fields changed`;
  };

  const getActionBadgeVariant = (action) => {
    if (action?.includes('LOGIN')) {
      return 'secondary';
    }
    if (action === 'CREATE') {
      return 'default';
    }
    if (action === 'UPDATE') {
      return 'outline';
    }
    if (action === 'DELETE' || action === 'CANCEL') {
      return 'destructive';
    }
    return 'outline';
  };

  const getStatusBadgeVariant = (status) => {
    if (status === 'success') {
      return 'secondary';
    }
    if (status === 'failed') {
      return 'destructive';
    }
    if (status === 'denied' || status === 'warning') {
      return 'outline';
    }
    return 'outline';
  };

  const currentPage = Math.floor(filters.offset / filters.limit) + 1;

  return (
    <PageLayout
      title="System Audit Logs"
      subtitle="Monitor system activities and user actions"
      fullWidth
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-6">
          <div className="mb-4 flex items-center space-x-3">
            <Filter size={20} className="text-muted-foreground" />
            <h3 className="text-lg font-bold">Filters</h3>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Action</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">All Actions</option>
                {filterOptions.actions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Entity</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={filters.entity}
                onChange={(e) => handleFilterChange('entity', e.target.value)}
              >
                <option value="">All Entities</option>
                {filterOptions.entities.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Start Date</label>
              <input
                type="date"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">End Date</label>
              <input
                type="date"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearFilters}>
              Clear
            </Button>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Audit Logs ({total} total)</h3>
          </div>

          <DataTable
            columns={[
              {
                key: 'timestamp',
                label: 'Timestamp',
                render: (_, row) =>
                  new Date(row.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
              },
              {
                key: 'user',
                label: 'User',
                render: (_, row) => (
                  <div>
                    <p className="font-medium text-foreground">
                      {row.user ? `${row.user.first_name} ${row.user.last_name}` : 'System'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.actor_role || row.new_values?.role || row.user?.role || 'N/A'}
                    </p>
                  </div>
                ),
              },
              {
                key: 'action',
                label: 'Action',
                render: (_, row) => (
                  <StatusBadge status={row.action} variant={getActionBadgeVariant(row.action)}>
                    {row.action}
                  </StatusBadge>
                ),
              },
              {
                key: 'entity',
                label: 'Entity',
                render: (_, row) => (
                  <span className="text-foreground">{row.table_name || '—'}</span>
                ),
              },
              {
                key: 'record_id',
                label: 'Record ID',
                render: (_, row) => {
                  const recordId = row.record_id;
                  const isEmptyId =
                    !recordId || recordId === '00000000-0000-0000-0000-000000000000';
                  return (
                    <span className="font-mono text-xs text-muted-foreground">
                      {isEmptyId ? '—' : `${recordId.substring(0, 8)}...`}
                    </span>
                  );
                },
              },
              {
                key: 'changes',
                label: 'Changes',
                render: (_, row) => {
                  const changes = formatChanges(row.old_values, row.new_values);
                  const hasChanges = changes && changes.length > 0;
                  const hasDetails = hasChanges || row.old_values || row.new_values || row.reason;

                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{getChangeSummary(row)}</span>
                      {hasDetails && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(row);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'result',
                label: 'Result',
                render: (_, row) => (
                  <StatusBadge
                    status={row.status || 'N/A'}
                    variant={getStatusBadgeVariant(row.status)}
                  >
                    {row.status || 'N/A'}
                  </StatusBadge>
                ),
              },
              {
                key: 'ip',
                label: 'IP',
                render: (_, row) => (
                  <span className="text-xs text-muted-foreground">{row.ip_address || '—'}</span>
                ),
              },
            ]}
            data={logs}
            isLoading={loading}
            emptyText="No audit logs found."
            page={currentPage}
            pageSize={filters.limit}
            total={total}
            onPageChange={handlePageChange}
          />
        </Card>
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Audit Log Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>Detailed information about this audit log entry</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="mt-4 space-y-6">
              {/* Basic Information */}
              <div className="bg-muted/50 grid grid-cols-2 gap-4 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedLog.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-sm font-medium">
                    {selectedLog.user
                      ? `${selectedLog.user.first_name} ${selectedLog.user.last_name}`
                      : 'System'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLog.actor_role || selectedLog.user?.role || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <StatusBadge
                    status={selectedLog.action}
                    variant={getActionBadgeVariant(selectedLog.action)}
                  >
                    {selectedLog.action}
                  </StatusBadge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entity</p>
                  <p className="text-sm font-medium">{selectedLog.table_name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Record ID</p>
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    {selectedLog.record_id || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge
                    status={selectedLog.status || 'N/A'}
                    variant={getStatusBadgeVariant(selectedLog.status)}
                  >
                    {selectedLog.status || 'N/A'}
                  </StatusBadge>
                </div>
                {selectedLog.ip_address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                    <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User Agent</p>
                    <p className="break-all text-xs text-muted-foreground">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                )}
              </div>

              {/* Reason/Note */}
              {selectedLog.reason && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                  <p className="mb-1 text-sm font-medium text-blue-900 dark:text-blue-100">
                    Reason/Note
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{selectedLog.reason}</p>
                </div>
              )}

              {/* Changes Detail */}
              {(() => {
                const changes = formatChanges(selectedLog.old_values, selectedLog.new_values);
                if (!changes || changes.length === 0) {
                  return (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="mb-2 text-sm font-medium">Field Changes</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedLog.action === 'CREATE' && 'New record created'}
                        {selectedLog.action === 'DELETE' && 'Record deleted'}
                        {selectedLog.action === 'VIEW' && 'Record viewed'}
                        {!['CREATE', 'DELETE', 'VIEW'].includes(selectedLog.action) &&
                          'No field changes detected'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Field Changes ({changes.length})</p>
                    <div className="space-y-3">
                      {changes.map((change, idx) => (
                        <div
                          key={idx}
                          className="hover:bg-muted/50 rounded-lg border bg-card p-4 transition-colors"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">{change.field}</p>
                            <span className="bg-primary/10 rounded px-2 py-1 text-xs text-primary">
                              Changed
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Old Value</p>
                              <div className="min-h-[40px] rounded border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-950/20">
                                {formatValue(change.oldValue)}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">New Value</p>
                              <div className="min-h-[40px] rounded border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-950/20">
                                {formatValue(change.newValue)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Raw Data (for debugging) */}
              {(selectedLog.old_values || selectedLog.new_values) && (
                <details className="bg-muted/30 rounded-lg p-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                    Raw Data (JSON)
                  </summary>
                  <div className="mt-3 space-y-2">
                    {selectedLog.old_values && (
                      <div>
                        <p className="mb-1 text-xs font-medium">Old Values:</p>
                        <pre className="overflow-x-auto rounded border bg-background p-2 text-xs">
                          {JSON.stringify(selectedLog.old_values, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.new_values && (
                      <div>
                        <p className="mb-1 text-xs font-medium">New Values:</p>
                        <pre className="overflow-x-auto rounded border bg-background p-2 text-xs">
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default AuditLogs;
